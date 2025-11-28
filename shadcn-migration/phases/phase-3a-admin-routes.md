# Phase 3A: Migrate Admin Routes to Wrapper Components

## Context

Foundation and wrappers are ready (Phases 1-2). Now we update routes to use the new wrapper components. Starting with admin routes because they have the most UI components and will validate our wrapper APIs.

**Goal**: Replace all custom buttons, cards, modals, forms, and toasts with our wrapper components.

---

## Routes to Migrate

1. `/admin/+layout.svelte` - Sidebar, mobile menu
2. `/admin/+page.svelte` - Dashboard cards, buttons
3. `/admin/settings/+page.svelte` - Forms, radio groups, buttons
4. `/admin/images/+page.svelte` - File upload, gallery, modal, toasts
5. `/admin/blog/+page.svelte` - Table, badges
6. `/admin/recipes/+page.svelte` - Table, badges
7. `/admin/analytics/+page.svelte` - Cards, stats
8. `/admin/logs/+page.svelte` - Tabs, log viewer
9. `/admin/timeline/+page.svelte` - Forms, selects

---

## Migration Patterns

### Standard Import Block

Every admin route should start with:

```svelte
<script>
  import { Button, Card, Input, Select, Dialog, Badge, toast } from "$lib/components/ui";
  import { Toast } from "$lib/components/ui"; // Add to layout for toast container
  // ... other imports
</script>
```

### Button Replacements

```svelte
<!-- BEFORE -->
<button class="primary-btn" on:click={handleSave} disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>

<button class="secondary-btn" on:click={handleCancel}>Cancel</button>

<button class="danger-btn" on:click={handleDelete}>Delete</button>

<!-- AFTER -->
<Button variant="primary" loading={loading} onclick={handleSave}>
  Save
</Button>

<Button variant="secondary" onclick={handleCancel}>
  Cancel
</Button>

<Button variant="danger" onclick={handleDelete}>
  Delete
</Button>
```

### Card Replacements

```svelte
<!-- BEFORE -->
<div class="stat-card">
  <h3>Total Posts</h3>
  <p class="stat-value">{stats.posts}</p>
</div>

<!-- AFTER -->
<Card title="Total Posts">
  <p class="text-3xl font-bold text-primary">{stats.posts}</p>
</Card>
```

### Form Input Replacements

```svelte
<!-- BEFORE -->
<label for="search">Search</label>
<input
  type="text"
  id="search"
  bind:value={searchQuery}
  placeholder="Search..."
  class="search-input"
/>

<!-- AFTER -->
<Input
  label="Search"
  bind:value={searchQuery}
  placeholder="Search..."
/>
```

### Select Replacements

```svelte
<!-- BEFORE -->
<select bind:value={selectedFolder} class="folder-select">
  <option value="blog">Blog</option>
  <option value="recipes">Recipes</option>
  <option value="projects">Projects</option>
</select>

<!-- AFTER -->
<Select
  label="Folder"
  bind:value={selectedFolder}
  options={[
    { value: "blog", label: "Blog" },
    { value: "recipes", label: "Recipes" },
    { value: "projects", label: "Projects" }
  ]}
/>
```

### Modal/Dialog Replacements

```svelte
<!-- BEFORE -->
{#if showDeleteModal}
  <div class="modal-overlay" on:click={closeModal} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation>
      <h2>Confirm Delete</h2>
      <p>Are you sure you want to delete this image?</p>
      <div class="modal-actions">
        <button class="secondary-btn" on:click={closeModal}>Cancel</button>
        <button class="danger-btn" on:click={confirmDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- AFTER -->
<Dialog
  bind:open={showDeleteModal}
  title="Confirm Delete"
  description="Are you sure you want to delete this image?"
>
  <div class="flex gap-2 justify-end mt-4">
    <Button variant="secondary" onclick={() => showDeleteModal = false}>
      Cancel
    </Button>
    <Button variant="danger" loading={isDeleting} onclick={confirmDelete}>
      Delete
    </Button>
  </div>
</Dialog>
```

