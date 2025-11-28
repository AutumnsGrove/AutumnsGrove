# TODOs for AutumnsGrove

> **Last Updated:** November 28, 2025 - Added AI timeline enhancements

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

### HIGH PRIORITY: Admin Panel Improvements (Nov 26, 2025)

**Status:** In progress - sidebar and styling mostly complete

#### Completed:
- [x] Fix admin sidebar extending into footer (height: 100vh issue)
- [x] Standardize border-radius across admin panel with CSS variables
- [x] Add admin indicators (checkmark/cog) to `/blog` route when logged in
- [x] Improve images gallery sorting:
  - [x] Add server-side sorting to `/api/images/list`
  - [x] Add sort dropdown UI (newest first, oldest first, A-Z, Z-A, size)
  - [x] Default to newest-first (match public gallery)
- [x] Add rounded corners to admin sidebar with inset positioning

#### Remaining:
- [ ] Enhance Settings page with R2 status and Cloudflare dashboard links:
  - [ ] Add R2 bucket status card (currently shows D1 DB and KV Cache only)
  - [ ] Add direct links to Cloudflare dashboard for each service:
    - [ ] D1 Database → Link to specific D1 dashboard in user's Cloudflare account
    - [ ] KV Cache → Link to specific KV namespace in user's Cloudflare account
    - [ ] R2 Bucket → Link to specific R2 bucket in user's Cloudflare account
  - [ ] Research Cloudflare dashboard URL patterns for deep linking
  - [ ] Add external link icon next to each status indicator
  - [ ] Test if deep links work correctly (may need account ID or other identifiers)

**Implementation plan:** `docs/plans/admin-panel-improvements.md`

---

### ~~HIGH PRIORITY: Automated Daily Summary Timeline~~ COMPLETED

**Status:** Implemented (Nov 27, 2025)

**Implementation:**
- [x] Cloudflare Worker for daily summary generation (`workers/daily-summary/`)
  - [x] GitHub API integration to fetch commits by date
  - [x] Llama 3.1 70B (Workers AI) for summary generation
  - [x] Cron trigger at 11:59 PM Eastern daily
  - [x] Manual trigger and backfill endpoints
- [x] D1 database schema (`daily_summaries` table)
- [x] API endpoint (`/api/timeline`)
- [x] Frontend timeline page (`/timeline`)
  - [x] Card-based UI with expandable details
  - [x] Fun random messages for rest days
- [x] Admin panel controls (`/admin/timeline`)
  - [x] Generate summary for specific date
  - [x] Backfill past dates (up to 30 days)
- [x] GITHUB_TOKEN secret configured

**Worker URL:** `https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev`

---

### HIGH PRIORITY: AI Timeline Enhancements (Nov 28, 2025)

**Status:** Major refactor complete - multi-provider support, cost tracking, background jobs

**Completed:**
- [x] Add model selector infrastructure to worker (5+ models available)
- [x] Add `/models` endpoint to list available models
- [x] Add `/usage` endpoint for AI usage statistics with costs
- [x] Add GitHub repo links in timeline markdown headers
- [x] Update credits page with Cloudflare Workers AI + Meta Llama
- [x] **Switch default AI provider to Claude Haiku 4.5** (Anthropic API)
- [x] Add multi-provider support (Anthropic Claude, Cloudflare Workers AI)
- [x] Add Kimi K2 (Moonshot AI) stubs for future integration
- [x] Create `ai_usage` and `ai_requests` tables in D1 schema for cost tracking
- [x] Add model selector dropdown to admin timeline page
- [x] Display AI usage stats with cost breakdown in admin panel
- [x] **Improve prompt tone** - 6/10 professional, 4/10 fun, no cheerleader energy
- [x] Make gutter comments dynamic (1-5 based on activity, not always 4)
- [x] **Fix gutter positioning** - inline anchored comments under headers
- [x] **Add background job processing with Cloudflare Queues**
  - [x] Queue producer and consumer handlers
  - [x] `background_jobs` table for job tracking
  - [x] `/backfill/async` endpoint for async backfill
  - [x] `/jobs/{jobId}` endpoint for polling job status
  - [x] Progress tracking with percentage complete
- [x] API proxy routes for all new endpoints

**Remaining:**
- [x] Add visualizations to timeline (sparklines, LOC bars, repo breakdown, activity heatmap)
- [x] ~~Update admin UI with async backfill option and progress indicator~~ (removed - Queues require paid plan)
- [ ] Deploy worker with `wrangler secret put ANTHROPIC_API_KEY`

