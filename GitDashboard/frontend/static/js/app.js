// Git Dashboard - Hand-Drawn Visualization App
// Using relative URL for same-origin deployment
const API_BASE = '/api';

let hoursChartInstance = null;
let daysChartInstance = null;

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Create a text element safely
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @param {string} className - Optional class name
 * @returns {HTMLElement}
 */
function createTextElement(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

// Fetch and display stats
async function fetchStats() {
    const username = document.getElementById('username').value.trim();

    if (!username) {
        showError('Please enter a GitHub username!');
        return;
    }

    // Basic username validation (matches backend)
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
        showError('Invalid username format');
        return;
    }

    // Show loading, hide dashboard and errors
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');

    try {
        // Fetch user info
        const userResponse = await fetch(`${API_BASE}/user/${encodeURIComponent(username)}`);
        if (!userResponse.ok) {
            const errorData = await userResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'User not found');
        }
        const userData = await userResponse.json();
        displayUserInfo(userData);

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE}/stats/${encodeURIComponent(username)}?limit=15`);
        if (!statsResponse.ok) {
            const errorData = await statsResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to fetch stats');
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

// Display user info (XSS-safe using textContent)
function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('userInfo');
    userInfoDiv.innerHTML = ''; // Clear previous content

    // Create elements safely using textContent
    const nameP = document.createElement('p');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = 'Name: ';
    nameP.appendChild(nameStrong);
    nameP.appendChild(document.createTextNode(user.name || user.login));
    userInfoDiv.appendChild(nameP);

    const usernameP = document.createElement('p');
    const usernameStrong = document.createElement('strong');
    usernameStrong.textContent = 'Username: ';
    usernameP.appendChild(usernameStrong);
    usernameP.appendChild(document.createTextNode('@' + user.login));
    userInfoDiv.appendChild(usernameP);

    const reposP = document.createElement('p');
    const reposStrong = document.createElement('strong');
    reposStrong.textContent = 'Public Repos: ';
    reposP.appendChild(reposStrong);
    reposP.appendChild(document.createTextNode(String(user.public_repos)));
    userInfoDiv.appendChild(reposP);

    const followP = document.createElement('p');
    const followersStrong = document.createElement('strong');
    followersStrong.textContent = 'Followers: ';
    followP.appendChild(followersStrong);
    followP.appendChild(document.createTextNode(String(user.followers)));
    followP.appendChild(document.createTextNode(' | '));
    const followingStrong = document.createElement('strong');
    followingStrong.textContent = 'Following: ';
    followP.appendChild(followingStrong);
    followP.appendChild(document.createTextNode(String(user.following)));
    userInfoDiv.appendChild(followP);

    if (user.bio) {
        const bioP = document.createElement('p');
        const bioStrong = document.createElement('strong');
        bioStrong.textContent = 'Bio: ';
        bioP.appendChild(bioStrong);
        bioP.appendChild(document.createTextNode(user.bio));
        userInfoDiv.appendChild(bioP);
    }
}

// Display stats
function displayStats(stats) {
    // Update stat cards (these use textContent which is safe)
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

// Display top repos (XSS-safe using DOM manipulation)
function displayTopRepos(repoStats) {
    const topReposDiv = document.getElementById('topRepos');
    topReposDiv.innerHTML = ''; // Clear previous content

    if (Object.keys(repoStats).length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No repository data available.';
        topReposDiv.appendChild(p);
        return;
    }

    Object.entries(repoStats).forEach(([repo, commits]) => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';

        const repoName = document.createElement('div');
        repoName.className = 'repo-name';
        repoName.textContent = `📁 ${repo}`;

        const repoCommits = document.createElement('div');
        repoCommits.className = 'repo-commits';
        repoCommits.textContent = `${commits} commits`;

        repoItem.appendChild(repoName);
        repoItem.appendChild(repoCommits);
        topReposDiv.appendChild(repoItem);
    });
}

// Display recent commits (XSS-safe using DOM manipulation)
function displayRecentCommits(commits) {
    const recentCommitsDiv = document.getElementById('recentCommits');
    recentCommitsDiv.innerHTML = ''; // Clear previous content

    if (!commits || commits.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No recent commits found.';
        recentCommitsDiv.appendChild(p);
        return;
    }

    commits.forEach(commit => {
        const date = new Date(commit.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const commitItem = document.createElement('div');
        commitItem.className = 'commit-item';

        // Commit meta
        const commitMeta = document.createElement('div');
        commitMeta.className = 'commit-meta';

        const shaSpan = document.createElement('span');
        shaSpan.className = 'commit-sha';
        shaSpan.textContent = commit.sha;

        const repoSpan = document.createElement('span');
        repoSpan.className = 'commit-repo';
        repoSpan.textContent = `📦 ${commit.repo}`;

        const dateSpan = document.createElement('span');
        dateSpan.textContent = formattedDate;

        commitMeta.appendChild(shaSpan);
        commitMeta.appendChild(repoSpan);
        commitMeta.appendChild(dateSpan);

        // Commit message
        const commitMessage = document.createElement('div');
        commitMessage.className = 'commit-message';
        commitMessage.textContent = commit.message;

        // Commit stats
        const commitStats = document.createElement('div');
        commitStats.className = 'commit-stats';

        const additionsSpan = document.createElement('span');
        additionsSpan.className = 'additions';
        additionsSpan.textContent = `+${commit.additions}`;

        const deletionsSpan = document.createElement('span');
        deletionsSpan.className = 'deletions';
        deletionsSpan.textContent = `-${commit.deletions}`;

        commitStats.appendChild(additionsSpan);
        commitStats.appendChild(deletionsSpan);

        // Assemble commit item
        commitItem.appendChild(commitMeta);
        commitItem.appendChild(commitMessage);
        commitItem.appendChild(commitStats);

        recentCommitsDiv.appendChild(commitItem);
    });
}

// Show error message (using textContent for safety)
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
