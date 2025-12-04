# GroveEngine NPM Package Migration Guide

**Status:** 🚧 On Hold - Waiting for package architecture improvements

## Background

The goal was to migrate AutumnsGrove from using local duplicate code to the published `@autumnsgrove/groveengine` NPM package (https://www.npmjs.com/package/@autumnsgrove/groveengine).

## Current Situation

### What We Discovered

1. **Package is installed:** `@autumnsgrove/groveengine@0.1.1` is in node_modules
2. **Architecture issue:** The package was refactored to use a new API pattern with `createContentLoader(config)` that requires the consuming app to provide `import.meta.glob()` results
3. **Component resolution issue:** Svelte components from the package aren't resolving properly in Vite/Rollup builds

### Why We Paused

The migration uncovered that GroveEngine needs architectural improvements:
- **New API pattern:** Utilities now use `createContentLoader()` instead of direct exports like `getAllPosts()`
- **Component exports:** Svelte components can't be imported from the package due to Vite/Rollup resolution issues
- **Timing:** UI components are being split into a separate `@groveengine/ui` package, so waiting is better

## Code Duplication Identified

The following files in AutumnsGrove are 100% duplicated in GroveEngine:

### Utilities (10 files to eventually delete)
- `src/lib/utils/markdown.js` (26.7 KB) - Core content processing
- `src/lib/utils/gutter.js` (5.2 KB) - Sidebar positioning
- `src/lib/utils/sanitize.js` - HTML/SVG/Markdown sanitization
- `src/lib/utils/gallery.js` - Image parsing and filtering
- `src/lib/utils/validation.js` - Security validation
- `src/lib/utils/csrf.js` - CSRF token management
- `src/lib/utils/api.js` - Fetch wrapper with CSRF
- `src/lib/utils/debounce.js` - Debounce utility
- `src/lib/utils/json.js` - JSON parsing
- `src/lib/utils/cn.ts` - Tailwind class merging

### Components (12 files to eventually delete)
**Custom Components:**
- `src/lib/components/custom/ContentWithGutter.svelte`
- `src/lib/components/custom/LeftGutter.svelte`
- `src/lib/components/custom/GutterItem.svelte`
- `src/lib/components/custom/TableOfContents.svelte`
- `src/lib/components/custom/MobileTOC.svelte`
- `src/lib/components/custom/CollapsibleSection.svelte`

**Admin Components:**
- `src/lib/components/admin/MarkdownEditor.svelte`
- `src/lib/components/admin/GutterManager.svelte`

**Gallery Components:**
- `src/lib/components/gallery/ImageGallery.svelte`
- `src/lib/components/gallery/Lightbox.svelte`
- `src/lib/components/gallery/LightboxCaption.svelte`
- `src/lib/components/gallery/ZoomableImage.svelte`

### Auth & Server (3 files to eventually delete)
- `src/lib/auth/jwt.js`
- `src/lib/auth/session.js`
- `src/lib/server/logger.js`

### Files to Keep (Site-Specific)
- `src/lib/utils/github.js` - Site-specific GitHub integration
- `src/lib/components/ui/*` - Site-specific shadcn-ui customizations
- `src/lib/components/custom/IconLegend.svelte` - Site-specific recipe component

## Migration Plan (For Future)

### Prerequisites (Before Migrating)

1. **GroveEngine Package Improvements:**
   - ✅ Fix `import.meta.glob()` issue (DONE in v0.1.1)
   - ⏳ Fix Svelte component exports for proper Vite resolution
   - ⏳ Decide on API pattern (direct exports vs createContentLoader)
   - ⏳ Complete UI package split (`@groveengine/ui`)

2. **AutumnsGrove Testing:**
   - ✅ Verify dev server runs: `npm run dev`
   - ✅ Verify build succeeds: `npm run build`
   - ✅ Test critical routes work

### Step-by-Step Migration (When Ready)

#### Option A: Direct Import Migration (If API Restored)

If GroveEngine returns to direct exports like `getAllPosts()`:

1. **Create branches:**
   ```bash
   git checkout -b backup/pre-groveengine-migration
   git checkout -b feature/migrate-to-groveengine-npm
   ```

2. **Update utility imports** (11 files):
   ```javascript
   // OLD:
   import { getAllPosts } from '$lib/utils/markdown';

   // NEW:
   import { getAllPosts } from '@autumnsgrove/groveengine/utils/markdown';
   ```

   Files to update:
   - src/routes/+page.server.js
   - src/routes/blog/+page.server.js
   - src/routes/blog/[slug]/+page.server.js
   - src/routes/blog/search/+page.server.js
   - src/routes/recipes/+page.server.js
   - src/routes/recipes/[slug]/+page.server.js
   - src/routes/about/+page.server.js
   - src/routes/contact/+page.server.js
   - src/routes/api/feed/+server.js
   - src/routes/api/posts/+server.js
   - src/routes/api/posts/[slug]/+server.js

3. **Update component imports** (7 files):
   ```javascript
   // OLD:
   import ContentWithGutter from '$lib/components/custom/ContentWithGutter.svelte';

   // NEW:
   import ContentWithGutter from '@autumnsgrove/groveengine/components/custom/ContentWithGutter.svelte';
   ```

4. **Test build:**
   ```bash
   npm run build
   ```

5. **Delete duplicates** (only after build succeeds):
   ```bash
   rm -f src/lib/utils/markdown.js
   rm -f src/lib/utils/gutter.js
   rm -f src/lib/utils/sanitize.js
   rm -f src/lib/utils/gallery.js
   rm -f src/lib/utils/validation.js
   rm -f src/lib/utils/csrf.js
   rm -f src/lib/utils/api.js
   rm -f src/lib/utils/debounce.js
   rm -f src/lib/utils/json.js
   rm -f src/lib/utils/cn.ts
   rm -rf src/lib/components/custom/
   rm -rf src/lib/components/admin/
   rm -rf src/lib/components/gallery/
   rm -rf src/lib/auth/
   rm -f src/lib/server/logger.js
   ```

6. **Commit:**
   ```bash
   git add -A
   git commit -m "feat: Migrate to @autumnsgrove/groveengine NPM package

   - Update all imports from local $lib to @autumnsgrove/groveengine
   - Delete ~25 duplicate utility and component files
   - Reduce codebase by ~1000+ lines of duplicate code
   - Keep local UI components and site-specific utilities

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

#### Option B: Wrapper Pattern (If createContentLoader API Kept)

If GroveEngine keeps the `createContentLoader()` pattern:

1. **Create `src/lib/content-loader.js` wrapper:**
   ```javascript
   import { createContentLoader } from '@autumnsgrove/groveengine/utils/markdown';

   // Provide glob results
   const posts = import.meta.glob('/UserContent/Posts/*.md', { eager: true, as: 'raw' });
   const recipes = import.meta.glob('/UserContent/Recipes/*.md', { eager: true, as: 'raw' });
   // ... more globs

   const loader = createContentLoader({
     posts,
     recipes,
     // ... config
   });

   export const { getAllPosts, getPostBySlug, /* ... */ } = loader;
   ```

2. **Update imports to use wrapper:**
   ```javascript
   import { getAllPosts } from '$lib/content-loader';
   ```

3. **Follow steps 4-6 from Option A**

## Issues Encountered (Reference)

### Issue 1: import.meta.glob in Package
- **Error:** `TypeError: (intermediate value).glob is not a function`
- **Cause:** `import.meta.glob()` was in distributed package code
- **Fix:** GroveEngine v0.1.1 refactored to use `createContentLoader()`

### Issue 2: Component Resolution
- **Error:** `Rollup failed to resolve import "@autumnsgrove/groveengine/components/custom/ContentWithGutter.svelte"`
- **Cause:** Vite/Rollup can't resolve Svelte components from package
- **Status:** Unresolved - needs package.json export configuration fix

### Issue 3: API Pattern Change
- **Change:** v0.1.0 had direct exports, v0.1.1 uses `createContentLoader()`
- **Impact:** Required wrapper pattern instead of direct import
- **Status:** Architectural decision needed

## Testing Checklist

When migration resumes, test these routes:

- [ ] Home page (`/`)
- [ ] Blog listing (`/blog`)
- [ ] Individual blog post (`/blog/[slug]`)
- [ ] Blog search (`/blog/search`)
- [ ] Recipe listing (`/recipes`)
- [ ] Individual recipe (`/recipes/[slug]`)
- [ ] About page (`/about`)
- [ ] Contact page (`/contact`)
- [ ] Gallery (`/gallery`)
- [ ] Admin dashboard (`/admin`)
- [ ] Admin: New post (`/admin/blog/new`)
- [ ] Admin: Edit post (`/admin/blog/edit/[slug]`)
- [ ] API: GET `/api/posts`
- [ ] API: GET `/api/posts/[slug]`
- [ ] API: GET `/api/feed` (RSS)

## Expected Benefits (Post-Migration)

- ✅ Zero code duplication with GroveEngine repository
- ✅ ~1000+ lines of code removed from AutumnsGrove
- ✅ Centralized maintenance of engine features
- ✅ Easier updates to engine functionality
- ✅ Cleaner project structure

## Next Steps

1. **Wait for GroveEngine improvements:**
   - Component export fix
   - UI package split completion
   - API pattern decision

2. **When ready, follow migration plan** (Option A or B)

3. **Test thoroughly** using checklist above

4. **Delete this guide** after successful migration

---

*Last updated: 2025-12-03*
*Package version: @autumnsgrove/groveengine@0.1.1*
