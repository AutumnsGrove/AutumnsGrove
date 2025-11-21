# Svelte 5 Improvements Plan

This document outlines planned improvements based on the Svelte 5 guide review. These changes are safe, incremental enhancements that follow Svelte 5 best practices.

---

## 1. Migrate `$app/stores` to `$app/state`

### Overview
Svelte 5 introduces `$app/state` as a runes-based alternative to `$app/stores`. The page state from `$app/state` is more ergonomic - you can access properties directly without the `$` prefix.

### Files to Update

#### `src/routes/+layout.svelte`
**Lines affected:** 2, 115-118, 153-156, 161

**Before:**
```svelte
<script>
	import { page } from '$app/stores';
	// ...
</script>

<!-- Usage in template -->
<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
<!-- ... -->
{#key $page.url.pathname}
```

**After:**
```svelte
<script>
	import { page } from '$app/state';
	// ...
</script>

<!-- Usage in template -->
<a href="/" class:active={page.url.pathname === '/'}>Home</a>
<a href="/blog" class:active={page.url.pathname.startsWith('/blog')}>Blog</a>
<!-- ... -->
{#key page.url.pathname}
```

**Changes required:**
1. Line 2: Change import from `'$app/stores'` to `'$app/state'`
2. Lines 115-118: Remove `$` prefix from `$page.url.pathname` (8 occurrences)
3. Lines 153-156: Remove `$` prefix from `$page.url.pathname` (4 occurrences)
4. Line 161: Remove `$` prefix in `{#key $page.url.pathname}`

---

#### `src/routes/+error.svelte`
**Lines affected:** 2, 6, 10-11

**Before:**
```svelte
<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} - AutumnsGrove</title>
</svelte:head>

<div class="error-page">
	<h1>{$page.status}</h1>
	<p class="message">{$page.error?.message || 'Page not found'}</p>
```

**After:**
```svelte
<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} - AutumnsGrove</title>
</svelte:head>

<div class="error-page">
	<h1>{page.status}</h1>
	<p class="message">{page.error?.message || 'Page not found'}</p>
```

**Changes required:**
1. Line 2: Change import from `'$app/stores'` to `'$app/state'`
2. Line 6: Remove `$` prefix from `$page.status`
3. Line 10: Remove `$` prefix from `$page.status`
4. Line 11: Remove `$` prefix from `$page.error`

---

## 2. Simplify Heatmap Props Pattern

### Overview
The current Heatmap component uses `const props = $props()` then derives individual props. While functional, this can be simplified using destructuring with defaults directly.

### File to Update

#### `src/routes/dashboard/Heatmap.svelte`
**Lines affected:** 2-6

**Before:**
```svelte
<script>
	const props = $props();

	// Derived props for proper Svelte 5 reactivity
	let activity = $derived(props.activity ?? []);
	let days = $derived(props.days ?? 365);
```

**After (Option A - Simpler):**
```svelte
<script>
	let { activity = [], days = 365 } = $props();
```

**After (Option B - Keep derived for computed defaults):**
```svelte
<script>
	let { activity: rawActivity = [], days = 365 } = $props();

	// Only use $derived if you need computed transformations
	let activity = $derived(rawActivity);
```

**Recommended:** Option A is cleaner unless you need to transform the props. The current `$derived` calls just provide defaults, which can be done inline.

**Changes required:**
1. Lines 2-6: Replace with destructuring pattern
2. Update references from `props.activity` to `activity` if any remain (none currently)

---

## 5. Extract Repeated Templates as Snippets

### Overview
Svelte 5 snippets allow extracting repeated template patterns for reusability within a component. Two patterns appear multiple times across the codebase.

### Pattern A: Tag Rendering

Tags are rendered identically in 5 files. Consider creating a shared snippet or moving to a component.

**Files with tag rendering:**
- `src/routes/blog/+page.svelte` (lines 33-38)
- `src/routes/recipes/+page.svelte` (lines 33-38)
- `src/routes/blog/[slug]/+page.svelte` (lines 84-89)
- `src/routes/recipes/[slug]/+page.svelte` (lines 76-81)
- `src/routes/admin/blog/+page.svelte` (lines 51-56)

**Current Pattern:**
```svelte
{#if post.tags.length > 0}
	<div class="tags">
		{#each post.tags as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
{/if}
```

**Option A: Local Snippet (per component)**
```svelte
{#snippet tagList(tags)}
	{#if tags.length > 0}
		<div class="tags">
			{#each tags as tag (tag)}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{/if}
{/snippet}

<!-- Usage -->
{@render tagList(post.tags)}
```

**Option B: Shared Component (recommended for cross-file use)**
Create `src/lib/components/TagList.svelte`:
```svelte
<script>
	let { tags = [] } = $props();
</script>

{#if tags.length > 0}
	<div class="tags">
		{#each tags as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
{/if}
```

**Recommendation:** Create a TagList component since this pattern appears in 5 different files. A snippet is better for patterns repeated within a single component.

---

### Pattern B: Date Formatting

Date formatting is duplicated across multiple files with slight variations.

**Files with inline date formatting:**
- `src/routes/blog/+page.svelte` (lines 27-31)
- `src/routes/recipes/+page.svelte` (lines 27-31)
- `src/routes/blog/[slug]/+page.svelte` (lines 78-82)
- `src/routes/recipes/[slug]/+page.svelte` (lines 70-74)

