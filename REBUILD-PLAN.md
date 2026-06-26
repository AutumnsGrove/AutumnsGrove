# AutumnsGrove Rebuild Plan

## Context

AutumnsGrove is being revived from a redirect stub into a standalone personal website at autumnsgrove.com. The site shares blog data with the Grove (autumn.grove.place) via direct D1 binding but is free to add its own pages, portfolio, chatbot, timeline, and other features without multi-tenancy constraints.

All Lattice sub-packages were published to npm (2026-06-26), enabling clean consumption as npm dependencies.

---

## Phase 0: Restore Project Configuration ✅

**Completed 2026-06-26.**

- Restored configs from `archives/config/`
- Swapped `@autumnsgrove/groveengine` → `@autumnsgrove/lattice@^1.2.2`
- Added `@autumnsgrove/grove-markdown`, `@autumnsgrove/prism`, `@autumnsgrove/gossamer`, `unist-util-visit`
- 423 packages installed cleanly

## Phase 1: Infrastructure — Pages → Workers ✅

**Completed 2026-06-26.**

- Created `wrangler.toml` for Workers mode with `[assets]` binding
- Bindings: `GROVE_DB` (grove-engine-db), `CURIO_DB` (grove-curios-db), `MEDIA` (grove-media R2), `CACHE_KV`, `GROVEAUTH` service binding
- `TENANT_ID = "autumn-primary"` set as env var
- Updated `src/app.d.ts` Platform types to match
- Created `.dev.vars` / `.dev.vars.example` for local secrets
- Old binding renames: `POSTS_DB` → `GROVE_DB`, `GIT_STATS_DB` → `GROVE_DB`, `IMAGES` → `MEDIA`

## Phase 2: Import Migration (groveengine → lattice) ✅

**Completed 2026-06-26.**

- Migrated 56 files across `src/` from `@autumnsgrove/groveengine` to `@autumnsgrove/lattice`
- CSS paths: `groveengine/ui/styles/*` → `lattice/styles/*`
- Fixed `safeJsonParse` import path (`utils` → `server`)
- Updated Tailwind content path to scan lattice package
- Restored `tailwind.typography.config.js` from archives
- Build passes (8,782 modules)

## Phase 3: Database Layer ✅

**Completed 2026-06-26.**

- Created `src/lib/server/db.js` — centralized, tenant-scoped query module
- Functions: `getGroveDb`, `getCurioDb`, `getPublishedPosts`, `getAllPosts`, `getPostBySlug`, `createPost`, `updatePost`, `deletePost`, `postExistsBySlug`, `getPages`, `getPageBySlug`, `getSiteSettings`, `updateSiteSetting`, `getMediaBucket`
- All Grove D1 queries include `WHERE tenant_id = ?` filtering
- Adapted to Grove schema: `published_at` (INTEGER epoch) ↔ `date` (YYYY-MM-DD string)
- Removed filesystem fallback paths (Workers-only now)
- Updated blog routes, admin routes, settings API, pages API to use centralized module
- **Known deferred:** Timeline/git API routes still reference `GROVE_DB` but their tables live in `CURIO_DB` — needs rewiring in Phase 4+

## Phase 4: Hybrid Page System

**Goal:** Named routes for complex features + catch-all for DB-backed pages.

1. **Keep existing named routes** — home, blog, gallery, timeline, about, contact, credits, admin/*, auth/*, api/*
2. **Add new named routes:**
   - `src/routes/portfolio/` — reads portfolio_items from LOCAL_DB
   - `src/routes/chat/` — chatbot stub (future)
3. **Add catch-all route** `src/routes/[...slug]/` — renders DB-backed content pages from LOCAL_DB pages table
4. **Update layout nav** — generate from `data.navItems` (loaded from pages table) instead of hardcoded links

## Phase 5: Admin Panel Updates

**Goal:** Admin manages both Grove D1 (posts) and local D1 (pages, settings, portfolio).

1. **Blog admin** — update DB references from POSTS_DB to GROVE_DB with tenant_id
2. **Pages admin** — update DB references to LOCAL_DB, add visibility toggle + display_order controls
3. **Add portfolio admin** — new route at `/admin/portfolio` with CRUD
4. **Settings admin** — update from GIT_STATS_DB to LOCAL_DB
5. **Images admin** — rename IMAGES binding to MEDIA
6. **Update sidebar** — add Portfolio nav item

## Phase 6: Design & Cross-Links

1. **Apply Prism design tokens** — update `tailwind.config.js` with `@autumnsgrove/prism/tailwind` preset
2. **Update CSS imports** — `lattice/styles/tokens.css` replaces `groveengine/ui/styles/tokens.css`
3. **Add cross-links** — footer link to autumn.grove.place, and vice versa
4. **Distinct identity touches** — same warm grove aesthetic, but this is YOUR site, not a tenant

## Phase 7: Cleanup

1. Delete `workers/redirect/`, `workers/sync-posts/`, `workers/daily-summary/`
2. Simplify `src/lib/content/markdown.js` (remove filesystem loading)
3. Update tests (import paths)
4. Update AGENT.md and CLAUDE.md to reflect new architecture

---

## Verification

1. `pnpm dev` — SvelteKit dev server works
2. `wrangler dev` — Workers mode works with D1/R2 bindings
3. Blog post list loads from GROVE_DB
4. Blog post detail renders with Vines/gutter
5. Admin panel: create a post → appears on both autumnsgrove.com and autumn.grove.place
6. Admin panel: create/toggle pages → nav updates
7. `pnpm build` — production build succeeds
8. `wrangler deploy` — deploys to autumnsgrove.com

## Execution Order

~~Start with **Phase 0 + Phase 2** (restore config + import migration) to get the project building.~~ ✅
~~Then **Phase 1** (infrastructure) and **Phase 3** (database) together since they're coupled.~~ ✅

**Next up:** Phase 4 (hybrid page system) → Phase 5 (admin updates) → Phase 6 (design) → Phase 7 (cleanup). These can proceed incrementally.

**Before starting Phase 4:** Rewire timeline/git API routes from `GROVE_DB` to `CURIO_DB`.