### Toast Replacements

**Complete migration pattern** - Remove ALL custom toast infrastructure:

```svelte
<!-- ==================== BEFORE ==================== -->
<script>
  // REMOVE: Custom toast state
  let toasts = $state([]);

  // REMOVE: Custom toast function
  function showToast(message, type = 'info') {
    const id = Date.now();
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 5000);
  }

  // REMOVE: If using a store
  import { toastStore } from '$lib/stores/toast';
</script>

<!-- REMOVE: Custom toast rendering -->
{#each toasts as t}
  <div class="toast toast-{t.type}">{t.message}</div>
{/each}

<!-- ==================== AFTER ==================== -->
<script>
  // ADD: Single import
  import { toast } from "$lib/components/ui";

  // Usage - replace showToast() calls:
  // showToast("Success!", "success")  →  toast.success("Success!")
  // showToast("Error!", "error")      →  toast.error("Error!")
  // showToast("Info")                 →  toast.info("Info")

  // Examples:
  toast.success("Image uploaded successfully");
  toast.error("Failed to delete image");
  toast.info("Processing...");
  toast.warning("Are you sure?");

  // For promises (loading → success/error):
  toast.promise(uploadImage(), {
    loading: 'Uploading...',
    success: 'Upload complete!',
    error: 'Upload failed'
  });
</script>

<!-- NO toast markup needed here! -->
<!-- The Toast container in +layout.svelte handles rendering -->
```

**In `/admin/+layout.svelte`** - Add the Toast container ONCE:

```svelte
<script>
  import { Toast } from "$lib/components/ui";
</script>

<!-- At the end of the layout, add: -->
<Toast position="bottom-right" />
```

### Tab Replacements

```svelte
<!-- BEFORE -->
<div class="tabs">
  <button
    class="tab-btn"
    class:active={activeTab === 'all'}
    on:click={() => activeTab = 'all'}
  >
    All Logs
  </button>
  <button
    class="tab-btn"
    class:active={activeTab === 'errors'}
    on:click={() => activeTab = 'errors'}
  >
    Errors
  </button>
</div>

{#if activeTab === 'all'}
  <div>All logs content...</div>
{:else if activeTab === 'errors'}
  <div>Errors content...</div>
{/if}

<!-- AFTER -->
<Tabs
  bind:value={activeTab}
  tabs={[
    { value: 'all', label: 'All Logs' },
    { value: 'errors', label: 'Errors' }
  ]}
>
  {#snippet children(tab)}
    {#if tab === 'all'}
      <div>All logs content...</div>
    {:else if tab === 'errors'}
      <div>Errors content...</div>
    {/if}
  {/snippet}
</Tabs>
```

### Badge/Tag Replacements

```svelte
<!-- BEFORE -->
<span class="tag">{tag}</span>

<!-- AFTER -->
<Badge variant="tag">{tag}</Badge>
```

---

## Route-Specific Instructions

### /admin/+layout.svelte

**Changes:**
1. Add Toast container for toasts to work site-wide in admin
2. Replace hamburger button with `<Button variant="ghost" size="icon">`
3. Consider replacing mobile sidebar overlay with `<Sheet side="left">`
4. Keep the existing sidebar navigation structure (works well)
5. Remove scoped CSS for buttons

```svelte
<script>
  import { Button, Sheet, Toast } from "$lib/components/ui";
  // ... existing imports
</script>

<!-- Add Toast container at the end -->
<Toast position="bottom-right" />
```

### /admin/+page.svelte (Dashboard)

**Changes:**
1. Replace stat cards with `<Card>` wrapper
2. Replace action cards with `<Card hoverable>`
3. Replace any buttons with `<Button>` wrapper
4. Keep health status logic, just restyle indicators

### /admin/settings/+page.svelte

**Changes:**
1. Replace font selection with `RadioGroup` from shadcn
2. Replace all buttons with `<Button>` wrapper
3. Replace health cards with `<Card>` wrapper
4. Replace any alerts with styled messages or toast

