# AutumnsGrove Rebuild Plan

## Context

AutumnsGrove is being revived from a redirect stub into a standalone personal website at autumnsgrove.com. The site shares blog data with the Grove (autumn.grove.place) via direct D1 binding but is free to add its own pages, portfolio, chatbot, timeline, and other features without multi-tenancy constraints.

All Lattice sub-packages were published to npm (2026-06-26), enabling clean consumption as npm dependencies.

---

## Phase 0: Restore Project Configuration

**Goal:** Un-mothball the project so it builds.

1. Copy config files from `archives/config/` back to project root: `package.json`, `svelte.config.js`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `tsconfig.json`, `components.json`
2. Update `package.json`:
   - Replace `@autumnsgrove/groveengine` → `@autumnsgrove/lattice@^1.2.0`
   - Add `@autumnsgrove/grove-markdown`, `@autumnsgrove/prism` as deps
   - Keep `@sveltejs/adapter-cloudflare` (it supports Workers mode now)
3. Update `vite.config.js`: change `ssr.noExternal` from `groveengine` to `["@autumnsgrove/lattice", "@autumnsgrove/grove-markdown", "@autumnsgrove/prism", "@autumnsgrove/grove-errors", "@autumnsgrove/infra", "@autumnsgrove/curios"]`
4. Run `pnpm install`

## Phase 1: Infrastructure — Pages → Workers

**Goal:** Switch to Workers deployment with service bindings.

1. **Rewrite `wrangler.toml`** for Workers mode:
   - `main = ".svelte-kit/cloudflare/_worker.js"`
   - Routes: `autumnsgrove.com/*`, `www.autumnsgrove.com/*`
   - D1 bindings: `GROVE_DB` (grove-engine-db, shared) + `LOCAL_DB` (autumnsgrove-local, new)
   - R2: `MEDIA` (grove-media bucket)
   - KV: `CACHE_KV`
   - Service binding: `GROVEAUTH` → groveauth-api
   - Env var: `TENANT_ID` (Autumn's tenant ID in the Grove)
2. **Update `src/app.d.ts`** — new Platform.env types matching the bindings above
3. **Delete `workers/redirect/`** — no longer needed
4. **Create `src/.dev.vars`** for local dev secrets
5. **Create local D1:** `wrangler d1 create autumnsgrove-local`

## Phase 2: Import Migration (groveengine → lattice)

**Goal:** Replace all ~37 `@autumnsgrove/groveengine` imports.

The central barrel is `src/lib/components/index.js` — update it first, then sweep all direct imports.

**Import mapping:**
| Old path | New path |
|---|---|
| `groveengine/ui` | `lattice/ui` (or specific subpaths like `lattice/ui/components/ui`, `lattice/ui/chrome`) |
| `groveengine/utils` | `lattice/utils` |
| `groveengine/ui/styles/tokens.css` | `lattice/styles/tokens.css` |
| `groveengine/ui/styles/content.css` | `lattice/ui/styles/*` |
| `groveengine/ui/charts` | `lattice/ui/charts` |
| `groveengine` (barrel: gutter, TOC, gallery, editor) | Split: `lattice/ui/components/content` + `lattice/ui/gallery` + `lattice/content/editor` |

**Files to update:** All files under `src/routes/`, `src/hooks.server.js`, `src/lib/components/`, `src/lib/content/`. Build after to catch any API mismatches.

## Phase 3: Database Layer

**Goal:** Shared grove-engine-db for blog posts, local D1 for everything else.

1. **Create `migrations/0001_local_schema.sql`** with tables:
   - `pages` (slug PK, title, body, html_content, meta_description, visible, display_order, page_type ['db-content'|'component'], gutter_content, font)
   - `site_settings` (key PK, value) — seeded with font_family, site_title, site_description
   - `portfolio_items` (id, title, description, url, image, tech_stack JSON, display_order, visible)
   - Seed `pages` with component-type entries (home, blog, gallery, timeline, about, portfolio) for nav generation

2. **Create `src/lib/server/db.ts`** — centralized DB access layer:
   - `getPublishedPosts(platform)` — GROVE_DB with tenant_id filter
   - `getPostBySlug(platform, slug)` — GROVE_DB with tenant_id filter
   - `createPost(platform, post)` / `updatePost()` / `deletePost()` — GROVE_DB with tenant_id
   - `getVisiblePages(platform)` — LOCAL_DB
   - `getSiteSettings(platform)` — LOCAL_DB
   - `getVisiblePortfolio(platform)` — LOCAL_DB

3. **Update all route data loaders** to use the centralized DB module:
   - Blog routes (`/blog`, `/blog/[slug]`, `/blog/search`): query GROVE_DB with tenant_id
   - Layout server: load nav + settings from LOCAL_DB
   - Admin blog routes: query GROVE_DB with tenant_id
   - Admin pages/settings routes: query LOCAL_DB
   - **Critical pattern:** Every GROVE_DB query adds `WHERE tenant_id = ?`

4. **Simplify `src/lib/content/markdown.js`** — remove filesystem/import.meta.glob fallback, keep only utility functions (extractHeaders, processAnchorTags, marked config)

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

Start with **Phase 0 + Phase 2** (restore config + import migration) to get the project building. Then **Phase 1** (infrastructure) and **Phase 3** (database) together since they're coupled. **Phase 4-6** can proceed incrementally. **Phase 7** is cleanup at the end.
