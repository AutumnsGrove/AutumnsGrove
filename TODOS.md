# TODOs for AutumnsGrove

> **Last Updated:** December 1, 2025 - RSS feed, Recipes D1 integration, comprehensive scoping docs for future features

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

## 🔍 Security & Polish Audit (Nov 29, 2025)

**Status:** ✅ All critical and high priority items completed

### Critical Security Issues (Immediate Fix Required) ✅ COMPLETED

**XSS Vulnerability - Unescaped HTML Rendering:**
- [x] Install DOMPurify package (`npm install dompurify @types/dompurify`)
- [x] Add HTML sanitization to `ContentWithGutter.svelte:465`
- [x] Add HTML sanitization to `InternalsPostViewer.svelte:23`
- [x] Configure allowed tags/attributes for markdown rendering
- [x] Test with malicious payloads before deploying

**CSRF Protection Missing:**
- [x] Create CSRF validation utility (`src/lib/utils/csrf.js`)
- [x] Add CSRF checks to `POST /api/images/upload`
- [x] Add CSRF checks to `POST /api/posts`
- [x] Add CSRF checks to `PUT /api/posts/[slug]`
- [x] Add CSRF checks to `DELETE /api/posts/[slug]`
- [x] Add CSRF checks to `PUT /api/admin/settings`

**Security Headers:**
- [x] Add security headers to `hooks.server.js`:
  - [x] X-Frame-Options: DENY
  - [x] X-Content-Type-Options: nosniff
  - [x] Referrer-Policy: strict-origin-when-cross-origin
  - [x] Permissions-Policy
  - [x] Content-Security-Policy (production only, needs Mermaid adjustments)

### High Priority Polish (User-Facing) ✅ COMPLETED

**Error Handling - Console to Toast Migration:**
- [x] `src/routes/admin/analytics/+page.svelte:19` - Stats fetch error
- [x] `src/routes/timeline/+page.svelte:42,225` - Activity fetch errors
- [x] `src/routes/admin/settings/+page.svelte:21,60` - Font/health check errors
- [x] `src/routes/admin/images/+page.svelte:204` - Copy-to-clipboard error
- [x] `src/lib/components/admin/GutterManager.svelte:148` - CDN image load error
- [x] `src/routes/admin/timeline/+page.svelte:59,77,90` - Three fetch errors

**Loading States:**
- [x] Add loading indicator to Analytics page (stats cards)
- [x] Add loading indicator to Settings page (health check, font settings)
- [x] Add loading indicator to GutterManager (CDN images)
- [x] Expand Skeleton component usage across admin panel

**Accessibility:**
- [x] Add aria-label to drop zone (`admin/images/+page.svelte:282`)
- [x] Add aria-label to MarkdownEditor container
- [x] Add aria-expanded to details toggle elements
- [x] Add Space key handler to drop zones (currently only Enter works)

### Medium Priority Security ✅ COMPLETED

**Input Validation:**
- [x] Add strict validation to Timeline API year/month params (`/api/timeline/+server.js:71-76`)
- [x] Add length limits to post content fields (`/api/posts/+server.js`)
- [x] Fix ReDoS vulnerability in username regex (`src/lib/utils/github.js:16`)

**Session Cookie:**
- [x] Replace hostname detection with `ENVIRONMENT` env var check
- [x] Update `createSessionCookie()` to use `platform.env.ENVIRONMENT`

**Rate Limiting:**
- [x] Consider moving rate limit state from D1 to KV (faster)
- [x] Add exponential backoff for repeated auth failures
- [x] Increase time window from 1 min to 5 min

### Low Priority ✅ COMPLETED

**Information Disclosure:**
- [x] Replace detailed error messages with generic ones (keep details in logs)
- [x] Example: "Posts database not configured" → "Service temporarily unavailable"

**Dependency Security:**
- [x] Create `.github/dependabot.yml` for automated dependency updates
- [x] Add `npm audit` script to package.json
- [x] Add security testing to CI/CD pipeline

