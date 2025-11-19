# Git Dashboard 📊✨

A hand-drawn style web dashboard to visualize your GitHub commit history, with stats on commits, lines added/deleted, and active coding times!

![Hand-Drawn Style](https://img.shields.io/badge/style-hand--drawn-ff6b6b)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.121+-green)

## Features

- 📈 **Commit Statistics**: Total commits, lines added/deleted
- ⏰ **Active Hours**: See when you code most (hourly breakdown)
- 📅 **Day Analysis**: Which days of the week are you most active?
- 📦 **Top Repositories**: Your most active repos by commit count
- 📝 **Recent Commits**: Latest commits with stats
- 🎨 **Hand-Drawn UI**: Sketchy, fun visualization style using rough.js

## Screenshots

The dashboard features a playful, hand-drawn aesthetic with:
- Sketchy borders and hand-written fonts
- Interactive bar charts for time analysis
- Color-coded stats cards
- Responsive design

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- httpx (async HTTP client)
- GitHub GraphQL API (primary, for efficiency)
- GitHub REST API (fallback)

**Frontend:**
- Vanilla JavaScript
- Chart.js with rough.js plugin (hand-drawn charts)
- Pure CSS (no frameworks)

## Setup

### 1. Prerequisites

- Python 3.11+ with UV package manager
- GitHub Personal Access Token

### 2. Get a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "GitDashboard"
4. Select scopes:
   - `repo` (for private repo access)
   - `read:user` (for user info)
5. Generate and copy the token

### 3. Configure Secrets

```bash
# Copy the template
cp secrets_template.json secrets.json

# Edit secrets.json and add your GitHub token
# Replace "ghp_YOUR_GITHUB_TOKEN_HERE" with your actual token
```

**Example secrets.json:**
```json
{
  "github_token": "ghp_abcdef123456789..."
}
```

### 4. Install Dependencies

```bash
cd GitDashboard/backend
uv sync
```

## Usage

### Start the Server

```bash
cd GitDashboard/backend
uv run python main.py
```

The server will start at `http://localhost:8000`

### Open the Dashboard

1. Open your browser to `http://localhost:8000`
2. Enter your GitHub username (default: AutumnsGrove)
3. Click "Fetch Stats!"
4. Watch your stats load with beautiful hand-drawn charts!

## API Endpoints

The backend provides these REST endpoints:

- `GET /api/user/{username}` - Get user info
- `GET /api/repos/{username}` - Get all user repositories
- `GET /api/stats/{username}?limit=10` - Get comprehensive stats
- `GET /api/health` - Health check

### Example API Call

```bash
curl http://localhost:8000/api/stats/AutumnsGrove?limit=15
```

## Customization

### Change the Default User

Edit `frontend/index.html` line 16:
```html
<input type="text" id="username" value="YourUsername" placeholder="Enter username...">
```

### Adjust Analyzed Repos

By default, the dashboard analyzes your 10 most recently updated repos. Change this in the frontend:

Edit `frontend/static/js/app.js` line 30:
```javascript
const statsResponse = await fetch(`${API_BASE}/stats/${username}?limit=20`);
```

### Styling

All styles are in `frontend/static/css/style.css`. The hand-drawn look uses:
- Google Fonts: "Patrick Hand" and "Architects Daughter"
- rough.js plugin for Chart.js
- CSS transforms for rotation effects

## Rate Limits

GitHub API has rate limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

This dashboard uses your token for authenticated access, so you should have plenty of quota!

## Troubleshooting

### "GitHub Token Not Configured"

Check `http://localhost:8000/api/health` - it will tell you if the token is configured.

Make sure:
1. `secrets.json` exists in the AutumnsGrove project root
2. The token key is `"github_token"` (not `"github_api_key"`)
3. The token starts with `ghp_` or `github_pat_`

### "User Not Found"

Make sure you're entering a valid GitHub username (not email).

### Charts Not Loading

Make sure you're accessing via `http://localhost:8000` (not opening `index.html` directly as a file).

## Project Structure

```
GitDashboard/
├── backend/
│   ├── main.py           # FastAPI server
│   ├── pyproject.toml    # Python dependencies
│   └── .python-version   # Python version
├── frontend/
│   ├── index.html        # Main HTML
│   └── static/
│       ├── css/
│       │   └── style.css # Hand-drawn styling
│       └── js/
│           └── app.js    # Frontend logic
└── README.md
```

## Future Ideas

- [ ] Add PR and issue statistics
- [ ] Language breakdown by repo
- [ ] Contribution streak tracking
- [ ] Export stats as PDF/image
- [ ] Compare multiple users
- [ ] Historical trends over months/years

## License

MIT - Do whatever you want with it!

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [Chart.js](https://www.chartjs.org/)
- [rough.js](https://roughjs.com/)
- Love for hand-drawn aesthetics ✨
