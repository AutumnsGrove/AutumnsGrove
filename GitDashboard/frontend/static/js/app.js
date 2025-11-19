// Git Dashboard - Hand-Drawn Visualization App
const API_BASE = 'http://localhost:8000/api';

let hoursChartInstance = null;
let daysChartInstance = null;

// Fetch and display stats
async function fetchStats() {
    const username = document.getElementById('username').value.trim();

    if (!username) {
        showError('Please enter a GitHub username!');
        return;
    }

    // Show loading, hide dashboard and errors
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');

    try {
        // Fetch user info
        const userResponse = await fetch(`${API_BASE}/user/${username}`);
        if (!userResponse.ok) {
            throw new Error('User not found');
        }
        const userData = await userResponse.json();
        displayUserInfo(userData);

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE}/stats/${username}?limit=15`);
        if (!statsResponse.ok) {
            throw new Error('Failed to fetch stats');
        }
        const stats = await statsResponse.json();
        displayStats(stats);

        // Show dashboard
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        showError(`Error: ${error.message}`);
    }
}

// Display user info
function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('userInfo');
    userInfoDiv.innerHTML = `
        <p><strong>Name:</strong> ${user.name || user.login}</p>
        <p><strong>Username:</strong> @${user.login}</p>
        <p><strong>Public Repos:</strong> ${user.public_repos}</p>
        <p><strong>Followers:</strong> ${user.followers} | <strong>Following:</strong> ${user.following}</p>
        ${user.bio ? `<p><strong>Bio:</strong> ${user.bio}</p>` : ''}
    `;
}

// Display stats
function displayStats(stats) {
    // Update stat cards
    document.getElementById('totalCommits').textContent = formatNumber(stats.total_commits);
    document.getElementById('totalAdditions').textContent = formatNumber(stats.total_additions);
    document.getElementById('totalDeletions').textContent = formatNumber(stats.total_deletions);
    document.getElementById('reposAnalyzed').textContent = stats.repos_analyzed;

    // Display charts
    displayHoursChart(stats.commits_by_hour);
    displayDaysChart(stats.commits_by_day);

    // Display top repos
    displayTopRepos(stats.commits_by_repo);

    // Display recent commits
    displayRecentCommits(stats.recent_commits);
}

// Display hours chart (when do you code?)
function displayHoursChart(commitsByHour) {
    const ctx = document.getElementById('hoursChart').getContext('2d');

    // Destroy existing chart if it exists
    if (hoursChartInstance) {
        hoursChartInstance.destroy();
    }

    // Prepare data for all 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(hour => commitsByHour[hour] || 0);

    hoursChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Commits',
                data: data,
                backgroundColor: 'rgba(255, 107, 107, 0.6)',
                borderColor: '#333',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                rough: {
                    roughness: 2,
                    bowing: 1,
                    fillStyle: 'hachure',
                    fillWeight: 2,
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#333',
                    borderWidth: 2,
                    displayColors: false,
                    titleFont: {
                        family: 'Patrick Hand',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Patrick Hand',
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Patrick Hand',
                            size: 12
                        },
                        color: '#333'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderDash: [5, 5]
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Patrick Hand',
                            size: 11
                        },
                        color: '#333'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [window['chartjs-plugin-rough']]
    });
}

// Display days chart
function displayDaysChart(commitsByDay) {
    const ctx = document.getElementById('daysChart').getContext('2d');

    // Destroy existing chart if it exists
    if (daysChartInstance) {
        daysChartInstance.destroy();
    }

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const data = daysOrder.map(day => commitsByDay[day] || 0);

    daysChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: daysOrder,
            datasets: [{
                label: 'Commits',
                data: data,
                backgroundColor: 'rgba(255, 160, 122, 0.6)',
                borderColor: '#333',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                rough: {
                    roughness: 2,
                    bowing: 1,
                    fillStyle: 'hachure',
                    fillWeight: 2,
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#333',
                    borderWidth: 2,
                    displayColors: false,
                    titleFont: {
                        family: 'Patrick Hand',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Patrick Hand',
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Patrick Hand',
                            size: 12
                        },
                        color: '#333'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderDash: [5, 5]
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Patrick Hand',
                            size: 12
                        },
                        color: '#333'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [window['chartjs-plugin-rough']]
    });
}

// Display top repos
function displayTopRepos(repoStats) {
    const topReposDiv = document.getElementById('topRepos');

    if (Object.keys(repoStats).length === 0) {
        topReposDiv.innerHTML = '<p>No repository data available.</p>';
        return;
    }

    const repoItems = Object.entries(repoStats)
        .map(([repo, commits]) => `
            <div class="repo-item">
                <div class="repo-name">📁 ${repo}</div>
                <div class="repo-commits">${commits} commits</div>
            </div>
        `)
        .join('');

    topReposDiv.innerHTML = repoItems;
}

// Display recent commits
function displayRecentCommits(commits) {
    const recentCommitsDiv = document.getElementById('recentCommits');

    if (!commits || commits.length === 0) {
        recentCommitsDiv.innerHTML = '<p>No recent commits found.</p>';
        return;
    }

    const commitItems = commits.map(commit => {
        const date = new Date(commit.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="commit-item">
                <div class="commit-meta">
                    <span class="commit-sha">${commit.sha}</span>
                    <span class="commit-repo">📦 ${commit.repo}</span>
                    <span>${formattedDate}</span>
                </div>
                <div class="commit-message">${commit.message}</div>
                <div class="commit-stats">
                    <span class="additions">+${commit.additions}</span>
                    <span class="deletions">-${commit.deletions}</span>
                </div>
            </div>
        `;
    }).join('');

    recentCommitsDiv.innerHTML = commitItems;
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Format numbers with commas
function formatNumber(num) {
    return num.toLocaleString();
}

// Allow Enter key to trigger fetch
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchStats();
    }
});

// Load stats on page load for default user
window.addEventListener('DOMContentLoaded', () => {
    const username = document.getElementById('username').value;
    if (username) {
        // Optionally auto-load on page load
        // fetchStats();
    }
});
