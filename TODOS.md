# TODOs for AutumnsGrove

> **Last Updated:** January 5, 2026 - GroveEngine 0.8.6 upgrade completed

---

## ✅ Recently Completed

### GroveEngine 0.8.6 Upgrade (Jan 5, 2026)
- **Status**: ✅ COMPLETE
- **Migration**: GroveEngine 0.6.5 → 0.8.6
- **Package**: `@autumnsgrove/groveengine@0.8.6`
- **Admin Dashboard**: Fully migrated to latest engine capabilities
- **Breaking Changes**: None detected - 100% backward compatible
- **Tests**: All 184 tests passing
- **Build**: Successful with no critical errors
- **Documentation**:
  - Migration plan: `docs/GROVEENGINE-UPGRADE-PLAN.md`
  - Test results: `docs/MIGRATION-TEST-RESULTS.md`
  - Rollback procedures: `docs/ROLLBACK-PROCEDURES.md`
- **Files Created**: 3 documentation files
- **Backup**: `backup/pre-groveengine-upgrade-086` branch created
- **Rollback Ready**: Full rollback procedures documented

### GroveAuth Integration (Dec 8, 2025)
- Upgraded GroveEngine to 0.5.0, replaced magic‑code auth with OAuth2/PKCE flow.
- Users authenticate via `auth.grove.place` (Google, GitHub, or Magic Code).
- New files: `src/lib/auth/groveauth.ts`, login/callback routes.
- Deployment secrets configured.

### AI Writing Assistant (Dec 3, 2025)
- Non‑intrusive side panel with grammar, spelling, style analysis via Claude AI.
- Tone analysis, readability scoring, ASCII art "vibes".
- Apply fixes directly, rate limiting, model selection, command‑palette integration.
- **⚠️ Note (Dec 13, 2025):** Feature is enabled in settings but not fully functional. The UI is present but the actual AI analysis doesn't work yet. Needs investigation - likely missing API integration or endpoint issues. Low priority fix for future session.

### RSS Feed & Recipes D1 Integration (Dec 1, 2025)
- RSS endpoint at `/api/feed` with autodiscovery and `/rss.xml` redirect.
- D1 schema updated with recipes table; sync endpoints and GitHub Actions workflow.
- Admin recipes page uses D1 with fallback.

### Security & Polish Audit (Nov 29, 2025)
- XSS protection (DOMPurify), CSRF protection on all mutating endpoints.
- Security headers, console‑to‑toast error migration, input validation, rate limiting.
- Dependabot and security documentation.

### AI Timeline Enhancements (Nov 28, 2025)
- Multi‑provider AI support (Anthropic Claude, Cloudflare Workers AI).
- Model selector (8 models), cost tracking, background job processing.
- Timeline visualizations (sparklines, LOC bars, heatmap).

### Markdown Editor – Grove Writer (Nov 28, 2025)
- Slash commands, command palette, Zen mode, campfire sessions.
- Mermaid diagram previews, custom snippets, ambient sounds.
- Auto‑save drafts, drag‑and‑drop images, writing goals.

### Admin Panel Improvements (Nov 26, 2025)
- Fixed sidebar extending into footer, standardized border‑radius.
- Image gallery sorting, pages management with D1 sync, bidirectional sync workflow.

### shadcn‑svelte Migration (Nov 2025)
- 12 wrapper components created; all admin and public routes migrated.
- Reduced CSS by ~900+ lines.

---

## 🎯 Current Priorities

### 🔧 Immediate Fixes

#### RSS Feed Fix
- **Status**: Broken – feed not updating with full content
- **Issue**: Currently only includes post description, not full content, making it useless for RSS readers.
- **Location**: `src/routes/api/feed/+server.js`
- **Solution**: Add `<content:encoded>` element with full HTML content from markdown. Need to import `content` property from `getAllPosts` and include with proper XML escaping.
- **Reference**: RSS 2.0 with `xmlns:content="http://purl.org/rss/1.0/modules/content/"`.
- **Action**: Update feed generation to include full post content and verify caching.

#### Admin Page 500 Error
- **Status**: Fixed (per user confirmation)
- **Note**: Previously broken after GroveAuth integration; now resolved. Ensure authentication flow works correctly.

