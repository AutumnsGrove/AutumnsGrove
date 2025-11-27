# Admin Panel Improvements - Implementation Plan

## Overview
This plan addresses styling issues, adds admin access indicators, and improves the images gallery with proper sorting options.

---

## Task 1: Fix Sidebar Footer Extension

**Problem:** The admin sidebar has `height: 100vh` which extends into the footer area on scrollable pages.

**Solution:** Adjust sidebar height to respect footer space.

**File:** `src/routes/admin/+layout.svelte`

**Changes:**
```css
/* Current (line ~182): */
.sidebar {
  height: 100vh;  /* Extends past footer */
}

/* New: */
.sidebar {
  height: calc(100vh - 60px);  /* Account for footer height */
  max-height: 100vh;
}
```

**Alternative approach if footer height varies:**
```css
.sidebar {
  top: 0;
  bottom: 0;
  height: auto;
}
```

**Testing:** Verify sidebar doesn't overlap footer on scrollable admin pages.

---

## Task 2: Standardize Border Radius with CSS Variables

**Problem:** Inconsistent border-radius values across admin components (0px, 4px, 6px, 8px).

**Solution:** Create CSS variable `--border-radius-standard` and apply consistently.

**File:** `src/routes/+layout.svelte` (global CSS variables section)

**Changes:**

1. Add to `:root` variables (around line 342):
```css
:global(:root) {
  /* Existing variables... */

  /* Border radius standardization */
  --border-radius-standard: 8px;
  --border-radius-small: 4px;
  --border-radius-button: 6px;
}
```

2. Update admin layout sidebar navigation items (`src/routes/admin/+layout.svelte`, line ~226):
```css
.nav-item {
  /* existing styles... */
  border-radius: var(--border-radius-button);
}
```

3. Update all admin page components to use variables:
   - **Dashboard** (`src/routes/admin/+page.svelte`): stat-card, action-card
   - **Blog** (`src/routes/admin/blog/+page.svelte`): table containers
   - **Settings** (`src/routes/admin/settings/+page.svelte`): section containers
   - **Images** (`src/routes/admin/images/+page.svelte`): upload zone, gallery items, buttons

**Pattern to apply:**
```css
/* Replace hardcoded values: */
border-radius: 8px;  /* OLD */

/* With: */
border-radius: var(--border-radius-standard);  /* NEW */
```

**Files to update:**
- `src/routes/admin/+page.svelte` (stat-card, action-card)
- `src/routes/admin/+layout.svelte` (nav-item)
- `src/routes/admin/blog/+page.svelte` (containers)
- `src/routes/admin/images/+page.svelte` (multiple elements)
- `src/routes/admin/settings/+page.svelte` (sections)

---

## Task 3: Add Admin Indicators to /blog Route

**Problem:** Settings cog and checkmark only visible in footer, not accessible from /blog route.

**Solution:** Add conditional rendering of admin indicators to blog page when user is authenticated.

**File:** `src/routes/blog/+page.svelte`

**Changes:**

1. Add to page load function in `src/routes/blog/+page.server.js`:
```javascript
export async function load({ locals }) {
  const posts = getAllPosts();

  return {
    posts,
    user: locals.user || null,  // Pass user authentication status
  };
}
```

2. Add admin indicators to blog page template (`src/routes/blog/+page.svelte`):
```svelte
<script>
  let { data } = $props();
  const { posts, user } = data;
</script>

<!-- Add near the top of the page, after the Blog heading -->
{#if user}
  <div class="admin-actions">
    <span class="logged-in-indicator" title="Logged in as {user.email}">
      <!-- Checkmark SVG from main layout -->
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <a href="/admin" class="admin-link" aria-label="Admin Panel">
      <!-- Settings cog SVG from main layout -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </a>
  </div>
{/if}
```

3. Add CSS styling (reuse from main layout):
```css
<style>
  .admin-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .logged-in-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #28a745;
    padding: 0.25rem;
  }

  :global(.dark) .logged-in-indicator {
    color: #5cb85f;
  }

  .admin-link {
    color: #666;
    text-decoration: none;
    border-radius: 4px;
    padding: 0.25rem;
    display: flex;
    align-items: center;
  }

  .admin-link:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  :global(.dark) .admin-link {
    color: #999;
  }

  :global(.dark) .admin-link:hover {
    background: rgba(255, 255, 255, 0.05);
  }
</style>
```

**Testing:** Visit /blog while logged in, verify checkmark and cog appear. Click cog to navigate to admin panel.

---

## Task 4: Improve Images Gallery Sorting

**Problem:** Images appear in arbitrary order from R2, no sorting options available.

**Solution:** Add server-side sorting in the API endpoint and client-side sort controls.

### Part A: Add Sorting to API Endpoint

**File:** `src/routes/api/images/list/+server.js`

