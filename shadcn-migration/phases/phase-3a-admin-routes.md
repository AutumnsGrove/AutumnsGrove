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
6. `/admin/blog/new/+page.svelte` - Post editor, forms, metadata panel
7. `/admin/blog/edit/[slug]/+page.svelte` - Post editor, forms, metadata panel, delete confirm
8. `/admin/recipes/+page.svelte` - Table, badges
9. `/admin/analytics/+page.svelte` - Cards, stats
10. `/admin/logs/+page.svelte` - Tabs, log viewer
11. `/admin/timeline/+page.svelte` - Forms, selects

## Components to Migrate

These admin components have their own UI elements that need migration:

1. `$lib/components/admin/MarkdownEditor.svelte` - **Complex** (see dedicated section below)
2. `$lib/components/admin/GutterManager.svelte` - Modals, forms, buttons, image picker

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
- [ ] Post editor (new/edit) works correctly
- [ ] MarkdownEditor still functional with all features
- [ ] GutterManager modals work correctly

---

## Post Editor Routes Migration

### /admin/blog/new/+page.svelte & /admin/blog/edit/[slug]/+page.svelte

These routes share similar structure. They use:
- **MarkdownEditor** component (complex - handle separately)
- **GutterManager** component (modals, forms)
- Metadata panel (forms, inputs, selects)
- Action buttons (Save, Delete, View Live)
- Error/success banners
- Tag preview badges

**Changes:**

1. Replace all buttons with `<Button>` wrapper:
   ```svelte
   <!-- BEFORE -->
   <button class="save-btn" onclick={handleSave} disabled={saving}>
     {saving ? "Saving..." : "Save Post"}
   </button>

   <!-- AFTER -->
   <Button variant="primary" loading={saving} onclick={handleSave}>
     Save Post
   </Button>
   ```

2. Replace form inputs with `<Input>` wrapper:
   ```svelte
   <!-- BEFORE -->
   <div class="form-group">
     <label for="title">Title</label>
     <input type="text" id="title" bind:value={title} class="form-input" />
   </div>

   <!-- AFTER -->
   <Input label="Title" bind:value={title} />
   ```

3. Replace error/success banners with toast notifications:
   ```svelte
   <!-- BEFORE -->
   {#if error}
     <div class="error-banner">...</div>
   {/if}

   <!-- AFTER -->
   // In handleSave catch block:
   toast.error(err.message);
   // Remove error banner entirely
   ```

4. Replace tag previews with `<Badge>` wrapper:
   ```svelte
   <!-- BEFORE -->
   <span class="tag-preview">{tag}</span>

   <!-- AFTER -->
   <Badge variant="tag">{tag}</Badge>
   ```

5. Replace delete confirmation (edit page) with `<Dialog>`:
   ```svelte
   <!-- BEFORE -->
   if (!confirm(`Are you sure...`)) return;

   <!-- AFTER -->
   let showDeleteDialog = $state(false);

   <Dialog
     bind:open={showDeleteDialog}
     title="Delete Post"
     description={`Are you sure you want to delete "${title}"? This cannot be undone.`}
   >
     <div class="flex gap-2 justify-end mt-4">
       <Button variant="secondary" onclick={() => showDeleteDialog = false}>Cancel</Button>
       <Button variant="danger" loading={saving} onclick={confirmDelete}>Delete</Button>
     </div>
   </Dialog>
   ```

6. **Keep these as-is** (custom layout):
   - `.editor-layout` grid structure
   - `.metadata-panel` positioning
   - `.editor-with-gutter` flex layout
   - `.gutter-section` sizing
   - The toggle gutter button styling (matches MarkdownEditor theme)

---

## MarkdownEditor Component Migration

> ⚠️ **SACRED COMPONENT** - This is a complex, feature-rich editor with custom theming.
> Migrate carefully to preserve functionality.

### What to Migrate

The MarkdownEditor has these UI elements that could use shadcn:

1. **Toolbar buttons** - Currently custom styled terminal-style buttons
2. **Slash menu** - Custom popup menu for / commands
3. **Command palette** - Modal for Cmd+K commands
4. **Snippets modal** - Form modal for managing snippets
5. **Sound panel** - Settings panel for ambient sounds
6. **Full preview modal** - Full-screen preview dialog
7. **Draft restore prompt** - Toast-like notification
8. **Upload status** - Progress/error indicator

### What to KEEP (Sacred)

- **Theme system** - The 6 themes (grove, amber, matrix, dracula, nord, rose) with CSS variables
- **Terminal aesthetic** - The `[command]` style buttons with keyboard shortcuts
- **Zen mode** - Full-screen focus mode
- **Campfire session** - Writing sprint feature
- **Line numbers** - Custom line number display
- **Mermaid rendering** - Diagram support
- **Typewriter mode** - Cursor centering

### Migration Strategy

**Option A: Minimal Migration (Recommended)**
Keep the MarkdownEditor's unique terminal aesthetic. Only migrate:
- Snippets modal → `<Dialog>` wrapper
- Command palette → `<Dialog>` wrapper (or keep custom for keyboard nav)
- Draft restore prompt → `toast()` notification
- Upload errors → `toast.error()`

