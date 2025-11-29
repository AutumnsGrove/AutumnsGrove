# TODOs for AutumnsGrove

> **Last Updated:** November 28, 2025 - Completed in-website markdown editor (all 3 phases)

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

### ~~Content Management Modernization~~ COMPLETED

#### ~~In-Website Markdown Editor~~ COMPLETED (Nov 28, 2025)
**Status:** Fully implemented with all planned features

**Completed Features:**
- [x] Full markdown editor with live preview (split-pane, synchronized scroll)
- [x] Terminal-grove aesthetic (monospace font, dark theme, green accents)
- [x] Frontmatter editor UI (title, date, tags, description)
- [x] Integrated gutter content management:
  - [x] GutterManager component for comments, photos, galleries
  - [x] CDN image picker for selecting R2 images
  - [x] Visual anchor insertion from editor (headings, custom anchors)
  - [x] Position gutter items with anchor selection
- [x] Save directly to D1 database (bypasses GitHub)
- [x] **Drag-and-drop image upload to R2** (Phase 3)
- [x] **Paste image support** (auto-uploads pasted screenshots)
- [x] **Auto-save drafts to localStorage** (Phase 3)
- [x] **Full preview mode with actual site styling** (Phase 3)
- [x] Line numbers with current line highlight
- [x] Keyboard shortcuts (Cmd+S save, Cmd+B bold, Cmd+I italic)
- [x] Toolbar with formatting buttons (headings, bold, italic, code, links, lists, quotes)
- [x] Status bar (line/column, word count, character count)

**Routes:**
- `/admin/blog/new` - Create new post
- `/admin/blog/edit/[slug]` - Edit existing posts

**API Endpoints:**
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create new post (with gutter_content)
- `GET /api/posts/[slug]` - Get single post
- `PUT /api/posts/[slug]` - Update post (with gutter_content)
- `DELETE /api/posts/[slug]` - Delete post

**Components:**
- `src/lib/components/admin/MarkdownEditor.svelte` - Main editor component
- `src/lib/components/admin/GutterManager.svelte` - Gutter content management

---

#### ~~"Create a Post" Button~~ COMPLETED
**Status:** Implemented via admin panel

**Implementation:**
- [x] "New Post" button on `/admin/blog` links to `/admin/blog/new`
- [x] Edit buttons link to `/admin/blog/edit/[slug]`
- [x] Auto-generates slug from title
- [x] Auto-fills current date
- [x] Gutter content management integrated

---

### HIGH PRIORITY: Markdown Editor Enhancements (Nov 28, 2025)

**Status:** Phase 4 COMPLETE - Grove Writer experience fully implemented

**Goal:** Make the writing interface THE reason people visit this site. A cozy, distraction-free, developer-friendly writing experience that feels like writing by lantern in a forest cabin.

#### Quick Polish - COMPLETED
- [x] Add Escape key to close full preview modal
- [x] Reading time estimate in status bar ("~5 min read")
- [x] Typewriter scrolling (cursor line stays at vertical center)
- [x] Character limit warnings for SEO (description field: 120-160 chars)
- [x] Fading transitions between modes

#### Core Features - COMPLETED
- [x] **Slash Commands** (`/heading`, `/code`, `/mermaid`, `/quote`, `/list`, etc.)
  - Type `/` to open command menu
  - Fuzzy search through commands
  - Keyboard navigation (up/down/enter)
  - Insert content at cursor position
  - User snippets appear in slash menu
- [x] **Command Palette** (Cmd+K)
  - VS Code-style fuzzy command search
  - Actions: Save, Preview, Zen Mode, Campfire, Insert, Goal, Snippets
- [x] **Writing Goals**
  - Set session word count target via command palette
  - Progress indicator in status bar
- [x] **Zen Mode** (Cmd+Shift+Enter)
  - Full-screen, distraction-free
  - Toolbar fades (30% opacity, hover to reveal)
  - Status bar minimizes (50% opacity)
  - Typewriter scrolling auto-enabled
  - Escape to exit

