# AutumnsGrove Standalone Rebuild

> Drop Lattice entirely. Build a personal site with custom CSS, minimal deps, and its own identity.
> Copy only the Vines/gutter components and editor from Lattice source, reshape them in-place.

## Context

AutumnsGrove was revived as a Lattice-importing Grove tenant clone. That's wrong — importing the entire Grove UI library makes the site look and feel like a tenant, not a standalone personal site. The new direction: strip ALL Lattice package imports, build fresh with custom components (like TrentsWebsite does), and copy only the specific Lattice source code needed for Vines and the editor.

**Phases 0-3 from the old plan are done** — wrangler.toml, D1 bindings, tenant-scoped db.js module, GroveAuth integration. That infrastructure stays. Everything above it gets rebuilt.

---

## What Stays (zero Lattice imports)

- `wrangler.toml` — Workers with GROVE_DB, CURIO_DB, MEDIA, CACHE_KV, GROVEAUTH, TENANT_ID
- `src/app.d.ts` — Platform types
- `src/lib/server/db.js` — Tenant-scoped DB module (posts CRUD, pages, settings, media)
- `src/lib/auth/groveauth.ts` — OAuth2+PKCE client for Heartwood
- `src/lib/utils/cookies.ts` — getCookie helper
- `src/routes/auth/` — login, logout, callback, me endpoints
- `.dev.vars` / `.dev.vars.example` — local dev secrets

## What Gets Archived to `archives/v1-lattice/`

- All `src/routes/` except `auth/`
- All `src/lib/components/`
- `src/lib/content/`
- `src/app.css`
- `tailwind.config.js`, `tailwind.typography.config.js`, `postcss.config.js`, `components.json`

---

## Phase 1: Foundation — Inline Utilities & Strip Config

**Goal:** Zero Lattice imports. Clean build with empty shell.

### 1.1 Inline Lattice utilities into `src/lib/utils/`

Only 4 small utility modules are actually used. All are pure functions:

**`src/lib/utils/csrf.ts`** — Copy from `/Users/autumn/Documents/Projects/Lattice/libs/engine/src/lib/utils/csrf.ts`:
- `generateCSRFToken()` — literally `crypto.randomUUID()`
- `validateCSRFToken(request, sessionToken)` — checks headers with timing-safe compare
- `validateCSRF(request)` — origin-based CSRF validation
- `timingSafeEqual(a, b)` — constant-time string comparison

**`src/lib/utils/sanitize.ts`** — Simplified from Lattice's sanitize.ts:
- `sanitizeMarkdown(html)` — use `isomorphic-dompurify` (already a dep)
- `sanitizeHTML(html)` — stricter sanitization

**`src/lib/utils/validation.ts`** — Copy from Lattice's validation.ts:
- `sanitizeObject(obj)` — removes `__proto__`, `constructor`, `prototype` keys recursively (~30 lines)

### 1.2 Update `src/hooks.server.js`

Change: `import { generateCSRFToken, validateCSRFToken } from "@autumnsgrove/lattice/utils"`
To: `import { generateCSRFToken, validateCSRFToken } from "$lib/utils/csrf"`

### 1.3 Strip config

- Delete: `tailwind.config.js`, `tailwind.typography.config.js`, `postcss.config.js`, `components.json`
- Simplify `vite.config.js`: remove `ssr.noExternal`, `resolve.dedupe`, `optimizeDeps.exclude` for Lattice packages
- Simplify `svelte.config.js`: remove `prerender.entries: ['*']`

### 1.4 Update `package.json`

**Remove:** `@autumnsgrove/lattice`, `@autumnsgrove/grove-markdown`, `@autumnsgrove/prism`, `@autumnsgrove/gossamer`, `unist-util-visit`, `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`, `tailwind-variants`, `tailwind-merge`, `bits-ui`, `chart.js`, `gray-matter`

**Keep:** `marked`, `svelte-sonner`, `clsx`, `lucide-svelte` (or `@lucide/svelte`), `isomorphic-dompurify`

### 1.5 Archive and create skeleton

```bash
mkdir -p archives/v1-lattice/{routes,components,content}
# Move all routes except auth, move components, move content, move old css
```

Create minimal files so `pnpm build` passes:
- `src/app.css` — empty
- `src/routes/+layout.svelte` — `{@render children()}`
- `src/routes/+page.svelte` — `<h1>rebuilding</h1>`

**Verify:** `grep -r "@autumnsgrove/lattice" src/` returns nothing. `pnpm build` succeeds.

---

## Phase 2: Design System — Custom CSS & Core Components

**Goal:** Build the visual identity. NOT Lattice. Warm, introspective. Midnight tea shop.

### 2.1 `src/app.css` — Global styles

Follow TrentsWebsite pattern (`/Users/autumn/Documents/Projects/TrentsWebsite/src/app.css`):
- CSS custom properties with `oklch()` colors
- Light/dark themes via `[data-theme='dark']`
- Typography with modular scale using `clamp()`
- Prose styles for rendered markdown (replaces `@tailwindcss/typography`)
- Animations, reduced-motion, skip-to-content

