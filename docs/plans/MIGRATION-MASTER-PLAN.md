# AutumnsGrove ← GroveEngine Migration Master Plan

**Purpose:** Complete migration guide for an orchestrating agent to execute in one session
**Target:** Replace redundant AutumnsGrove code with @autumnsgrove/groveengine imports
**Outcome:** Website runs flawlessly with shared engine code

---

## Prerequisites

Before executing this plan:
1. GroveEngine repo has all package configuration merged to main
2. GroveEngine `packages/engine` has been built (`npm run package`)
3. Either:
   - `@autumnsgrove/groveengine` is published to npm, OR
   - Using git URL dependency (see Step 1)

---

## Phase 1: Install @autumnsgrove/groveengine

### Option A: If npm package is published
```bash
cd /home/user/AutumnsGrove
npm install @autumnsgrove/groveengine
```

### Option B: If using git URL (npm auth issues workaround)
```bash
cd /home/user/AutumnsGrove
npm install github:AutumnsGrove/GroveEngine#main
```

Or add to package.json:
```json
{
  "dependencies": {
    "@autumnsgrove/groveengine": "github:AutumnsGrove/GroveEngine#main"
  }
}
```

**Note:** Git URL installs from the repo. The `exports` in package.json will resolve imports correctly.

---

## Phase 2: Import Path Mapping

### Components to Replace

| AutumnsGrove Path | New Import Path |
|-------------------|-----------------|
| `$lib/components/custom/ContentWithGutter.svelte` | `@autumnsgrove/groveengine` or `@autumnsgrove/groveengine/components/custom/ContentWithGutter.svelte` |
| `$lib/components/custom/GutterItem.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/custom/LeftGutter.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/custom/TableOfContents.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/custom/MobileTOC.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/custom/CollapsibleSection.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/admin/MarkdownEditor.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/admin/GutterManager.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/gallery/ImageGallery.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/gallery/Lightbox.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/gallery/LightboxCaption.svelte` | `@autumnsgrove/groveengine` |
| `$lib/components/gallery/ZoomableImage.svelte` | `@autumnsgrove/groveengine` |

### UI Components