**Security Documentation:**
- [x] Create `SECURITY.md` with vulnerability reporting instructions
- [x] Document security testing checklist

### Audit Documentation

**Generated Reports:**
- Security Audit Report: Comprehensive 8.6/10 CVSS findings with remediation steps
- Polish Opportunities: 15 identified improvements across UX, accessibility, error handling
- Overall Grade: B+ → A potential with fixes

**Key Findings:**
- ✅ Excellent authentication implementation (passwordless, JWT, rate limiting)
- ✅ Good input validation patterns already in place
- ⚠️ XSS protection needs immediate attention
- ⚠️ CSRF coverage incomplete on API routes
- 💎 Many small polish opportunities with high user impact

---

## 🔲 Remaining Tasks

### HIGH PRIORITY: Admin Panel Improvements (Nov 26, 2025)

**Status:** ✅ Pages management completed (Nov 29, 2025)

#### Completed:
- [x] Fix admin sidebar extending into footer (height: 100vh issue)
- [x] Standardize border-radius across admin panel with CSS variables
- [x] Add admin indicators (checkmark/cog) to `/blog` route when logged in
- [x] Improve images gallery sorting:
  - [x] Add server-side sorting to `/api/images/list`
  - [x] Add sort dropdown UI (newest first, oldest first, A-Z, Z-A, size)
  - [x] Default to newest-first (match public gallery)
- [x] Add rounded corners to admin sidebar with inset positioning
- [x] Add admin panel for editing site pages (Home, About, Contact)
- [x] Create page editor at `/admin/pages/edit/[slug]` with markdown editor
- [x] Add hero section editor for customizing page headers
- [x] Create API endpoint `PUT /api/pages/[slug]` for saving page updates
- [x] Create sync script `scripts/sync-pages.cjs` for syncing files to D1
- [x] Create reverse sync script `scripts/pull-pages.cjs` for D1 to files
- [x] Migrate home page content from filesystem to D1 database
- [x] Implement bidirectional sync workflow (files ↔ D1 ↔ admin panel)

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

### READY: Long-Horizon Context System

**Status:** Comprehensive specification complete - Ready for implementation

**Full Specification:** `docs/plans/long-horizon-context-spec.md`

**Overview:** Enable the daily summary AI to recognize and comment on multi-day tasks by providing historical context from previous summaries.

**Key Components:**
1. Context brief generation for each day's summary
2. Historical context retrieval (past 3 days)
3. Multi-day task detection and continuation tracking
4. Enhanced prompts with context awareness
5. Anthropic prompt caching for cost reduction

**Estimated Effort:** 4-6 hours across multiple sessions

**Dependencies:**
- Daily summary worker (completed)
- D1 database (completed)
- Claude API integration (completed)

---

### ~~HIGH PRIORITY: Recipes D1 Integration~~ ✅ COMPLETED (Dec 1, 2025)

**Status:** Fully implemented

**What was accomplished:**
- [x] Updated D1 schema with recipes table (includes `url` field)
- [x] Added recipe sync endpoints to `workers/sync-posts/index.js`:
  - `POST /sync-recipes` - Sync recipes from GitHub
  - `GET /recipes` - List all recipes
  - `GET /recipes/[slug]` - Get single recipe
- [x] Created GitHub Actions workflow `.github/workflows/sync-recipes.yml`
- [x] Updated admin recipes page to fetch from D1 with filesystem fallback
- [x] Added Source column to admin table (shows external URL or "Original")
- [x] Updated new recipe template with `url:` field

**Files Modified/Created:**
- `workers/sync-posts/schema.sql` - Added recipes table
- `workers/sync-posts/index.js` - Added recipe handlers
- `.github/workflows/sync-recipes.yml` - Recipe sync workflow
- `src/routes/admin/recipes/+page.server.js` - D1 fetch with fallback
- `src/routes/admin/recipes/+page.svelte` - UI updates

