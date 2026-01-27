document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
});

async function fetchLeaderboard() {
    const API_URL = 'https://raw.githubusercontent.com/tonakapi/isshin-clicker-leaderboard/main/leaderboard/db.json';

    try {
        // Add a cache-busting parameter to the URL
        const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const db = await response.json();
        renderLeaderboard(db.scores);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = '<tr><td colspan="3">ランキングの読み込みに失敗しました。</td></tr>';
    }
}

function renderLeaderboard(data) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = ''; // Clear existing data

    if (!data || data.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="3">まだランキングデータがありません。</td></tr>';
        return;
    }

    data.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHTML(score.name)}</td>
            <td>${score.points.toLocaleString()}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
