document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
});

// IMPORTANT: Replace this with your actual Render app URL
const API_BASE_URL = 'https://isshin-clicker-leaderboard.onrender.com';

async function fetchLeaderboard() {
    try {
        // Add a cache-busting parameter to the URL
        const response = await fetch(`${API_BASE_URL}/leaderboard?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leaderboard = await response.json();
        renderLeaderboard(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = '<tr><td colspan="3">ランキングの読み込みに失敗しました。サーバーが起動しているか確認してください。</td></tr>';
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

async function submitScore(event) {
    event.preventDefault();

    const nameInput = document.getElementById('name');
    const pointsInput = document.getElementById('points');
    const statusP = document.getElementById('submission-status');

    const name = nameInput.value;
    const points = parseInt(pointsInput.value, 10);

    statusP.textContent = '登録中...';

    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, points }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'スコアの登録に失敗しました。');
        }

        statusP.textContent = '登録に成功しました！ランキングが更新されます。';
        nameInput.value = '';
        pointsInput.value = '';

        // Refresh the leaderboard after a short delay
        setTimeout(fetchLeaderboard, 1000);

    } catch (error) {
        console.error('Error submitting score:', error);
        statusP.textContent = `エラー: ${error.message}`;
    }
}


function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}