#### Deployment Secrets
- **Status**: Handled (per user confirmation)
- **Details**: ANTHROPIC_API_KEY and GroveAuth secrets have been configured via `wrangler secret put`.
- **Verification**: Run `./scripts/deploy-commands.sh` to confirm all secrets are set.

#### Missing Gutters & Table of Contents on Blog Posts
- **Status**: Investigating – likely GroveEngine or deployment issue
- **Issue**: Left gutter (comments, photos) and right gutter (TOC) not displaying on blog posts in production, even on wide desktop screens.
- **Investigation (Dec 13, 2025)**:
  - ✅ Local build works correctly – gutters render with full content
  - ✅ HTML is correct: `content-layout has-gutters has-left-gutter has-right-gutter has-both-gutters`
  - ✅ CSS rules present: `.desktop-only{display:none}` + `@media (min-width: 769px){.desktop-only{display:block}}`
  - ✅ Both gutter containers have content (gutter items, TOC headings)
  - ✅ CSS chunks load correctly (`0.JYb_qwhH.css`, `AIWritingPanel.SApGsyCR.css`)
- **Suspected causes**:
  - Stale production deployment (code works locally)
  - Browser/CDN caching old CSS
  - Possible issue with `@autumnsgrove/groveengine` v0.5.0 in production environment
- **Next steps**:
  1. Trigger fresh deployment on Cloudflare Pages
  2. Clear browser cache / test in incognito
  3. Purge Cloudflare CDN cache
  4. If still broken, investigate groveengine package differences between local and production
- **Key files**: `ContentWithGutter.svelte` (groveengine), `content.css` (groveengine), `src/routes/blog/[slug]/+page.svelte`

### 📋 Ready for Implementation (Spec‑Ready)

These features have complete specifications and can be picked up next:

| Feature | Effort | Spec Location | Notes |
|---------|--------|---------------|-------|
| Live Document Modes | 6‑8 hours | `docs/plans/live-document-modes-spec.md` | Multi‑mode editing (preview toggle, block editing, Zen mode) |
| Long‑Horizon Context Phase 2 | 2‑3 hours | `docs/plans/long-horizon-context-spec.md` | Enable context‑aware prompts & timeline UI indicators |

#### Long‑Horizon Context Status
- **Phase 1 Complete (Dec 8, 2025):** Data collection infrastructure deployed
  - `context.js` module with task detection patterns
  - Schema migration adding `context_brief`, `detected_focus`, `continuation_of`, `focus_streak`
  - Worker now stores context data with each summary
- **Phase 2 Pending:** Enable AI to *use* historical context in prompts
  - Modify `prompts.js` to include recent activity context
  - Add continuation acknowledgment ("Day 3 of auth refactor...")
  - Add timeline UI badge showing focus streak
  - Create debug API endpoint `/api/timeline/context/[date]`
- **Current state:** Context data is being collected but AI doesn't reference it yet

### 🚀 Upcoming Enhancements (Lower Priority)

#### Dashboard Improvements
- **Task C**: Paginate to fetch all repos using GraphQL cursor pagination (currently only first 100).
- **Project comparison charts**: Bar chart, radar/spider, activity timeline.
- **Mobile responsiveness**: Charts need media queries and resize listeners.
- **Loading states & animations**: Add skeleton loaders for charts.
- **Lazy‑load Chart.js**: Dynamic import to reduce initial bundle size.
- **Error boundaries**: Wrap chart components for graceful failures.

#### Personal Knowledge Base Page
- **Goal**: Aggregate recipes, raindrop articles, reference material, and Grove tools (scout, domains, music, search).
- **Implementation**: New route `/knowledge` with sub‑sections.
- **Status**: Idea stage; needs design and content gathering.

---

## ✅ Recently Completed

### GroveAuth Integration (Dec 8, 2025)
- Upgraded GroveEngine to 0.5.0, replaced magic‑code auth with OAuth2/PKCE flow.
- Users authenticate via `auth.grove.place` (Google, GitHub, or Magic Code).
- New files: `src/lib/auth/groveauth.ts`, login/callback routes.
- Deployment secrets configured.