**Option B: Full Migration (More Work)**
Replace all custom buttons with Button wrapper + custom styling to match terminal theme.
This is more work and risks breaking the cohesive terminal aesthetic.

### Recommended Minimal Changes

```svelte
<!-- 1. Draft restore: Use toast instead of custom banner -->
// BEFORE: Custom draft-prompt div
// AFTER:
if (storedDraft) {
  toast.info(`Draft found from ${draftTime}`, {
    action: {
      label: 'Restore',
      onClick: () => restoreDraft()
    },
    duration: 10000
  });
}

<!-- 2. Upload errors: Use toast -->
// BEFORE: uploadError state + custom error display
// AFTER:
toast.error(`Upload failed: ${error.message}`);

<!-- 3. Snippets modal: Use Dialog wrapper (optional) -->
// The custom styling matches the editor theme, so may want to keep as-is
```

### Keep Terminal Button Style

The MarkdownEditor toolbar has a distinctive terminal style:
```
[h1] [h2] [h3] | [bold] [italic] [code] | [link] [img] [block]
```

This aesthetic is intentional and should be **preserved**. Don't replace with standard shadcn buttons.

---

## GutterManager Component Migration

This component manages gutter items (comments, photos, galleries) with modals.

**Changes:**

1. Replace modals with `<Dialog>` wrapper:
   ```svelte
   <!-- BEFORE -->
   {#if showAddModal}
     <div class="modal-overlay">
       <div class="modal-content">...</div>
     </div>
   {/if}

   <!-- AFTER -->
   <Dialog bind:open={showAddModal} title="Add Gutter Item">
     ...form content...
   </Dialog>
   ```

2. Replace form inputs with `<Input>` and `<Select>`:
   ```svelte
   <!-- BEFORE -->
   <select bind:value={itemType} class="form-input">...</select>

   <!-- AFTER -->
   <Select
     label="Type"
     bind:value={itemType}
     options={[
       { value: "comment", label: "Comment (Markdown)" },
       { value: "photo", label: "Photo" },
       { value: "gallery", label: "Image Gallery" }
     ]}
   />
   ```

3. Replace buttons with `<Button>` wrapper:
   ```svelte
   <!-- BEFORE -->
   <button class="add-btn">+ Add Item</button>
   <button class="save-btn">Save</button>
   <button class="cancel-btn">Cancel</button>

   <!-- AFTER -->
   <Button variant="primary" size="sm">+ Add Item</Button>
   <Button variant="primary">Save</Button>
   <Button variant="secondary">Cancel</Button>
   ```

4. Replace delete confirmation with dialog or `toast.promise()`:
   ```svelte
   // BEFORE
   if (confirm("Delete this gutter item?")) { ... }

   // AFTER - Option 1: Dialog
   let deleteIndex = $state(null);
   <Dialog bind:open={deleteIndex !== null} title="Delete Item?">
     <Button variant="danger" onclick={() => confirmDelete(deleteIndex)}>Delete</Button>
   </Dialog>

   // AFTER - Option 2: Keep confirm() for simplicity (acceptable)
   ```

5. Replace image picker modal with `<Dialog>`:
   ```svelte
   <Dialog bind:open={showImagePicker} title="Select Image from CDN" class="max-w-2xl">
     ...image grid...
   </Dialog>
   ```

6. **Keep terminal-style colors** to match MarkdownEditor:
   - The grove green accents (`#8bc48b`, `#2d4a2d`)
   - Dark backgrounds (`#1e1e1e`, `#252526`)
   - These match the editor, so consider using Tailwind classes that reference the same CSS variables

---

## Testing: Post Editor Checklist

After migrating the post editor routes and components:

- [ ] New post page loads correctly
- [ ] Title/slug/date/description/tags inputs work
- [ ] Slug auto-generates from title
- [ ] Tag preview shows badges
- [ ] Save button submits correctly
- [ ] Error handling shows toast
- [ ] Edit post page loads with data
- [ ] Save changes works
- [ ] Delete button shows confirmation dialog
- [ ] Delete works correctly
- [ ] "View Live" link works
- [ ] Unsaved changes warning works
- [ ] MarkdownEditor toolbar buttons work
- [ ] Markdown preview renders correctly
- [ ] Draft auto-save works
- [ ] Draft restore prompt works
- [ ] Image drag-drop upload works
- [ ] Slash commands menu works
- [ ] Command palette (Cmd+K) works
- [ ] Snippets modal works
- [ ] Ambient sounds panel works
- [ ] Full preview modal works
- [ ] Zen mode works
- [ ] Theme switching works (6 themes)
- [ ] Gutter toggle button works
- [ ] GutterManager opens/closes
- [ ] Add gutter item works
- [ ] Edit gutter item works
- [ ] Delete gutter item works
- [ ] Image picker modal works
- [ ] Gallery image management works
- [ ] Dark mode throughout
- [ ] Mobile responsive