**Color direction:** Warm ambers, deep plums, soft creams — NOT Lattice's glass/grove greens. Example:
```css
:root {
  --color-bg: oklch(0.985 0.008 75);       /* warm cream */
  --color-primary: oklch(0.450 0.120 310);  /* deep plum */
  --color-accent: oklch(0.650 0.150 55);    /* warm amber */
}
```

**Fonts:** Two new fonts via Google Fonts. NOT the same as TrentsWebsite or Lattice.

### 2.2 Theme store

`src/lib/stores/theme.ts` — Copy pattern from TrentsWebsite (`/Users/autumn/Documents/Projects/TrentsWebsite/src/lib/stores/theme.ts`). Reads/writes localStorage, syncs `data-theme` attribute.

### 2.3 Core components

**`src/lib/components/Nav.svelte`** — Follow TrentsWebsite Nav pattern. Sticky, mobile drawer, theme toggle, lucide-svelte icons.

**`src/lib/components/ThemeToggle.svelte`** — Moon/Sun icons from lucide-svelte.

**`src/lib/components/Footer.svelte`** — Cross-link to autumn.grove.place, copyright, subtle admin link.

### 2.4 Root layout

`src/routes/+layout.svelte` — Nav + main + Footer for public pages. Admin pages bypass with their own layout.
`src/routes/+layout.server.js` — Load user from locals.

**Verify:** `pnpm dev` shows styled nav/footer shell, theme toggle works.

---

## Phase 3: Public Pages

**Goal:** Four usable public pages.

### Pages

| Route | Data | Notes |
|-------|------|-------|
| `/` | `getPublishedPosts(platform)` (limit 5) | Hero, intro, recent posts |
| `/about` | `getPageBySlug(platform, 'about')` or hardcode | Personal bio |
| `/blog` | `getPublishedPosts(platform)` | Clean list: date, title, tags |
| `/blog/[slug]` | `getPostBySlug(platform, slug)` | Post detail in `.prose` (Vines added in Phase 5) |
| `/contact` | Form action | Name, email, message |

Plus `+error.svelte` and `rss.xml/+server.js`.

All data comes from `$lib/server/db.js` — already built and tenant-scoped.

**Verify:** Pages render, posts load from D1, responsive, theme works.

---

## Phase 4: API Routes

