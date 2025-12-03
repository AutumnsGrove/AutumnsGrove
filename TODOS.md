# TODOs for AutumnsGrove

> **Last Updated:** December 3, 2025 - Condensed and synced with recent commits

---

## 🔧 BLOCKED: GroveEngine Package Migration

**Status:** Ready to execute when npm auth is fixed

**Issue:** Cannot login to npm to publish `@autumnsgrove/groveengine` package. Working with npm support.

**Current State:**
- AutumnsGrove uses direct `$lib/*` imports (works perfectly)
- GroveEngine package exists but isn't published to npm
- Migration planning complete

**Full Specification:** `docs/plans/MIGRATION-MASTER-PLAN.md`

**Quick Reference - Phases:**
1. Publish GroveEngine to npm (~30 min)
2. Update AutumnsGrove dependencies (~15 min)
3. Update import paths (~2-3 hours, see import mapping in spec)
4. Delete redundant local code (~30 min)
5. Final validation (~1 hour)
6. Deploy & commit (~15 min)

---

## 🔲 Remaining Active Tasks

### Deploy Pending
- [ ] Deploy worker with `wrangler secret put ANTHROPIC_API_KEY`

### Admin Page Still Broken
- [ ] Admin page (`/admin`) still not accessible after GroveEngine import fix - needs further investigation

### RSS Feed Fix
- [ ] Include full post content in RSS feed (currently only sends description, making it not useful for readers who want to read in their RSS app)

### Dashboard Enhancements (Low Priority)
- [ ] Task C: Paginate to fetch all repos using GraphQL cursor pagination
- [ ] Project comparison charts (bar chart, radar/spider, activity timeline)
- [ ] Mobile responsiveness improvements for charts
- [ ] Loading states and animations
- [ ] Lazy-load Chart.js (reduce initial bundle)
- [ ] Add error boundaries for graceful failures

---

## 📋 READY: Features with Complete Specs

These features have comprehensive specifications and are ready for implementation:

| Feature | Effort | Spec Location |
|---------|--------|---------------|
| Live Document Modes | 6-8 hours | `docs/plans/live-document-modes-spec.md` |
| Long-Horizon Context | 4-6 hours | `docs/plans/long-horizon-context-spec.md` |

### Live Document Modes Summary
Multi-mode editing experience with three modes:
1. **Live Preview Toggle** (Cmd+Shift+P) - GitHub-style edit/preview switch
2. **Notion-Style Block Editing** (Cmd+Shift+L) - Click-to-edit blocks
3. **Enhanced Zen Mode** (P key in Zen) - Preview toggle in fullscreen

### Long-Horizon Context Summary
Enable daily summary AI to recognize multi-day tasks by providing historical context from previous summaries. Includes context brief generation, multi-day task detection, and Anthropic prompt caching.

---

## ✅ Recently Completed

### AI Writing Assistant (Dec 3, 2025) - Complete
- [x] Non-intrusive panel that sits on the side as a minimized tab
- [x] Grammar, spelling, and style analysis via Claude AI
- [x] Tone analysis with trait visualization
- [x] Local readability scoring (Flesch-Kincaid grade level)
- [x] ASCII art "vibes" - text landscapes that create atmosphere
- [x] Apply grammar fixes directly from suggestions
- [x] Rate limiting (20 requests/hour) and usage tracking
- [x] Settings page integration with enable/disable toggle
- [x] Model selection (Haiku for speed, Sonnet for depth)
- [x] Command palette integration when enabled
- [x] Database schema for `ai_writing_requests` tracking
- Spec: `docs/plans/ai-writing-assistant-spec.md`

### Admin Page 500 Error (Dec 3, 2025) - Partially Fixed
- [x] Fixed `@autumnsgrove/groveengine` import resolution at Cloudflare Pages runtime
- [x] Replaced all imports with direct `$lib/*` imports across 45+ files
- [x] Commits: `6a13638`, `09635bf`
- ⚠️ **Still broken** - admin page still not accessible, needs further investigation

### RSS Feed (Dec 1, 2025)
- [x] Created RSS endpoint at `/api/feed`
- [x] Added autodiscovery link and `/rss.xml` redirect
- [x] Proper XML escaping, CDATA handling, 1-hour cache

### Recipes D1 Integration (Dec 1, 2025)
- [x] Updated D1 schema with recipes table
- [x] Added sync endpoints to sync-posts worker
- [x] Created GitHub Actions workflow for recipe sync
- [x] Updated admin recipes page with D1 fetch and fallback

### Security & Polish Audit (Nov 29, 2025)
All critical, high, medium, and low priority items completed:
- [x] XSS protection with DOMPurify
- [x] CSRF protection on all POST/PUT/DELETE endpoints
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] Console-to-toast error migration
- [x] Loading states and accessibility improvements
- [x] Input validation and rate limiting improvements
- [x] Dependabot and security documentation

### AI Timeline Enhancements (Nov 28, 2025)
- [x] Multi-provider AI support (Anthropic Claude, Cloudflare Workers AI)
- [x] Model selector with 8 models available
- [x] Cost tracking with `ai_usage` and `ai_requests` tables
- [x] Background job processing infrastructure
- [x] Timeline visualizations (sparklines, LOC bars, heatmap)
- [x] Improved prompt tone (6/10 professional, 4/10 fun)