**Note:** Cloudflare Queues require a paid Workers plan. The async backfill UI has been removed.
Sync backfill works fine and is sufficient for current needs. Future options:
- D1 + cron for scheduled background processing
- Upgrade to paid plan if Queues are needed

**Available AI Providers & Models:**

| Provider | Model | Cost | Quality |
|----------|-------|------|---------|
| **Anthropic** | Claude Haiku 4.5 | $0.80/$4.00 per 1M | High (default) |
| Anthropic | Claude Sonnet 4 | $3.00/$15.00 per 1M | Highest |
| Cloudflare | Llama 3.3 70B | Free | Highest |
| Cloudflare | Llama 3.1 70B | Free | High |
| Cloudflare | Gemma 3 12B | Free | High |
| Cloudflare | Mistral Small 24B | Free | High |
| Cloudflare | Llama 3.1 8B | Free | Good |
| *Moonshot* | *Kimi K2* | *TBD* | *High (future)* |

---

### PLANNING: Long-Horizon Context System (Nov 28, 2025)

**Status:** Design phase - implementation deferred until basic features stable

**Goal:** Provide AI with historical context to recognize and comment on multi-day tasks

**Problem:**
Currently each day's summary is generated in isolation. When working on a multi-day refactoring or feature implementation, the AI has no context that "this is day 7 of 15 of a larger effort."

**Proposed Solution:**

1. **Context Window Structure:**
   - When generating a summary, include the past 3 days of summaries as context
   - Use Anthropic prompt caching for the repeated historical context (reduces cost)
   - Structure: `[Day N-3 summary] [Day N-2 summary] [Day N-1 summary] [Current day commits]`

2. **Smart Multi-Day Detection:**
   - Analyze commit messages and file changes for patterns
   - Detect when the same files/areas are being modified across multiple days
   - Identify keywords like "WIP", "part 2", "continued", "refactor", etc.
   - Track repository focus - if same repo gets 80%+ of commits for 3+ days, it's a focused effort

3. **Condensed Historical Summaries:**
   - Don't pass full detailed summaries for historical context
   - Create condensed "context briefs" for each day:
     - Main focus areas (1-2 sentences)
     - Key repos touched
     - Lines changed (ballpark)
     - Any detected ongoing tasks
   - This prevents context overload while maintaining awareness

4. **Multi-Day Progress Comments:**
   - When multi-day task detected, add encouraging but non-cheerleader comments
   - Examples:
     - "Day 3 of the auth refactor. Steady progress."
     - "Still on the timeline feature - the frontend is taking shape."
     - "Week two of this migration. The end is in sight."
   - Avoid: "You're crushing it!" / "Amazing work on day 5!"

5. **Database Schema Additions:**
   ```sql
   -- Add to daily_summaries table
   context_brief TEXT,           -- Condensed summary for context passing
   detected_focus TEXT,          -- JSON: detected ongoing task/project
   continuation_of TEXT,         -- Reference to previous day if detected as continuation
   ```

6. **Prompt Caching Strategy (Anthropic):**
   - System prompt + voice guidelines = static (cacheable)
   - Historical context briefs = semi-static (cacheable if unchanged)
   - Current day commits = dynamic (not cached)
   - Expected savings: 50-70% input token cost for context portion

**Implementation Order:**
1. Add `context_brief` generation to current summaries
2. Update prompt to accept historical context
3. Add multi-day detection logic
4. Implement Anthropic prompt caching
5. Add continuation comments to gutter

**Dependencies:**
- Stable AI provider integration (done)
- Cost tracking to measure caching effectiveness (done)
- Prompt refinement complete (done)

---

### HIGH PRIORITY: Recipes D1 Integration (Nov 26, 2025)

**Status:** Standalone plan ready

**Goal:** Mirror blog posts D1 integration for recipes, add URL field for external sources

**Key tasks:**
- [ ] Update D1 schema with recipes table (includes `url` field)
- [ ] Add recipe sync endpoints to Cloudflare Worker
- [ ] Create GitHub Actions workflow for recipe syncing
- [ ] Update admin recipes page to fetch from D1
- [ ] Display URL field in admin table
- [ ] Add external source link to recipe display page

**Implementation plan:** `docs/plans/recipes-d1-integration.md`

**Independent execution:** Can be run separately from other tasks at any time

---

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

### Content Management Modernization

#### In-Website Markdown Editor (High Priority Future)
**Goal:** Move away from GitHub-based editing to admin panel editing

**Features:**
- [ ] Full markdown editor with live preview
- [ ] Frontmatter editor UI (title, date, tags, description)
- [ ] Integrated gutter content management:
  - [ ] Add images from CDN gallery
  - [ ] Create comment/note sidebars
  - [ ] Add image galleries
  - [ ] Position gutter items with visual anchors
