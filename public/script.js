document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
});

async function fetchLeaderboard() {
    // In a real deployment, you would use the actual server URL
    const API_URL = '/leaderboard'; // Assuming the server is serving this file

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leaderboardData = await response.json();
        renderLeaderboard(leaderboardData);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = '<tr><td colspan="3">ランキングの読み込みに失敗しました。</td></tr>';
    }
}

function renderLeaderboard(data) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = ''; // Clear existing data

    if (data.length === 0) {
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
