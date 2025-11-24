# TODOs for AutumnsGrove

> **Last Updated:** November 24, 2025 - Updated with recent completions

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

### Git Dashboard - UI Improvements
- [x] Shrunk user info card to compact horizontal layout
- [x] Changed time chart to 12-hour format with AM/PM
- [x] Added repository descriptions to Top Repos
- [x] Added source code link and "Stats analyzed with Claude AI" footer
- [x] Removed public refresh button (security)
- [x] Redesigned recent commits with scrollable container
- [x] Heatmap component debugged and working

### Dashboard Data Expansion
- [x] Task A: Time range selector UI (All Time / 6 Months / 30 Days)
- [x] Task B: Date filtering in stats API with `since` parameter
- [x] Lucide icons throughout dashboard (stats cards, section headers, footer)

### Backend Systems
- [x] D1 schema designed (src/lib/db/schema.sql)
- [x] Claude Haiku 4.5 integration for AI analysis
- [x] TODO parsing from code comments and TODOS.md files

### Image Hosting
- [x] R2 bucket created: `autumnsgrove-images`
- [x] Custom domain connected: `cdn.autumnsgrove.com`
- [x] Upload helper script created: `scripts/upload-image.sh`
- [x] Documentation created: `ClaudeUsage/image_hosting.md`

### Multi-Image Gallery Component ✅
- [x] Create `src/lib/components/ImageGallery.svelte`
- [x] Navigation arrows with hover states
- [x] Progress indicator and dots
- [x] Caption display below gallery
- [x] Keyboard and touch support
- [x] Dark mode styling
- [x] Lightbox integration with ZoomableImage

### Admin Panel (Nov 2025)
- [x] Admin dashboard at `/admin` with overview stats
- [x] Blog management at `/admin/blog`
- [x] Recipe management at `/admin/recipes`
- [x] Image gallery at `/admin/images` (CDN browser)
- [x] System console at `/admin/logs` with real-time log streaming
- [x] Analytics page at `/admin/analytics`
- [x] Settings page at `/admin/settings`
- [x] Theme-responsive styling for all admin pages
- [x] Authentication with logged-in indicator

### Code Quality Improvements (Nov 2025)
- [x] GitHub-style code blocks with copy button and language labels
- [x] Markdown renderer updated for marked.js API compatibility
- [x] TOC floating button fixed (hidden on tablet/desktop when sidebar visible)
- [x] Duplicate gutter rendering resolved in tablet mode
- [x] Slug normalization for lowercase kebab-case URLs

### Security & Performance (Nov 2025)
- [x] Rate limiting on API endpoints (dashboard, auth, contributions)
- [x] Comprehensive security improvements for sync worker
- [x] SQL parameter overflow prevention with chunked batching
- [x] Authentication added to image API endpoints
- [x] Security documentation completed

---

## 🔲 Remaining Tasks

### MEDIUM PRIORITY: RSS Feed Implementation

**Goal:** Add RSS feed support for blog posts

**Documentation:** See `docs/RSS_FEED_IMPLEMENTATION.md` for full research and implementation guide.

**Implementation steps:**
- [ ] Create RSS endpoint at `src/routes/api/feed/+server.js`
- [ ] Add RSS autodiscovery link to `src/routes/+layout.svelte`
- [ ] Test feed locally and validate with W3C validator
- [ ] Optional: Add full content in feed
- [ ] Optional: Create `/rss.xml` redirect
- [ ] Optional: Add KV caching for production

**Key files:**
- `src/lib/utils/markdown.js` - Use `getAllPosts()` function
- `docs/RSS_FEED_IMPLEMENTATION.md` - Full implementation guide

---

### LOW PRIORITY: Dashboard Data Expansion

#### Task C: Paginate to Fetch All Repos (can defer)
- [ ] Use GraphQL cursor pagination (`after: $cursor`, `hasNextPage`)
- [ ] May need multiple API calls for full repo coverage
- [ ] Consider background sync to D1 for performance

**Current state:** Fetches 15 most recently updated repos, 100 commits each. Time range filtering works.

---

### LOW PRIORITY: Dashboard Visualizations

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
```

**Radar/Spider Chart:**
- Axes: Commits, Additions, Deletions, Recent Activity, TODO Progress
- Each repo is a different colored polygon

**Activity Timeline:**
- Line chart with one line per repo showing commit frequency over time

---

### LOW PRIORITY: UI Polish

- [ ] Mobile responsiveness improvements for charts
- [ ] Loading states and animations
- [ ] Lazy-load Chart.js (reduce initial bundle size)
- [ ] Add error boundaries for graceful failures

---

## 💡 Future Ideas & Enhancements

### UI & Styling
- **[shadcn-svelte](https://github.com/huntabyte/shadcn-svelte)**: Pre-built accessible components
- **Tailwind CSS**: Utility-first CSS framework (if needed for custom styling)

### Image Optimization
- **[@sveltejs/enhanced-img](https://svelte.dev/docs/kit/images#sveltejs-enhanced-img)**: Built-in SvelteKit image optimization

### User Authentication Expansion (Far Future)
- Public commenting on posts
- User likes/upvotes system
- OAuth integration (GitHub, Google)

### Inspiration Websites
- **https://マリウス.com/collection/make/**: Simple hacker-like aesthetic, great header, nice image handling
- **https://joshtronic.com/**: Incredibly simple text-focused design
- **https://bagerbach.com/**: Another clean, simple blog

### Learning Resources
- [Svelte Packages](https://svelte.dev/packages) - Main source for Svelte ecosystem packages

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
- **Admin panel:** `src/routes/admin/`
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

1. **Pick a task from remaining items:**
   - RSS Feed implementation (medium priority)
   - Project Comparison Charts (compare repos side-by-side)
   - UI polish (loading states, animations, mobile tweaks)

2. **Test recent features:**
   - Admin panel at `/admin` - all sections working
   - System console logs streaming
   - Code block copy buttons

---

*Last updated: November 24, 2025*