#### Grove Experience - COMPLETED
- [x] **Campfire Sessions**
  - Writing sprint mode with warm ember progress indicator
  - Session timer in status bar and floating control panel
  - Words written counter
  - Glowing ember animation
  - End session button with summary
- [x] **Mode Transitions**
  - Fading animations for toolbar/status bar
  - Scale-in animation for slash menu
  - Slide-down animation for command palette

#### AI Assistant (Stubs - Not Deployed Yet)
- [ ] Sidebar panel for AI suggestions (hidden by default)
- [ ] Grammar/spelling suggestions
- [ ] Tone analysis
- [ ] Readability scoring (Flesch-Kincaid)
- [ ] "Improve this paragraph" action
- [ ] **Note:** Build and test locally before any customer-facing deployment

#### Phase 5 Features - COMPLETED
- [x] **Mermaid Diagram Previews**
  - Render mermaid code blocks as diagrams in preview
  - Grove-themed dark color scheme
  - Support: flowcharts, sequence diagrams, gantt, etc.
  - Client-side rendering with mermaid.js
- [x] **Markdown Snippets**
  - Save reusable content blocks to localStorage
  - Create/edit/delete snippets via modal (Cmd+K → "Manage Snippets")
  - Optional trigger shortcuts (type `/trigger` to insert)
  - Snippets appear in slash command menu with 📝 icon
  - Snippets modal with list of existing snippets

#### Phase 6 Features - COMPLETED
- [x] **Ambient Sounds**
  - Sound panel accessible from status bar (icon shows current sound)
  - Five ambient soundscapes: Forest, Rain, Campfire, Night, Café
  - Volume control slider with persistence
  - Play/stop toggle with visual feedback
  - Settings saved to localStorage
  - Graceful fallback if audio files missing
  - Note: Add your own audio files to `/static/sounds/`

#### Future Enhancements
- [ ] Version history time machine
- [ ] Custom themes/color schemes
- [ ] Collaborative editing (far future)

**Design Principles:**
- Everything configurable (localStorage settings)
- Keyboard-first, mouse-optional
- Forest terminal aesthetic throughout
- Simple surface, power underneath

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

### AI Writing Assistant for MarkdownEditor (Planned - Not Started)

**Status:** Comprehensive plan created, awaiting implementation

**Goal:** Add ethical AI writing tools to help polish posts WITHOUT generating content

**Core Principle:** AI is a TOOL, never a writer. Users write their own posts.

**Allowed Features (Enhancement Tools):**
- [ ] Grammar/spelling corrections (like Grammarly)
- [ ] Readability scoring (Flesch-Kincaid)
- [ ] Tone analysis ("sounds harsh here")
- [ ] Word choice suggestions
- [ ] Structural feedback (paragraph length)

**Forbidden Features (Content Generation):**
- ❌ "Write a post about X"
- ❌ "Expand this to 1000 words"
- ❌ Auto-completion or predictive text
- ❌ Any full sentence generation

**Implementation Plan:**
- **Phase 1 (Week 1):** Settings toggle (OFF by default) + grammar check via Cmd+K
- **Phase 2 (Week 2):** Readability + tone analysis
- **Phase 3 (Week 3):** Usage dashboard with cost transparency
- **Phase 4 (Future):** Inline highlights, custom writing rules

**Infrastructure (Already Ready):**
- ✅ Anthropic API configured in wrangler.toml
- ✅ D1 `ai_requests` table for usage tracking
- ✅ Claude Haiku 4.5 integration working (timeline uses it)
- ✅ Settings system in place

**Estimated Costs:**
- Light user (10 posts, 3 checks each): ~$0.015/month
- Heavy user (50 posts, 10 checks each): ~$0.25/month
- Power user (100+ analyses): ~$0.50-1.00/month

**Design Principles:**
- All AI features OFF by default (zero friction for non-users)
- Command palette integration (Cmd+K → "AI: Check Grammar")
- Terminal-grove aesthetic (sidebar panel, muted green accents)
- Full transparency (settings explain data sent to Anthropic)
- User model selection (Haiku for speed, Sonnet for quality)