- [ ] Save directly to D1 database (bypass GitHub for new posts)
- [ ] **Keep GitHub fallback as emergency backup option**
- [ ] Syntax highlighting for code blocks
- [ ] Image upload integration with R2/CDN
- [ ] Auto-save drafts
- [ ] Preview mode with actual site styling

**Dependencies:**
- D1 database already set up for posts
- R2 bucket already configured for images
- Admin authentication already working

**Benefits:**
- No more manual sidecar JSON files
- Simpler gutter content workflow
- Faster publishing (no git commit/push cycle)
- Better user experience for content creation

---

#### "Create a Post" Button
**Goal:** Quick post creation from `/blog` route page

**Features:**
- [ ] Add/enhance "Create Post" button on `/blog` route (already exists)
- [ ] Opens in-website markdown editor (once built)
- [ ] Fills in basic template (frontmatter, date, slug)
- [ ] **Fallback to GitHub editor** (always available as backup)
- [ ] Same approach for recipes at `/recipes` route

**Implementation notes:**
- Button already exists on /blog page
- Depends on markdown editor being built first
- GitHub fallback ensures content creation always possible
- Template should match current UserContent structure

---

### Content Migration Strategy

#### UserContent Legacy Support (v1.0 Plan)
- **Current:** Posts sync from `UserContent/Posts/` → D1 via GitHub Actions
- **Current:** Recipes use local filesystem (no D1 yet)
- **Future:** Markdown editor writes directly to D1
- **v1.0:** Close UserContent system for new posts, keep for legacy/reference

**Migration path:**
1. ✅ Blog posts → D1 (done)
2. ⏳ Recipes → D1 (planned, see recipes-d1-integration.md)
3. ⏳ Build markdown editor (future)
4. ⏳ Add "Create Post" button (future)
5. ⏳ Migrate gutter content to programmatic system (future)
6. ⏳ v1.0: Deprecate UserContent for new content (legacy read-only)

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

1. **Deploy Markdown Editor (Phase 1 + Phase 2):**
   ```bash
   # The POSTS_DB binding was added to wrangler.toml
   # Posts database already exists: autumnsgrove-posts (510badf3-457a-4892-bf2a-45d4bfd7a7bb)

   # Add gutter_content column to posts table (for Phase 2 gutter manager)
   wrangler d1 execute autumnsgrove-posts --command "ALTER TABLE posts ADD COLUMN gutter_content TEXT DEFAULT '[]'"

   # Deploy the main site with new editor routes
   npm run build && wrangler pages deploy .svelte-kit/cloudflare

   # Or for local testing:
   npx wrangler pages dev -- npm run dev
   ```

   **New Routes:**
   - `/admin/blog/new` - Create new post with markdown editor
   - `/admin/blog/edit/[slug]` - Edit existing posts

   **New API Endpoints:**
   - `GET /api/posts` - List all posts
   - `POST /api/posts` - Create new post
   - `GET /api/posts/[slug]` - Get single post
   - `PUT /api/posts/[slug]` - Update post
   - `DELETE /api/posts/[slug]` - Delete post

   **Phase 2 Features:**
   - GutterManager component for adding comments, photos, galleries
   - Visual anchor insertion from editor
   - CDN image picker integration for selecting images

2. **Deploy AI Timeline Updates:**
   ```bash
   # Apply database migrations
   wrangler d1 execute autumnsgrove-git-stats --file=src/lib/db/schema.sql

   # Add Anthropic API key (if not already set)
   cd workers/daily-summary && wrangler secret put ANTHROPIC_API_KEY

   # Deploy the worker
   wrangler deploy
   ```

3. **Test New Features:**
   - Timeline page with inline gutter comments under headers
   - Admin timeline page with:
     - AI model selector dropdown
     - Usage & cost tracking display
     - Sync backfill for past dates (async removed - Queues require paid plan)
   - Test Claude Haiku 4.5 output tone (should be less cheerleader-y)

3. **Timeline Visualizations (DONE):**
   - [x] Activity overview with GitHub-style heatmap and sparklines
   - [x] LOC (lines of code) bar charts per day
   - [x] Repo breakdown visualization
   - [x] Activity API endpoint for aggregated data

4. **Other tasks to consider:**
   - RSS Feed implementation (medium priority)
   - Recipes D1 integration
   - Long-horizon context system (see planning section above)

---

*Last updated: November 28, 2025 - Removed async backfill UI (Queues require paid plan)*