| AutumnsGrove Path | New Import Path |
|-------------------|-----------------|
| `$lib/components/ui` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Button.svelte` | `@autumnsgrove/groveengine/components/ui` (use named export) |
| `$lib/components/ui/Card.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Dialog.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Input.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Select.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Tabs.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Sheet.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Skeleton.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Table.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Accordion.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Badge.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Textarea.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/Toast.svelte` | `@autumnsgrove/groveengine/components/ui` |
| `$lib/components/ui/toast` (the .ts file) | `@autumnsgrove/groveengine/components/ui` |

### Utilities

| AutumnsGrove Path | New Import Path |
|-------------------|-----------------|
| `$lib/utils/markdown.js` | `@autumnsgrove/groveengine/utils/markdown` |
| `$lib/utils/sanitize.js` | `@autumnsgrove/groveengine/utils/sanitize` |
| `$lib/utils/csrf.js` | `@autumnsgrove/groveengine/utils/csrf` |
| `$lib/utils/gutter.js` | `@autumnsgrove/groveengine/utils/gutter` |
| `$lib/utils/gallery.js` | `@autumnsgrove/groveengine/utils/gallery` |
| `$lib/utils/validation.js` | `@autumnsgrove/groveengine/utils/validation` |
| `$lib/utils/api.js` | `@autumnsgrove/groveengine/utils/api` |
| `$lib/utils/debounce.js` | `@autumnsgrove/groveengine/utils/debounce` |
| `$lib/utils/json.js` | `@autumnsgrove/groveengine/utils/json` |
| `$lib/utils/cn` | `@autumnsgrove/groveengine` (use named export `cn`) |

### Auth

| AutumnsGrove Path | New Import Path |
|-------------------|-----------------|
| `$lib/auth/jwt.js` | `@autumnsgrove/groveengine/auth/jwt` |
| `$lib/auth/session.js` | `@autumnsgrove/groveengine/auth/session` |

---

## Phase 3: Files That Need Updates

### Critical Files (hooks, layouts)

1. **`src/hooks.server.js`** - Auth & CSRF imports
   ```javascript
   // BEFORE
   import { parseSessionCookie, verifySession } from "$lib/auth/session.js";
   import { generateCSRFToken, validateCSRFToken } from "$lib/utils/csrf.js";

   // AFTER
   import { parseSessionCookie, verifySession } from "@autumnsgrove/groveengine/auth/session";
   import { generateCSRFToken, validateCSRFToken } from "@autumnsgrove/groveengine/utils/csrf";
   ```

2. **`src/routes/+layout.svelte`** - UI component imports

### Route Files to Update (by category)

#### Auth Routes (13 files)
- `src/routes/auth/logout/+server.js`
- `src/routes/auth/me/+server.js`
- `src/routes/auth/send-code/+server.js`
- `src/routes/auth/verify-code/+server.js`
- `src/routes/api/admin/logs/+server.js`
- `src/routes/api/timeline/jobs/[jobId]/+server.js`
- `src/routes/api/timeline/jobs/+server.js`
- `src/routes/api/timeline/models/+server.js`
- `src/routes/api/timeline/trigger/+server.js`
- `src/routes/api/timeline/trigger/backfill/+server.js`
- `src/routes/api/timeline/usage/+server.js`
- `src/routes/api/timeline/[date]/+server.js`

#### Blog Routes (6+ files)
- `src/routes/blog/+page.svelte`
- `src/routes/blog/+page.server.js`
- `src/routes/blog/[slug]/+page.svelte`
- `src/routes/blog/[slug]/+page.server.js`
- `src/routes/blog/search/+page.svelte`
- `src/routes/blog/search/+page.server.js`

#### Admin Routes (12+ files)
- `src/routes/admin/+layout.svelte`
- `src/routes/admin/+page.svelte`
- `src/routes/admin/analytics/+page.svelte`
- `src/routes/admin/blog/+page.svelte`
- `src/routes/admin/blog/edit/[slug]/+page.svelte`
- `src/routes/admin/blog/edit/[slug]/+page.server.js`
- `src/routes/admin/blog/new/+page.svelte`
- `src/routes/admin/images/+page.svelte`
- `src/routes/admin/logs/+page.svelte`
- `src/routes/admin/pages/+page.svelte`
- `src/routes/admin/pages/edit/[slug]/+page.svelte`
- `src/routes/admin/settings/+page.svelte`
- `src/routes/admin/recipes/+page.svelte`
- `src/routes/admin/timeline/+page.svelte`

#### API Routes (20+ files)
- `src/routes/api/feed/+server.js`
- `src/routes/api/images/*` (4 files)
- `src/routes/api/pages/[slug]/+server.js`
- `src/routes/api/posts/*` (2 files)
- `src/routes/api/admin/gallery/sync/+server.js`
- `src/routes/api/admin/settings/+server.js`
- `src/routes/api/timeline/*` (multiple files)

#### Other Routes
- `src/routes/+page.svelte`
- `src/routes/+page.server.js`
- `src/routes/about/+page.svelte`
- `src/routes/about/+page.server.js`
- `src/routes/contact/+page.server.js`
- `src/routes/gallery/+page.svelte`
- `src/routes/gallery/+page.server.js`
- `src/routes/recipes/*`
- `src/routes/showcase/+page.svelte`
- `src/routes/timeline/+page.svelte`

---

## Phase 4: Files to Keep (DO NOT MIGRATE)

### Personal Features - KEEP THESE LOCAL

These files use `$lib/utils/github.js` which is **AutumnsGrove-specific**:

```
src/routes/api/git/activity/[username]/+server.js
src/routes/api/git/commits/[username]/+server.js
src/routes/api/git/contributions/[username]/+server.js
src/routes/api/git/history/[username]/[repo]/+server.js
src/routes/api/git/repos/[username]/+server.js
src/routes/api/git/stats/[username]/+server.js
src/routes/api/git/sync/+server.js
src/routes/api/git/todos/[username]/[repo]/+server.js
src/routes/api/git/user/[username]/+server.js
src/routes/api/ai/analyze/[username]/[repo]/+server.js
```

### Personal Components - KEEP THESE LOCAL

```
src/lib/components/charts/ActivityOverview.svelte
src/lib/components/charts/LOCBar.svelte
src/lib/components/charts/RepoBreakdown.svelte
src/lib/components/charts/Sparkline.svelte
src/lib/components/custom/IconLegend.svelte
src/lib/components/custom/InternalsPostViewer.svelte
src/lib/components/custom/LogViewer.svelte
```

### Personal Utils - KEEP THIS LOCAL

```
src/lib/utils/github.js
```

### Dashboard Route - KEEP LOCAL

```
src/routes/dashboard/+page.svelte
```
This imports personal chart components - update only its UI imports, keep chart imports local.

---

## Phase 5: Delete Redundant Code

After all imports are updated and verified working, delete these directories:

### Components to Delete
```bash
rm -rf src/lib/components/admin/
rm -rf src/lib/components/gallery/
rm -rf src/lib/components/ui/

# Keep these in custom/:
# - IconLegend.svelte
# - InternalsPostViewer.svelte
# - LogViewer.svelte
# Delete the rest:
rm src/lib/components/custom/ContentWithGutter.svelte
rm src/lib/components/custom/GutterItem.svelte
rm src/lib/components/custom/LeftGutter.svelte
rm src/lib/components/custom/TableOfContents.svelte
rm src/lib/components/custom/MobileTOC.svelte
rm src/lib/components/custom/CollapsibleSection.svelte
```

### Utils to Delete
```bash
# Keep github.js!
rm src/lib/utils/api.js
rm src/lib/utils/cn.ts
rm src/lib/utils/csrf.js
rm src/lib/utils/debounce.js
rm src/lib/utils/gallery.js
rm src/lib/utils/gutter.js
rm src/lib/utils/json.js
rm src/lib/utils/markdown.js
rm src/lib/utils/sanitize.js
rm src/lib/utils/validation.js
```

### Auth to Delete
```bash
rm -rf src/lib/auth/
```

### Other Files to Delete
```bash
rm src/lib/utils.ts  # If it only re-exports cn
```

---

## Phase 6: Validation

### Build Check
```bash
npm run build
```
Must complete with no errors.

### Type Check
```bash
npm run check
```
Must complete with no type errors.

### Dev Server Test
```bash
npm run dev
```

### Manual Verification Checklist

#### Public Pages
- [ ] Homepage loads (`/`)
- [ ] About page loads (`/about`)
- [ ] Blog list loads (`/blog`)
- [ ] Blog post loads with gutter annotations (`/blog/[any-slug]`)
- [ ] Blog search works (`/blog/search`)
- [ ] Gallery loads (`/gallery`)
- [ ] Recipes list loads (`/recipes`)
- [ ] Recipe detail loads (`/recipes/[any-slug]`)
- [ ] Timeline loads (`/timeline`)
- [ ] Showcase loads (`/showcase`)
- [ ] Dashboard loads with charts (`/dashboard`)

#### Admin Panel
- [ ] Admin login works (`/auth/login`)
- [ ] Admin dashboard loads (`/admin`)
- [ ] Blog editor loads (`/admin/blog`)
- [ ] New post editor works (`/admin/blog/new`)
- [ ] Edit post works (`/admin/blog/edit/[slug]`)
- [ ] Images panel loads (`/admin/images`)
- [ ] Settings loads (`/admin/settings`)
- [ ] Pages editor works (`/admin/pages`)

#### Critical Features
- [ ] Gutter annotations render correctly
- [ ] Table of contents generates
- [ ] Mobile TOC works on small screens
- [ ] Image galleries work
- [ ] Lightbox opens and zooms
- [ ] Markdown editor functions (live preview, toolbar)
- [ ] Post saving works
- [ ] Image upload works
- [ ] Dark mode toggle works
- [ ] RSS feed works (`/api/feed`)

---

## Execution Order for Agent

1. **Clone GroveEngine** (if not already present)
   ```bash
   git clone https://github.com/AutumnsGrove/GroveEngine /tmp/GroveEngine
   ```

2. **Install dependency** (using git URL)
   ```bash
   cd /home/user/AutumnsGrove
   npm install github:AutumnsGrove/GroveEngine#main
   ```

3. **Update imports in batches:**
   - Batch 1: `hooks.server.js` (critical)
   - Batch 2: Layout files (`+layout.svelte`)
   - Batch 3: Auth routes
   - Batch 4: Admin routes
   - Batch 5: Blog routes
   - Batch 6: API routes
   - Batch 7: Other routes
   - Batch 8: Component files that import other components

4. **Run build check** after each batch

5. **Delete redundant code** only after all imports work

6. **Final validation** - run dev server and test all pages

7. **Commit and push**

---

## Rollback Plan

If migration fails:
```bash
git checkout -- .
npm install
```

This reverts all changes and reinstalls original dependencies.

---

## Notes for Orchestrating Agent

1. **Use parallel subagents** for updating multiple files simultaneously
2. **Check build after each phase** - don't proceed if errors
3. **Keep personal features intact** - never touch github.js or chart components
4. **The git URL dependency works** - no need to wait for npm publish
5. **Test incrementally** - verify each batch before proceeding

---

*Created: December 2, 2025*
*Status: Ready for Execution*
*Dependencies: GroveEngine package configuration complete*