**Deployment:** Run `scripts/deploy-commands.sh` to apply schema and deploy

---

### ~~MEDIUM PRIORITY: RSS Feed Implementation~~ ✅ COMPLETED (Dec 1, 2025)

**Status:** Implemented and deployed

**What was accomplished:**
- [x] Created RSS endpoint at `src/routes/api/feed/+server.js`
- [x] Added RSS autodiscovery link to `src/routes/+layout.svelte`
- [x] Created `/rss.xml` redirect to `/api/feed`
- [x] Proper XML escaping and CDATA handling
- [x] Uses site config for metadata
- [x] 1-hour cache headers

**URLs:**
- Main feed: `/api/feed`
- Redirect: `/rss.xml`

**Documentation:** `docs/RSS_FEED_IMPLEMENTATION.md`

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

### READY: Live Document Modes (Multi-Mode Editing Experience)

**Status:** Comprehensive specification complete - Ready for implementation

**Full Specification:** `docs/plans/live-document-modes-spec.md`

**Goal:** Transform the markdown editor into a fluid, multi-mode writing experience that adapts to different workflows. Think Notion meets Obsidian meets your terminal-grove aesthetic.

**Estimated Effort:** 6-8 hours across multiple sessions

**The Three Modes (All Working Together):**

#### Mode 1: Live Preview Toggle (GitHub-Style)
**Keyboard:** `Cmd+Shift+P` (Preview)

Simple toggle between editing and reading:
```
Split View → Press Cmd+Shift+P → Full Preview
┌───────┬───────┐              ┌──────────────────┐
│ Edit  │ View  │     →        │   Preview        │
└───────┴───────┘              │  (reading mode)  │
                               │  [Edit] button   │
                               └──────────────────┘
```

**Implementation:**
- [ ] Add `viewMode` state: 'split' | 'edit-only' | 'preview-only'
- [ ] Hide editor pane when in preview-only mode
- [ ] Expand preview to full-width (max 800px for reading)
- [ ] Add floating "Edit Mode" button in bottom-right
- [ ] Add to command palette (Cmd+K → "Toggle Live Preview")
- [ ] Keyboard shortcut: Cmd+Shift+P

**UX Benefits:**
- Quick switch to distraction-free reading
- Check formatting without split-view clutter
- Perfect for final review before publishing
- Smooth transition (no jarring mode change)

---

#### Mode 2: Notion-Style Block Editing (Live Document)
**Keyboard:** `Cmd+Shift+L` (Live Document)

Click-to-edit blocks that auto-render:
```
┌─────────────────────────────────┐
│  # Welcome to AutumnsGrove      │  (click to edit)
│                                 │
│  This is a paragraph of text.   │  (click to edit)
│  You can click anywhere to      │
│  start editing that block.      │
│                                 │
│  [Type / for commands]          │
└─────────────────────────────────┘
```

**Implementation:**
- [ ] Parse markdown into "blocks" (heading, paragraph, code, list, etc.)
- [ ] Render each block with `contenteditable` wrapper
- [ ] Click block → shows markdown source in mini-editor
- [ ] Type → updates block in real-time
- [ ] Blur → re-renders markdown to HTML
- [ ] Support slash commands (`/heading`, `/code`, etc.)
- [ ] Toolbar appears near active block

**Technical Approach:**
```svelte
<script>
  let blocks = $derived(parseMarkdownToBlocks(markdown));
  let editingBlockId = $state(null);

  function handleBlockClick(blockId) {
    editingBlockId = blockId;
    // Show inline editor for this block
  }

  function handleBlockBlur(blockId, newContent) {
    // Update markdown, re-render block
    editingBlockId = null;
  }
</script>

{#each blocks as block}
  {#if editingBlockId === block.id}
    <textarea bind:value={block.raw} onblur={() => handleBlockBlur(block)} />
  {:else}
    <div onclick={() => handleBlockClick(block.id)}>
      {@html block.rendered}
    </div>
  {/if}
{/each}
```