### AI Writing Assistant (Dec 3, 2025)
- Non‑intrusive side panel with grammar, spelling, style analysis via Claude AI.
- Tone analysis, readability scoring, ASCII art "vibes".
- Apply fixes directly, rate limiting, model selection, command‑palette integration.
- **⚠️ Note (Dec 13, 2025):** Feature is enabled in settings but not fully functional. The UI is present but the actual AI analysis doesn't work yet. Needs investigation - likely missing API integration or endpoint issues. Low priority fix for future session.

### RSS Feed & Recipes D1 Integration (Dec 1, 2025)
- RSS endpoint at `/api/feed` with autodiscovery and `/rss.xml` redirect.
- D1 schema updated with recipes table; sync endpoints and GitHub Actions workflow.
- Admin recipes page uses D1 with fallback.

### Security & Polish Audit (Nov 29, 2025)
- XSS protection (DOMPurify), CSRF protection on all mutating endpoints.
- Security headers, console‑to‑toast error migration, input validation, rate limiting.
- Dependabot and security documentation.

### AI Timeline Enhancements (Nov 28, 2025)
- Multi‑provider AI support (Anthropic Claude, Cloudflare Workers AI).
- Model selector (8 models), cost tracking, background job processing.
- Timeline visualizations (sparklines, LOC bars, heatmap).

### Markdown Editor – Grove Writer (Nov 28, 2025)
- Slash commands, command palette, Zen mode, campfire sessions.
- Mermaid diagram previews, custom snippets, ambient sounds.
- Auto‑save drafts, drag‑and‑drop images, writing goals.

### Admin Panel Improvements (Nov 26, 2025)
- Fixed sidebar extending into footer, standardized border‑radius.
- Image gallery sorting, pages management with D1 sync, bidirectional sync workflow.

### shadcn‑svelte Migration (Nov 2025)
- 12 wrapper components created; all admin and public routes migrated.
- Reduced CSS by ~900+ lines.

---

## 📚 Completed Archive

### Infrastructure & Core
- Project initialized from BaseProject template.
- SvelteKit with Cloudflare Pages adapter.
- R2 bucket `autumnsgrove‑images` with custom domain `cdn.autumnsgrove.com`.
- KV namespace `CACHE_KV`, D1 database `autumnsgrove‑git‑stats`.
- Wrangler.toml with all bindings.

### Git Dashboard
- Full API routes for user, repos, stats, todos, history, contributions.
- Dashboard with charts, heatmap, recent commits, time‑range selector.
- D1 database synced (10 repos, 342 commits).
- Triple‑click avatar refresh with rate limiting.

### Daily Summary Timeline (Nov 27, 2025)
- Cloudflare Worker for daily summary generation.
- Llama 3.1 70B (Workers AI) + Claude Haiku 4.5 integration.
- Cron trigger at 11:59 PM Eastern daily; admin controls for manual trigger and backfill.

### Admin Panel
- Dashboard, blog, recipes, images, logs, analytics, settings pages.
- Authentication with logged‑in indicator, theme‑responsive styling.

### Image & Gallery Systems
- R2 upload helper script.
- Multi‑image gallery with navigation, keyboard/touch support.
- Lightbox integration with ZoomableImage, CDN image deletion with CSRF protection.

---

## 💡 Future Ideas

### UI & Styling
- Custom themes (beyond dark/light).
- Component library expansion (Alert, Popover, Dropdown wrappers).
- Image optimization with `@sveltejs/enhanced‑img`.

### User Features (Far Future)
- Public commenting on posts.
- User likes/upvotes system.
- OAuth integration (GitHub, Google).

### Inspiration
- [マリウス.com](https://マリウス.com/collection/make/) – Hacker aesthetic.
- [joshtronic.com](https://joshtronic.com/) – Text‑focused design.
- [bagerbach.com](https://bagerbach.com/) – Clean blog.

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
| R2 Bucket | `autumnsgrove‑images` |
| KV Namespace | `CACHE_KV` |
| D1 Database | `autumnsgrove‑git‑stats` |

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

1. **Fix RSS feed** – implement full‑content inclusion.
2. **Long‑Horizon Context Phase 2** – Enable context‑aware AI prompts (after 2‑4 days of data collection).
3. **Consider starting Live Document Modes** – Multi‑mode editing for Grove Writer.

---

*Updated December 9, 2025 – Long‑Horizon Context Phase 1 complete, Phase 2 pending.*