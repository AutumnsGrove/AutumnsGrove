# TODOs for AutumnsGrove

> **Last Updated:** November 20, 2025 - TODOS cleanup and reorganization

---

## ✅ Completed

### Initial Setup
- [x] Project initialized from BaseProject template
- [x] Dependencies configured (Python UV, npm)
- [x] Git hooks installed for code quality
- [x] SvelteKit with Cloudflare Pages adapter configured

### Core Website
- [x] Homepage layout implemented
- [x] Blog system with markdown rendering
- [x] Recipes section
- [x] Navigation menu with dark mode toggle
- [x] Responsive design

### Cloudflare Infrastructure
- [x] R2 bucket created: `autumnsgrove-images`
- [x] KV namespace created: `CACHE_KV` (ID: 6bc72b16c721401e8b9a848a7ae4e0ca)
- [x] D1 database created: `autumnsgrove-git-stats` (ID: 0ca4036f-93f7-4c8a-98a5-5353263acd44)
- [x] Wrangler.toml configured with all bindings
- [x] Secrets configured in Cloudflare Dashboard (GITHUB_TOKEN, ANTHROPIC_API_KEY)

### Git Dashboard - Core Integration
- [x] API routes created:
  - `/api/git/user/[username]` - User info
  - `/api/git/repos/[username]` - Repositories
  - `/api/git/stats/[username]` - Commit statistics
  - `/api/git/health` - Health check
  - `/api/git/todos/[username]/[repo]` - TODO extraction
  - `/api/git/sync` - Scheduled sync endpoint
  - `/api/git/history/[username]/[repo]` - Historical data
  - `/api/ai/analyze/[username]/[repo]` - AI analysis
  - `/api/git/contributions/[username]` - GitHub contribution calendar data
  - `/api/git/activity/[username]` - Aggregated commit activity
- [x] Dashboard page at `/dashboard` with:
  - Compact user info card with avatar
  - Stats cards (commits, additions, deletions, repos)
  - Hour-of-day bar chart (12-hour AM/PM format)
  - Day-of-week bar chart
  - Top repositories list with descriptions
  - Scrollable recent commits list (shows 5 commits)
  - Source code link + Claude attribution footer
- [x] Auto-loads AutumnsGrove account on page visit
- [x] 3-hour KV caching for all API responses
- [x] Navigation updated with Dashboard link
- [x] Triple-click avatar to refresh (5-min rate limit, logged to console)
- [x] D1 database initialized and synced (10 repos, 342 commits)

### Git Dashboard - UI Improvements (Nov 20, 2024)
- [x] Shrunk user info card to compact horizontal layout
- [x] Changed time chart to 12-hour format with AM/PM
- [x] Added repository descriptions to Top Repos
- [x] Added source code link and "Stats analyzed with Claude AI" footer
- [x] Removed public refresh button (security)
- [x] Redesigned recent commits with scrollable container
- [x] Created Heatmap component (needs debugging)

### Backend Systems
- [x] D1 schema designed (src/lib/db/schema.sql)
- [x] Claude Haiku 4.5 integration for AI analysis
- [x] TODO parsing from code comments and TODOS.md files

### Image Hosting (Nov 20, 2024)
- [x] R2 bucket created: `autumnsgrove-images`
- [x] Custom domain connected: `cdn.autumnsgrove.com`
- [x] Upload helper script created: `scripts/upload-image.sh`
- [x] Documentation created: `ClaudeUsage/image_hosting.md`

---

## 🔲 Remaining Tasks

### HIGH PRIORITY: Dashboard Data Expansion

**Goal:** Show stats from ALL repos with time range filtering

**Current limitation:** Only fetches 15 most recently updated repos, 100 commits each (max ~1500 commits)

---

#### Task A: Add Time Range Selector UI
- [ ] Create dropdown component with options: Last 30 days, Last 6 months, All time
- [ ] Place selector above stats cards on dashboard
- [ ] Store selected range in component state

#### Task B: Add Date Filtering to Stats API
- [ ] Accept `since` query parameter in `/api/git/stats/[username]`
- [ ] Modify GraphQL query: `history(first: 100, since: "2024-05-01T00:00:00Z")`
- [ ] Return only commits within selected time range