**UX Benefits:**
- Wysiwyg feel with markdown simplicity
- No mental context switch (edit in-place)
- Perfect for quick fixes ("just change this word")
- Feels modern and fluid

---

#### Mode 3: Enhanced Zen Mode with Live Preview
**Keyboard:** `P` (while in Zen Mode)

Add preview toggle to existing Zen Mode:
```
Zen Mode (Cmd+Shift+Enter)
┌────────────────────────────────┐
│  Fullscreen Editor             │
│  (typewriter, faded toolbar)   │
│                                │
│  Press P → Toggle Preview      │
└────────────────────────────────┘
         ↓ Press P
┌────────────────────────────────┐
│  Fullscreen Preview            │
│  (rendered, reading mode)      │
│                                │
│  Press P → Back to Editor      │
│  Press Esc → Exit Zen          │
└────────────────────────────────┘
```

**Implementation:**
- [ ] Detect `P` keypress while `zenMode === true`
- [ ] Toggle `zenPreviewMode` state
- [ ] Swap editor/preview pane visibility
- [ ] Maintain fullscreen, typewriter, toolbar fade
- [ ] Add subtle indicator "Preview Mode (P to edit)"
- [ ] Preserve Zen aesthetic (dark, minimal)

**Code Snippet:**
```svelte
function handleZenKeydown(e) {
  if (zenMode && e.key === 'p' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    zenPreviewMode = !zenPreviewMode;
  }

  if (e.key === 'Escape') {
    zenMode = false;
    zenPreviewMode = false;
  }
}
```

**UX Benefits:**
- Stay in flow state (no mode exit needed)
- Quick preview check without leaving Zen
- Perfect for campfire sessions (write, preview, repeat)
- Maintains focus and calm

---

### Implementation Plan: All Three Modes

**Phase 1: Foundation (Simple Toggle) - 1-2 hours**
- [ ] Add `viewMode` state management
- [ ] Implement Mode 1 (Live Preview Toggle)
- [ ] Add keyboard shortcut (Cmd+Shift+P)
- [ ] Style full-width preview mode
- [ ] Add floating "Edit Mode" button
- [ ] Test with existing editor features

**Phase 2: Enhanced Zen - 30 minutes**
- [ ] Implement Mode 3 (Zen Preview Toggle)
- [ ] Add `P` key handler to Zen Mode
- [ ] Add mode indicator UI
- [ ] Test Zen + Preview flow

**Phase 3: Live Document (Advanced) - 3-4 hours**
- [ ] Build markdown block parser
- [ ] Implement click-to-edit blocks
- [ ] Add inline mini-editor component
- [ ] Handle block updates and re-rendering
- [ ] Integrate slash commands with blocks
- [ ] Test with complex markdown (lists, code, tables)
- [ ] Polish transitions and animations

**Phase 4: Polish & Integration - 1 hour**
- [ ] Update command palette with all modes
- [ ] Add keyboard shortcuts help panel
- [ ] Document mode switching in status bar
- [ ] Add smooth transitions between modes
- [ ] Test all mode combinations
- [ ] Update CLAUDE.md with new features

**Total Estimated Time:** 6-8 hours spread across multiple sessions

---

### Design Mockups

**Mode Switcher UI (Status Bar)**
```
┌─────────────────────────────────────────────┐
│ View: [Split] [Preview] [Live Doc] [Zen]   │
│ Ln 42, Col 18  •  1,247 words  •  ~6 min   │
└─────────────────────────────────────────────┘
```

**Keyboard Shortcuts Summary**
```
Mode Switching:
  Cmd+Shift+P    → Toggle Preview
  Cmd+Shift+L    → Live Document Mode
  Cmd+Shift+Enter → Zen Mode
  P (in Zen)     → Toggle Preview in Zen
  Esc            → Exit current mode
```

