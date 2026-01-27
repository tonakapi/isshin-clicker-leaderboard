const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const DB_PATH = './db.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Helper function to read the database
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist or is empty, return a default structure
        return { scores: [] };
    }
}

// Helper function to write to the database
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/leaderboard', (req, res) => {
    const db = readDB();
    // Sort scores in descending order and take the top 100
    const leaderboard = db.scores
        .sort((a, b) => b.points - a.points)
        .slice(0, 100);
    res.json(leaderboard);
});

app.post('/scores', (req, res) => {
    const { name, points } = req.body;

    if (!name || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid data format. "name" (string) and "points" (number) are required.' });
    }

    const db = readDB();
    const newScore = {
        name,
        points,
        timestamp: new Date().toISOString()
    };

    db.scores.push(newScore);
    writeDB(db);

    res.status(201).json({ message: 'Score submitted successfully.', score: newScore });
});

app.listen(port, () => {
    console.log(`Leaderboard server listening at http://localhost:${port}`);
});