### /admin/images/+page.svelte (Most Complex)

**This is the most complex admin page. Changes:**

1. Replace delete modal with `<Dialog>` wrapper
2. Replace all toasts with `toast.success()` / `toast.error()`
3. Replace folder select with `<Select>` wrapper
4. Replace sort-by select with `<Select>` wrapper
5. Replace all buttons with `<Button>` wrapper
6. Replace filter input with `<Input>` wrapper
7. Keep drag-drop zone styling (just convert to Tailwind classes)
8. Keep gallery grid structure (convert styling to Tailwind)
9. Keep image loading logic

**Critical**: Remove the entire custom toast system and modal system.

### /admin/blog/+page.svelte & /admin/recipes/+page.svelte

**Changes:**
1. Replace tags with `<Badge variant="tag">`
2. Consider using shadcn `<Table>` for post listing
3. Replace any buttons with `<Button>`
4. Keep GitHub link buttons

### /admin/analytics/+page.svelte

**Changes:**
1. Replace stat cards with `<Card>` wrapper
2. Replace buttons with `<Button>` wrapper
3. Keep chart/data loading logic

### /admin/logs/+page.svelte

**Changes:**
1. Replace tab system with `<Tabs>` wrapper
2. Keep `<LogViewer>` component as-is (it's custom)
3. Replace collapsible help section with `<Accordion>`
4. Convert tab icons to use Lucide icons consistently

### /admin/timeline/+page.svelte

**Changes:**
1. Replace date inputs with `<Input type="date">`
2. Replace model selector with `<Select>`
3. Replace buttons with `<Button>` wrapper
4. Replace result cards with `<Card>` wrapper

---

## CSS Removal Checklist

After migrating each route, remove these scoped CSS patterns:

- [ ] `.primary-btn`, `.secondary-btn`, `.danger-btn` styles
- [ ] `.modal-overlay`, `.modal-content` styles
- [ ] `.toast`, `.toast-success`, `.toast-error` styles
- [ ] `.tab-btn`, `.tabs` styles
- [ ] `.stat-card`, `.action-card` styles
- [ ] `.tag` styles (now using Badge)
- [ ] Form input custom styles

**Keep:**
- Layout-specific grid/flex positioning
- Custom animation keyframes
- Drag-drop zone specific styles (convert to Tailwind)
- Any component-specific layout needs

---

## Tailwind Class Conversions

Common inline style to Tailwind conversions:

```css
/* Spacing */
margin-top: 2rem     → mt-8
padding: 1rem 2rem   → px-8 py-4
gap: 1rem            → gap-4

/* Layout */
display: flex        → flex
flex-direction: col  → flex-col
align-items: center  → items-center
justify-content: between → justify-between

/* Colors (use semantic) */
color: var(--color-primary)      → text-primary
background: var(--color-bg-secondary) → bg-secondary
border-color: var(--color-border) → border-border

/* Typography */
font-size: 1.5rem    → text-2xl
font-weight: 600     → font-semibold

/* Effects */
border-radius: 8px   → rounded-lg
box-shadow: ...      → shadow-md
```

---

## Testing Checklist

After completing all admin routes:

- [ ] Admin dashboard loads correctly
- [ ] Can navigate between all admin pages
- [ ] Settings form saves correctly
- [ ] Font selection works
- [ ] Image upload works
- [ ] Image delete modal opens and closes
- [ ] Delete confirmation works
- [ ] Toast notifications appear and auto-dismiss
- [ ] Tabs switch correctly in logs page
- [ ] Log viewer still streams logs
- [ ] Dark mode works throughout admin
- [ ] Mobile sidebar works
- [ ] All forms submit correctly
- [ ] No console errors

---

## Success Criteria

- [ ] All admin routes use wrapper components
- [ ] No custom button/card/modal/toast CSS remains
- [ ] Admin functionality unchanged
- [ ] Forms still work correctly
- [ ] Dark mode still works
- [ ] Mobile layout still works
- [ ] Toast notifications work via sonner