**Documentation:**
- Full plan: `~/.claude/plans/ai-writing-assistant.md` (1,468 lines)
- Includes code examples, UI mockups, cost analysis, ethical safeguards

**Next Steps (When Ready):**
1. Review plan document
2. Approve Phase 1 scope
3. Implement settings toggle + API endpoint
4. Add AI panel to MarkdownEditor
5. Deploy behind feature flag

---

### shadcn-svelte Migration (Nov 2025) ✅ COMPLETED
**Status:** Migration complete and merged to main

**What was accomplished:**
- [x] Foundation: Tailwind CSS + shadcn-svelte primitives installed
- [x] Component wrappers: 12 wrapper components created (533 lines total)
- [x] Admin routes: All admin pages migrated to wrappers (~10 pages)
- [x] Public routes: Blog, recipes, core pages migrated to wrappers (~13 pages)
- [x] Typography: Tailwind Typography integrated with custom config
- [x] Cleanup: Deprecated CSS removed, bundle verified
- [x] Documentation: Complete migration docs and quick reference guide

**Results:**
- Consistent UI system with 12 reusable wrapper components
- Reduced CSS by ~900+ lines across project
- Improved maintainability (UI changes in one place)
- Preserved sacred components (MarkdownEditor, GitHubHeatmap, Timeline, Gallery)
- Maintained terminal-grove aesthetic

**Documentation:**
- See `docs/shadcn-migration-complete.md` for full migration details
- See `docs/shadcn-component-quick-reference.md` for component cheat sheet

**Wrapper Components:**
1. Button (default, ghost, link variants)
2. Card (with title, hoverable, clickable support)
3. Badge (tag, default variants)
4. Input (text, email, password, textarea, etc.)
5. Select (dropdown with optional groups)
6. Tabs (tabbed interface)
7. Dialog (modal dialogs)
8. Accordion (collapsible sections)
9. Sheet (side panels/drawers)
10. Toast (notifications)
11. Skeleton (loading placeholders)
12. Table (data tables)

**Import usage:**
```svelte
import { Button, Card, Badge, Input } from "$lib/components/ui";
```

### UI & Styling (Future)
- **Custom themes**: Allow users to customize color scheme (beyond dark/light)
- **More wrapper variants**: Add size variants (sm, md, lg) for components
- **Component library expansion**: Add Alert, Popover, Dropdown wrappers

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

1. **Deploy Markdown Editor (ALL PHASES COMPLETE):**
   ```bash
   # The POSTS_DB binding was added to wrangler.toml
   # Posts database already exists: autumnsgrove-posts (510badf3-457a-4892-bf2a-45d4bfd7a7bb)

   # Add gutter_content column to posts table (required for gutter manager)
   wrangler d1 execute autumnsgrove-posts --command "ALTER TABLE posts ADD COLUMN gutter_content TEXT DEFAULT '[]'"

   # Deploy the main site with new editor routes
   npm run build && wrangler pages deploy .svelte-kit/cloudflare

   # Or for local testing:
   npx wrangler pages dev -- npm run dev
   ```

   **Routes:**
   - `/admin/blog/new` - Create new post with full markdown editor
   - `/admin/blog/edit/[slug]` - Edit existing posts

   **API Endpoints:**
   - `GET /api/posts` - List all posts
   - `POST /api/posts` - Create new post (with gutter_content)
   - `GET /api/posts/[slug]` - Get single post
   - `PUT /api/posts/[slug]` - Update post (with gutter_content)
   - `DELETE /api/posts/[slug]` - Delete post

   **All Implemented Features:**
   - Phase 1: Core markdown editor with live preview, terminal-grove styling
   - Phase 2: GutterManager, CDN image picker, anchor insertion
   - Phase 3: Drag-drop image upload to R2, auto-save drafts, full preview mode

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

*Last updated: November 28, 2025 - Completed in-website markdown editor with all Phase 3 features*
