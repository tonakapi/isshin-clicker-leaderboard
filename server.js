const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // Using node-fetch for older Node versions if needed, but fetch is standard in Node 18+

const app = express();
const port = process.env.PORT || 3000;

// --- GitHub Configuration ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DB_FILE_PATH = process.env.DB_FILE_PATH;

const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DB_FILE_PATH}`;
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${DB_FILE_PATH}`;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Helper Functions for GitHub API ---

// Fetches the raw content of db.json
async function getDbContent() {
    try {
        const response = await fetch(`${RAW_URL}?t=${new Date().getTime()}`); // Cache busting
        if (!response.ok) {
            // If file not found, return default structure
            if (response.status === 404) {
                return { scores: [] };
            }
            throw new Error(`GitHub raw content fetch failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in getDbContent:", error);
        // On any error, return an empty structure to avoid breaking the leaderboard display
        return { scores: [] };
    }
}

// Gets the file details (content and SHA) from GitHub
async function getFileFromGithub() {
    const response = await fetch(API_URL, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    if (!response.ok) {
        if (response.status === 404) {
            return { content: null, sha: null }; // File doesn't exist
        }
        throw new Error(`GitHub API fetch failed: ${await response.text()}`);
    }
    return await response.json();
}

// Updates or creates the file on GitHub
async function updateFileOnGithub(content, sha) {
    const contentBase64 = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    const body = {
        message: `Update leaderboard data - ${new Date().toISOString()}`,
        content: contentBase64,
        sha: sha, // Include SHA if updating an existing file
    };

    // If file doesn't exist, sha is null and should not be included
    if (!sha) {
        delete body.sha;
    }

    const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`GitHub API update failed: ${await response.text()}`);
    }
    return await response.json();
}

// --- Routes ---

// Route to serve the static leaderboard page (for direct access)
app.get('/', (req, res) => {
    res.send('Leaderboard server is running. Access the leaderboard display page to see the rankings.');
});

// Route to get the leaderboard data
app.get('/leaderboard', async (req, res) => {
    try {
        const db = await getDbContent();
        const leaderboard = db.scores
            .sort((a, b) => b.points - a.points)
            .slice(0, 100);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard data.' });
    }
});

// Route to submit a new score
app.post('/scores', async (req, res) => {
    const { name, points } = req.body;

    if (!name || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid data format.' });
    }

    try {
        // 1. Get current file from GitHub
        const { content, sha } = await getFileFromGithub();
        let db;
        if (content) {
            const decodedContent = Buffer.from(content, 'base64').toString('utf-8');
            db = JSON.parse(decodedContent);
        } else {
            db = { scores: [] }; // File doesn't exist, start with empty
        }
        
        // 2. Update logic
        const existingScoreIndex = db.scores.findIndex(score => score.name === name);
        let updated = false;

        if (existingScoreIndex !== -1) {
            if (points > db.scores[existingScoreIndex].points) {
                db.scores[existingScoreIndex].points = points;
                db.scores[existingScoreIndex].timestamp = new Date().toISOString();
                updated = true;
            }
        } else {
            const newScore = { name, points, timestamp: new Date().toISOString() };
            db.scores.push(newScore);
            updated = true;
        }

        // 3. If changed, push back to GitHub
        if (updated) {
            await updateFileOnGithub(db, sha);
            res.status(201).json({ message: 'Score submitted/updated successfully.' });
        } else {
            res.status(200).json({ message: 'Score not updated, as it is not higher than the existing score.' });
        }

    } catch (error) {
        console.error('Error processing score:', error);
        res.status(500).json({ error: 'Failed to process score.' });
    }
});

app.listen(port, () => {
    console.log(`Leaderboard server listening at http://localhost:${port}`);
});