#### Task C: Paginate to Fetch All Repos (can defer)
- [ ] Use GraphQL cursor pagination (`after: $cursor`, `hasNextPage`)
- [ ] May need multiple API calls for full repo coverage
- [ ] Consider background sync to D1 for performance

---

### MEDIUM PRIORITY: Dashboard Visualizations

**Goal:** Add advanced visualizations to make the dashboard more informative

---

#### Project Comparison Charts

**Goal:** Compare multiple repos side-by-side to see which get the most love

**Implementation steps:**
1. Create component: `src/routes/dashboard/Comparison.svelte`
2. Let user select 2-5 repos to compare from dropdown
3. Fetch stats for each selected repo
4. Display comparison visualizations

**Visualizations to include:**

**Bar Chart Comparison:**
```
Commits:     ████████ AutumnsGrove (150)
             ████ BaseProject (80)
             ██ Sounds (40)

Additions:   ██████████ AutumnsGrove (5000)
             ████ BaseProject (2000)
             ██ Sounds (800)
```

**Radar/Spider Chart:**
- Axes: Commits, Additions, Deletions, Recent Activity, TODO Progress
- Each repo is a different colored polygon
- Shows which projects are most "complete" or active

**Activity Timeline:**
- Line chart with one line per repo
- X-axis: time (weeks/months)
- Y-axis: commit count
- See which projects had bursts of activity

**Data needed:**
- Use existing `/api/git/stats/AutumnsGrove?limit=50` to get all repos
- Then fetch individual stats or use the D1 historical data

---

### LOW PRIORITY: Dashboard Enhancements

#### Heatmap Component (Backlog)
- [ ] Debug existing component - likely Svelte 5 reactivity issue with `$derived`
- Component exists at `src/routes/dashboard/Heatmap.svelte`
- API works: `/api/git/contributions/[username]` returns data
- Grid displays 7 rows (days) × 52 columns (weeks)

#### UI Improvements
- [ ] Layout adjustments
- [ ] Color scheme tweaks
- [ ] Mobile responsiveness improvements
- [ ] Loading states and animations
- [ ] Add icons throughout (navigation, stats cards, sections)

---

### LOW PRIORITY: Security & Performance

- [ ] Add rate limiting to API endpoints (use Cloudflare's built-in)
- [ ] Input validation hardening
- [ ] Lazy-load Chart.js (reduce initial bundle size)
- [ ] Mobile optimization for charts
- [ ] Add error boundaries for graceful failures

---

## 📝 Quick Reference

### Local Development
```bash
# Start with Cloudflare bindings
npx wrangler pages dev -- npm run dev

# Access at http://localhost:8788
```

### Key Files
- **Dashboard page:** `src/routes/dashboard/+page.svelte`
- **GitHub utilities:** `src/lib/utils/github.js`
- **API routes:** `src/routes/api/git/`
- **D1 schema:** `src/lib/db/schema.sql`
- **Wrangler config:** `wrangler.toml`
- **Local secrets:** `.dev.vars` (gitignored)

### Cloudflare Resources
- **R2 Bucket:** `autumnsgrove-images`
- **KV Namespace:** `CACHE_KV`
- **D1 Database:** `autumnsgrove-git-stats`

### API Endpoints
| Endpoint | Description | Cache |
|----------|-------------|-------|
| `/api/git/user/[username]` | User profile | 3 hours |
| `/api/git/stats/[username]` | Commit stats | 3 hours |
| `/api/git/repos/[username]` | Repositories | 3 hours |
| `/api/git/todos/[username]/[repo]` | TODO extraction | 30 min |
| `/api/git/history/[username]/[repo]` | Historical data | 30 min |
| `/api/ai/analyze/[username]/[repo]` | AI analysis | 6 hours |
| `/api/git/sync` | Trigger data sync | N/A |
| `/api/git/health` | Health check | N/A |

---

## 🚀 Next Session Checklist

When you return to work on this project:

1. **Deploy current changes:**
   ```bash
   git push origin main
   ```

2. **Test the deployed dashboard** at https://autumnsgrove.com/dashboard

3. **Pick a task from HIGH PRIORITY:**
   - Task A: Time range selector UI
   - Task B: Date filtering in stats API
   - Task C: Repo pagination (can defer)

4. **Optional:** Work on Project Comparison Charts if time allows

---

*Last updated: November 2025*