**Goal:** Endpoints for admin CRUD.

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/posts` | GET, POST | List/create posts |
| `/api/posts/[slug]` | GET, PUT, DELETE | Post CRUD |
| `/api/settings` | GET, PUT | Site settings |
| `/api/contact` | POST | Contact form |

Import from local utils (`$lib/utils/csrf`, `$lib/utils/sanitize`, `$lib/utils/validation`) instead of Lattice. Use `db.js` functions for all DB access.

**Verify:** `curl` tests against authenticated endpoints work.

---

## Phase 5: Vines System — Copy & Adapt

**Goal:** Gutter/sidebar annotations on blog posts, copied from Lattice source and reshaped.

### 5.1 Copy utility files

| Local path | Lattice source | Changes |
|-----------|---------------|---------|
| `src/lib/utils/gutter.ts` | `Lattice/libs/engine/src/lib/utils/gutter.ts` | Inline GutterItem type, fix imports |
| `src/lib/utils/schedule.ts` | `Lattice/libs/engine/src/lib/utils/schedule.ts` | None (22 lines, zero deps) |
| `src/lib/utils/headers.ts` | New | Extract headers from HTML for TOC |

### 5.2 Copy & adapt display components into `src/lib/components/vines/`

| Component | Source | Key changes |
|-----------|--------|-------------|
| `TableOfContents.svelte` | Lattice custom/ | Fix imports, restyle with own CSS vars |
| `MobileTOC.svelte` | Lattice custom/ | Fix imports, use lucide-svelte icon, remove Lantern awareness |
| `GutterItem.svelte` | Lattice custom/ | **Remove** gallery/embed/emoji types. **Keep** comment/markdown/image. Replace Lightbox with simple local version |
| `ContentWithGutter.svelte` | Lattice custom/ | **Remove** HumCard + Curio mounting. **Keep** header ID assignment, inline gutter positioning, code copy handler. Replace Tailwind with `.prose` |
| `LeftGutter.svelte` | Lattice custom/ | Fix imports, keep collision-detection positioning |
| `Lightbox.svelte` | New | Simple image lightbox using `<dialog>` |
| `types.ts` | Lattice custom/types.ts | Keep TOCHeader, DEFAULT_SCROLL_OFFSET, isValidIcon |

**Style changes across all:** Replace `var(--grove-accent-dark)` → `var(--color-primary)`. Replace `:global(.dark)` → CSS variables that auto-switch with `[data-theme]`.

### 5.3 Integrate into blog detail

Update `/blog/[slug]/+page.svelte` to wrap content with `ContentWithGutter`.

**Verify:** Posts with gutter_content render with sidebar annotations. TOC works. Mobile layout works.

---

## Phase 6: Admin Panel

**Goal:** Blog management with the editor and Vines editing.

### 6.1 Admin shell

- `src/lib/styles/admin.css` — Copy pattern from TrentsWebsite admin CSS
- `src/lib/components/admin/AdminSidebar.svelte` — Sidebar nav with lucide-svelte icons
- `src/routes/admin/+layout.svelte` — Sidebar + content area
- `src/routes/admin/+layout.server.js` — Auth guard, redirect to login

### 6.2 Admin pages

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — post count, recent posts, quick links |
| `/admin/blog` | Post list with status badges, edit/delete |
| `/admin/blog/new` | Create post with editor + gutter manager |
| `/admin/blog/[slug]` | Edit post |
| `/admin/settings` | Font, site title settings |

### 6.3 Copy & simplify editor components

**`src/lib/components/admin/MarkdownEditor.svelte`** — Simplified from Lattice (920 lines → ~300-400):
- **Keep:** Write/split/preview mode, keyboard shortcuts, word count, draft auto-save, markdown preview via `marked`
- **Remove:** PhotoPicker, Curio autocomplete, image drag-drop, FullPreviewModal, zen mode, editor themes, server draft sync
- **Replace:** Lattice UI deps (`toast`) with `svelte-sonner`; FormattingToolbar with native HTML buttons

**`src/lib/components/admin/GutterManager.svelte`** — Simplified from Lattice (1540 lines → ~600-800):
- **Replace:** Dialog/Input/Button/Select from Lattice UI with native HTML styled by admin.css
- **Replace:** `@autumnsgrove/prism/icons` with lucide-svelte
- **Remove:** Embed/oEmbed support, CDN image picker
- **Keep:** Add/edit/delete vine items, anchor selection, comment + photo types, reorder

Supporting files copied from Lattice:
- `src/lib/components/admin/gutter-manager-utils.ts`
- `src/lib/components/admin/gutter-manager.types.ts`

**Verify:** Create, edit, delete posts. Editor with preview. Gutter items appear on published posts.

---

## Phase 7: Cleanup & Polish

- Content styles (code blocks, blockquotes, tables)
- SEO meta tags per page
- Update CSP headers in hooks.server.js (remove old service URLs)
- Remove `src/worker.js` if unused
- Update AGENT.md and REBUILD-PLAN.md
- `pnpm build` clean

---

## Lattice Source Reference

| What | Path |
|------|------|
| CSRF utils | `Lattice/libs/engine/src/lib/utils/csrf.ts` |
| Sanitize utils | `Lattice/libs/engine/src/lib/utils/sanitize.ts` |
| Validation | `Lattice/libs/engine/src/lib/utils/validation.ts` |
| Gutter utils | `Lattice/libs/engine/src/lib/utils/gutter.ts` |
| Schedule utils | `Lattice/libs/engine/src/lib/utils/schedule.ts` |
| ContentWithGutter | `Lattice/libs/engine/src/lib/ui/components/custom/ContentWithGutter.svelte` |
| LeftGutter | `Lattice/libs/engine/src/lib/ui/components/custom/LeftGutter.svelte` |
| GutterItem | `Lattice/libs/engine/src/lib/ui/components/custom/GutterItem.svelte` |
| TableOfContents | `Lattice/libs/engine/src/lib/ui/components/custom/TableOfContents.svelte` |
| MobileTOC | `Lattice/libs/engine/src/lib/ui/components/custom/MobileTOC.svelte` |
| TOC types | `Lattice/libs/engine/src/lib/ui/components/custom/types.ts` |
| MarkdownEditor | `Lattice/libs/engine/src/lib/content/editor/MarkdownEditor.svelte` |
| GutterManager | `Lattice/libs/engine/src/lib/content/editor/GutterManager.svelte` |
| Gutter manager utils | `Lattice/libs/engine/src/lib/content/editor/gutter-manager-utils.ts` |
| Gutter manager types | `Lattice/libs/engine/src/lib/content/editor/gutter-manager.types.ts` |

## TrentsWebsite Reference

| What | Path |
|------|------|
| Global CSS | `TrentsWebsite/src/app.css` |
| Nav | `TrentsWebsite/src/lib/components/Nav.svelte` |
| Footer | `TrentsWebsite/src/lib/components/Footer.svelte` |
| ThemeToggle | `TrentsWebsite/src/lib/components/ThemeToggle.svelte` |
| Theme store | `TrentsWebsite/src/lib/stores/theme.ts` |
| Admin CSS | `TrentsWebsite/src/lib/styles/admin.css` |
| Admin layout | `TrentsWebsite/src/routes/admin/+layout.svelte` |
| Blog list | `TrentsWebsite/src/routes/blog/+page.svelte` |
| Root layout | `TrentsWebsite/src/routes/+layout.svelte` |