**Current Pattern:**
```svelte
{new Date(post.date).toLocaleDateString('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric'
})}
```

**Files with formatDate helper functions:**
- `src/routes/admin/blog/+page.svelte` (lines 4-9)
- `src/routes/dashboard/+page.svelte` (lines 384-390)
- `src/routes/dashboard/Heatmap.svelte` (lines 71-78)

**Recommended Solution:** Create a shared utility function.

Create `src/lib/utils/formatDate.js`:
```javascript
/**
 * Format a date string in a consistent, readable format
 * @param {string} dateString - ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
	const defaultOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
	return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format a date for short display (e.g., in tables)
 * @param {string} dateString - ISO date string
 * @returns {string} Short formatted date
 */
export function formatDateShort(dateString) {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
```

**Usage in components:**
```svelte
<script>
	import { formatDate } from '$lib/utils/formatDate';
</script>

<time datetime={post.date}>
	{formatDate(post.date)}
</time>
```

**Files to update:**
1. Create `src/lib/utils/formatDate.js`
2. Update `src/routes/blog/+page.svelte` - import and use formatDate
3. Update `src/routes/recipes/+page.svelte` - import and use formatDate
4. Update `src/routes/blog/[slug]/+page.svelte` - import and use formatDate
5. Update `src/routes/recipes/[slug]/+page.svelte` - import and use formatDate
6. Update `src/routes/admin/blog/+page.svelte` - replace local formatDate with import
7. Update `src/routes/dashboard/+page.svelte` - replace local formatDate with import

---

## 7. Add JSDoc to Complex Components

### Overview
Several components with complex props or behaviors would benefit from JSDoc documentation. This improves IDE support and developer experience.

### Files to Update

#### `src/lib/components/LeftGutter.svelte`
**Lines affected:** 5-9

**Before:**
```svelte
<script>
	import { tick } from 'svelte';
	import GutterItem from './GutterItem.svelte';

	let { items = [], headers = [] } = $props();
```

**After:**
```svelte
<script>
	import { tick } from 'svelte';
	import GutterItem from './GutterItem.svelte';

	/**
	 * LeftGutter - Displays gutter items anchored to document headers
	 *
	 * @prop {Array<{anchor: string, type: string, content: string}>} items - Gutter items to display
	 * @prop {Array<{id: string, text: string, level: number}>} headers - Document headers for positioning
	 */
	let { items = [], headers = [] } = $props();
```

---

#### `src/routes/dashboard/Heatmap.svelte`
**Lines affected:** 1-7

**Before:**
```svelte
<script>
	const props = $props();

	// Derived props for proper Svelte 5 reactivity
	let activity = $derived(props.activity ?? []);
	let days = $derived(props.days ?? 365);
```

**After:**
```svelte
<script>
	/**
	 * Heatmap - GitHub-style commit activity visualization
	 *
	 * @prop {Array<{activity_date: string, commit_count: number}>} activity - Daily commit data
	 * @prop {number} days - Number of days to display (default: 365)
	 */
	let { activity = [], days = 365 } = $props();
```

---

#### `src/lib/components/GutterItem.svelte`
(If exists and lacks documentation)

**Add JSDoc:**
```svelte
<script>
	/**
	 * GutterItem - Individual item in the left gutter
	 *
	 * @prop {Object} item - The gutter item data
	 * @prop {string} item.type - Type of item ('image', 'note', etc.)
	 * @prop {string} item.content - Item content or URL
	 * @prop {string} [item.caption] - Optional caption
	 */
	let { item } = $props();
```

---

#### `src/lib/components/TableOfContents.svelte`
**Lines affected:** 1-4

**Before:**
```svelte
<script>
	let { headers = [] } = $props();

	let activeId = $state('');
```

**After:**
```svelte
<script>
	/**
	 * TableOfContents - Sticky navigation for document headers
	 *
	 * @prop {Array<{id: string, text: string, level: number}>} headers - Headers to display in TOC
	 */
	let { headers = [] } = $props();

	let activeId = $state('');
```

---

#### `src/lib/components/MobileTOC.svelte`
**Lines affected:** 1-7

**Before:**
```svelte
<script>
	let { headers = [] } = $props();

	let isOpen = $state(false);
```

**After:**
```svelte
<script>
	/**
	 * MobileTOC - Floating table of contents button for mobile devices
	 *
	 * @prop {Array<{id: string, text: string, level: number}>} headers - Headers to display in TOC
	 */
	let { headers = [] } = $props();

	let isOpen = $state(false);
```

---

## Implementation Priority

1. **Suggestion 1** (Migrate $app/stores) - Low risk, straightforward find-and-replace
2. **Suggestion 2** (Simplify Heatmap props) - Low risk, improves code clarity
3. **Suggestion 7** (Add JSDoc) - No risk, documentation only
4. **Suggestion 5** (Extract snippets/utilities) - Medium complexity, creates new files

## Testing Checklist

After implementing each suggestion:

- [ ] Run `npm run build` to check for compilation errors
- [ ] Run `npm run check` (if available) for type checking
- [ ] Test affected pages in browser:
  - [ ] Home page navigation active states
  - [ ] Error page displays correctly
  - [ ] Dashboard heatmap renders properly
  - [ ] Blog/recipes pages display tags and dates correctly
  - [ ] Mobile TOC works on small screens
- [ ] Verify dark mode still works on all affected components