**Changes:**
```javascript
export async function GET({ url, platform }) {
  try {
    const prefix = url.searchParams.get("prefix") || "";
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const sortBy = url.searchParams.get("sortBy") || "date-desc";  // NEW

    const listResult = await platform.env.IMAGES.list({
      prefix: prefix,
      cursor: cursor,
      limit: Math.min(limit, 100),
    });

    const images = listResult.objects.map((obj) => ({
      key: obj.key,
      url: `https://cdn.autumnsgrove.com/${obj.key}`,
      size: obj.size,
      uploaded: obj.uploaded,
    }));

    // NEW: Apply sorting
    switch (sortBy) {
      case "date-desc":
        images.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
        break;
      case "date-asc":
        images.sort((a, b) => new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime());
        break;
      case "name-asc":
        images.sort((a, b) => a.key.localeCompare(b.key));
        break;
      case "name-desc":
        images.sort((a, b) => b.key.localeCompare(a.key));
        break;
      case "size-desc":
        images.sort((a, b) => b.size - a.size);
        break;
      case "size-asc":
        images.sort((a, b) => a.size - b.size);
        break;
    }

    return json({
      success: true,
      images: images,
      cursor: listResult.cursor || null,
      truncated: listResult.truncated,
    });
  } catch (error) {
    console.error("Error listing images:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### Part B: Add Sort Controls to Admin Page

**File:** `src/routes/admin/images/+page.svelte`

**Changes:**

1. Add sort state (around line 16):
```javascript
let gallerySortBy = $state('date-desc');  // Default: newest first
```

2. Update `loadGallery()` function to include sortBy parameter (around line 40):
```javascript
async function loadGallery(append = false) {
  galleryLoading = true;
  galleryError = null;

  try {
    const params = new URLSearchParams();
    if (galleryFilter) params.set('prefix', galleryFilter);
    if (append && galleryCursor) params.set('cursor', galleryCursor);
    params.set('limit', '30');
    params.set('sortBy', gallerySortBy);  // NEW

    // ... rest of function
  }
}
```

3. Update `filterGallery()` to trigger on sort change:
```javascript
function filterGallery() {
  galleryCursor = null;
  loadGallery();
}

function changeSortOrder() {
  galleryCursor = null;
  loadGallery();
}
```

4. Add sort dropdown UI (before the filter input, around line 420):
```svelte
<div class="gallery-controls">
  <div class="control-group">
    <label for="sortBy">Sort by:</label>
    <select id="sortBy" bind:value={gallerySortBy} onchange={changeSortOrder}>
      <option value="date-desc">Newest First</option>
      <option value="date-asc">Oldest First</option>
      <option value="name-asc">Name (A-Z)</option>
      <option value="name-desc">Name (Z-A)</option>
      <option value="size-desc">Largest First</option>
      <option value="size-asc">Smallest First</option>
    </select>
  </div>

  <div class="control-group">
    <label for="filterInput">Filter by folder:</label>
    <input
      id="filterInput"
      type="text"
      bind:value={galleryFilter}
      placeholder="e.g., blog/"
    />
    <button onclick={filterGallery}>Filter</button>
  </div>
</div>
```

5. Add CSS for controls (around line 750):
```css
.gallery-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.control-group label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.control-group select,
.control-group input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-small);
  background: var(--mobile-menu-bg);
  color: var(--color-text);
}

.control-group button {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-button);
}
```

**Testing:**
1. Verify default sort shows newest images first
2. Change sort options and verify images reorder correctly
3. Test filter still works with different sort orders
4. Verify pagination maintains sort order

---

## Files to Modify Summary

1. **`src/routes/admin/+layout.svelte`**
   - Fix sidebar height
   - Add border-radius to nav items

2. **`src/routes/+layout.svelte`**
   - Add CSS variables for border-radius

3. **`src/routes/admin/+page.svelte`**
   - Update stat-card and action-card border-radius

4. **`src/routes/admin/blog/+page.svelte`**
   - Update container border-radius

5. **`src/routes/admin/settings/+page.svelte`**
   - Update section border-radius

6. **`src/routes/admin/images/+page.svelte`**
   - Update multiple element border-radius
   - Add sort state and controls
   - Update loadGallery function

7. **`src/routes/api/images/list/+server.js`**
   - Add sorting logic

8. **`src/routes/blog/+page.server.js`**
   - Pass user authentication status

9. **`src/routes/blog/+page.svelte`**
   - Add admin indicators (checkmark/cog)

---

## Testing Checklist

- [ ] Sidebar doesn't extend into footer on scrollable pages
- [ ] All admin components have consistent rounded corners
- [ ] CSS variables can be easily adjusted globally
- [ ] Admin indicators appear on /blog route when logged in
- [ ] Clicking cog navigates to admin panel
- [ ] Images sort correctly by all 6 options
- [ ] Filter works with all sort orders
- [ ] Pagination maintains sort order
- [ ] Mobile responsive behavior maintained

---

## Notes

- Border-radius standardization uses CSS variables for easy future adjustments
- Images default to newest-first sorting (matches public gallery behavior)
- Admin indicators on /blog route only show when authenticated (security)
- Sort options cover all requested cases: date, alphabetical, size (both directions)