**Visual Transitions**
- Fade between modes (200ms ease-in-out)
- Floating button scale-in animation
- Toolbar slide/fade for Zen
- Block highlight on hover (Live Doc)

---

### Why This Rocks

**For Quick Edits:**
- Live Document mode → click, fix, done

**For Deep Writing:**
- Zen mode → immersive focus
- P key → quick preview check
- Back to writing, stay in flow

**For Final Review:**
- Preview toggle → reading mode
- Full-width prose, zero distractions
- "Edit" button when you spot issues

**For Different Moods:**
- Split view (default, balanced)
- Preview-only (reader mode)
- Live doc (modern, Notion-like)
- Zen (writer mode, campfire vibes)

---

### Inspiration & References

**Notion:** Click-to-edit blocks, slash commands
**Obsidian:** Live preview mode, reading view
**iA Writer:** Focus mode, reading mode toggle
**Typora:** True WYSIWYG markdown editing
**Your Grove Writer:** Terminal aesthetic, Zen mode, campfire sessions

The goal: **Best of all worlds**, in your unique forest terminal aesthetic.

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

### READY: AI Writing Assistant for MarkdownEditor

**Status:** Comprehensive specification complete - Ready for implementation

**Full Specification:** `docs/plans/ai-writing-assistant-spec.md`

**Goal:** Add ethical AI writing tools to help polish posts WITHOUT generating content

**Core Principle:** AI is a TOOL, never a writer. Users write their own posts.

**Key Features:**
- Grammar/spelling corrections (like Grammarly)
- Readability scoring (Flesch-Kincaid)
- Tone analysis and suggestions
- Settings toggle (OFF by default)
- Command palette integration
- Usage tracking with cost transparency

**Estimated Effort:** 8-12 hours across multiple sessions

**Infrastructure (Already Ready):**
- Anthropic API configured
- D1 database for usage tracking
- Claude Haiku 4.5 integration working
- Settings system in place

**Estimated Costs:**
- Light user (10 posts, 3 checks each): ~$0.02/month
- Heavy user (50 posts, 10 checks each): ~$0.25/month

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

### 1. Deploy Recent Changes

Run the deployment script to apply all recent changes:
```bash
# Interactive deployment script - handles migrations, secrets, and deploys
./scripts/deploy-commands.sh

# Or deploy manually:
# Apply recipes table migration
wrangler d1 execute autumnsgrove-posts --file=workers/sync-posts/schema.sql

# Deploy sync-posts worker (includes recipe endpoints)
cd workers/sync-posts && wrangler deploy && cd ../..

# Deploy main site
npm run build && wrangler pages deploy .svelte-kit/cloudflare
```

### 2. Verify New Features

**RSS Feed:**
- Visit `/api/feed` - should return valid RSS XML
- Visit `/rss.xml` - should redirect to `/api/feed`
- Test in an RSS reader

**Recipes D1:**
- Push a recipe to `UserContent/Recipes/` - GitHub Action should sync
- Visit `/admin/recipes` - should show "Loading from D1" badge
- Try adding `url:` field to a recipe frontmatter

### 3. Next Implementation Options

**Ready for Implementation (with full specs):**

| Feature | Effort | Spec |
|---------|--------|------|
| Live Document Modes | 6-8 hours | `docs/plans/live-document-modes-spec.md` |
| Long-Horizon Context | 4-6 hours | `docs/plans/long-horizon-context-spec.md` |
| AI Writing Assistant | 8-12 hours | `docs/plans/ai-writing-assistant-spec.md` |

**Lower Priority:**
- Dashboard Data Expansion (paginate all repos)
- Dashboard Visualizations (comparison charts)
- UI Polish (mobile, loading states)

---

*Last updated: December 1, 2025 - RSS feed, Recipes D1 integration, comprehensive scoping docs*