### Markdown Editor - Grove Writer (Nov 28, 2025)
Full feature set completed:
- [x] Slash commands, command palette (Cmd+K)
- [x] Zen mode with typewriter scrolling
- [x] Campfire sessions with timer and ember animation
- [x] Mermaid diagram previews
- [x] Custom markdown snippets
- [x] Ambient sounds (forest, rain, campfire, night, café)
- [x] Auto-save drafts, drag-and-drop images
- [x] Writing goals and reading time estimates

### Admin Panel Improvements (Nov 26, 2025)
- [x] Fixed sidebar extending into footer
- [x] Standardized border-radius with CSS variables
- [x] Image gallery sorting (newest, oldest, A-Z, size)
- [x] Pages management system with D1 sync
- [x] Bidirectional sync workflow (files ↔ D1 ↔ admin)

### shadcn-svelte Migration (Nov 2025)
- [x] 12 wrapper components created (Button, Card, Badge, Input, Select, Tabs, Dialog, Accordion, Sheet, Toast, Skeleton, Table)
- [x] All admin and public routes migrated
- [x] Reduced CSS by ~900+ lines
- [x] Documentation: `docs/shadcn-migration-complete.md`

---

## ✅ Completed Archive

### Infrastructure & Core (Completed)
- [x] Project initialized from BaseProject template
- [x] SvelteKit with Cloudflare Pages adapter
- [x] R2 bucket: `autumnsgrove-images` with custom domain `cdn.autumnsgrove.com`
- [x] KV namespace: `CACHE_KV`
- [x] D1 database: `autumnsgrove-git-stats`
- [x] Wrangler.toml with all bindings

### Git Dashboard (Completed)
- [x] Full API routes for user, repos, stats, todos, history, contributions
- [x] Dashboard page with charts, heatmap, recent commits
- [x] Time range selector (All Time / 6 Months / 30 Days)
- [x] D1 database synced (10 repos, 342 commits)
- [x] Triple-click avatar refresh with rate limiting

### Daily Summary Timeline (Completed Nov 27, 2025)
- [x] Cloudflare Worker for daily summary generation
- [x] Llama 3.1 70B (Workers AI) + Claude Haiku 4.5 integration
- [x] Cron trigger at 11:59 PM Eastern daily
- [x] Admin controls for manual trigger and backfill
- [x] Worker URL: `https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev`

### Admin Panel (Completed Nov 2025)
- [x] Dashboard, blog, recipes, images, logs, analytics, settings pages
- [x] Authentication with logged-in indicator
- [x] Theme-responsive styling

### Image & Gallery Systems (Completed)
- [x] R2 upload helper script
- [x] Multi-image gallery with navigation, keyboard/touch support
- [x] Lightbox integration with ZoomableImage
- [x] CDN image deletion with CSRF protection

---

## 💡 Future Ideas

### UI & Styling
- Custom themes (beyond dark/light)
- Component library expansion (Alert, Popover, Dropdown wrappers)
- Image optimization with `@sveltejs/enhanced-img`

### User Features (Far Future)
- Public commenting on posts
- User likes/upvotes system
- OAuth integration (GitHub, Google)

### Inspiration
- [マリウス.com](https://マリウス.com/collection/make/) - Hacker aesthetic
- [joshtronic.com](https://joshtronic.com/) - Text-focused design
- [bagerbach.com](https://bagerbach.com/) - Clean blog

---

## 📝 Quick Reference

### Local Development
```bash
npx wrangler pages dev -- npm run dev
# Access at http://localhost:8788
```

### Key Files
| File | Purpose |
|------|---------|
| `src/routes/dashboard/+page.svelte` | Dashboard page |
| `src/routes/admin/` | Admin panel |
| `src/lib/utils/github.js` | GitHub utilities |
| `src/routes/api/git/` | Git API routes |
| `src/lib/db/schema.sql` | D1 schema |
| `wrangler.toml` | Cloudflare config |
| `.dev.vars` | Local secrets (gitignored) |

### Cloudflare Resources
| Resource | ID/Name |
|----------|---------|
| R2 Bucket | `autumnsgrove-images` |
| KV Namespace | `CACHE_KV` |
| D1 Database | `autumnsgrove-git-stats` |

### API Endpoints
| Endpoint | Description | Cache |
|----------|-------------|-------|
| `/api/git/user/[username]` | User profile | 3 hours |
| `/api/git/stats/[username]` | Commit stats | 3 hours |
| `/api/git/repos/[username]` | Repositories | 3 hours |
| `/api/git/todos/[username]/[repo]` | TODO extraction | 30 min |
| `/api/git/history/[username]/[repo]` | Historical data | 30 min |
| `/api/ai/analyze/[username]/[repo]` | AI analysis | 6 hours |
| `/api/feed` | RSS feed | 1 hour |

---

## 🚀 Next Session Checklist

### 1. Deploy Recent Changes
```bash
./scripts/deploy-commands.sh
```

### 2. Verify Features
- `/api/feed` - RSS XML
- `/rss.xml` - Redirect works
- `/admin/recipes` - D1 loading

### 3. Next Implementation Options

| Feature | Effort | Status |
|---------|--------|--------|
| Live Document Modes | 6-8 hours | Spec ready |
| Long-Horizon Context | 4-6 hours | Spec ready |
| Dashboard Pagination | 2-3 hours | Low priority |

---

*Condensed December 3, 2025 - Reduced from 1,388 to ~300 lines while preserving all completed items for reference*
