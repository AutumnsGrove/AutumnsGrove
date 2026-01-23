# shadcn Component Quick Reference

A cheat sheet for the 12 wrapper components in AutumnsGrove's UI system.

---

## Imports

All components are exported from a single barrel file:

```svelte
<script>
import { Button, Card, Badge, Input, Dialog, Select, Tabs, Accordion, Sheet, Toast, Skeleton, Table } from "$lib/components/ui";
</script>
```

Individual imports (if needed):

```svelte
import Button from "$lib/components/ui/Button.svelte";
import Card from "$lib/components/ui/Card.svelte";
```

---

## Button

**Variants:** `default`, `ghost`, `link`

```svelte
<!-- Primary action (green, filled) -->
<Button variant="default" onclick={handleSave}>
  Save Post
</Button>

<!-- Secondary action (transparent) -->
<Button variant="ghost" onclick={handleCancel}>
  Cancel
</Button>

<!-- Link-style button -->
<Button variant="link" href="/admin">
  ← Back to Admin
</Button>

<!-- Disabled state -->
<Button disabled>
  Processing...
</Button>

<!-- With type attribute -->
<Button type="submit">
  Submit Form
</Button>
```

**Props:**
- `variant` - `"default" | "ghost" | "link"` (default: `"default"`)
- `href` - Optional link URL (renders as `<a>` instead of `<button>`)
- `onclick` - Click handler
- `disabled` - Boolean
- `type` - `"button" | "submit" | "reset"`
- `class` - Additional CSS classes

---

## Card

**Props:** `title`, `hoverable`, `onclick`, `class`

```svelte
<!-- Basic card with title -->
<Card title="User Stats">
  <p>42 commits this week</p>
  <p>1,234 lines added</p>
</Card>

<!-- Hoverable, clickable card -->
<Card
  title="Blog Post Title"
  hoverable
  onclick={() => goto('/blog/my-post')}
>
  <p class="text-sm text-muted-foreground">
    A brief description of the post...
  </p>
  <div class="flex gap-2 mt-4">
    <Badge variant="tag">TypeScript</Badge>
    <Badge variant="tag">Svelte</Badge>
  </div>
</Card>

<!-- Card without title -->
<Card class="p-6">
  <h2 class="text-xl font-bold mb-4">Custom Heading</h2>
  <p>Custom content with manual padding</p>
</Card>

<!-- Card with custom class -->
<Card title="Important" class="border-primary border-2">
  Highlighted card
</Card>
```

**Props:**
- `title` - Optional card title (renders as `<h3>` in header)
- `hoverable` - Boolean, adds hover effect (scale + shadow)
- `onclick` - Click handler (makes entire card clickable)
- `class` - Additional CSS classes

**Note:** Content goes in the default slot. No named slots for header/footer (use advanced primitives if needed).

---

## Badge

**Variants:** `tag`, `default`

```svelte
<!-- Content tags (used on blog posts, recipes) -->
<Badge variant="tag">TypeScript</Badge>
<Badge variant="tag">Svelte</Badge>
<Badge variant="tag">SvelteKit</Badge>

<!-- Status indicators -->
<Badge>Active</Badge>
<Badge>Published</Badge>
<Badge>Draft</Badge>

<!-- With custom class -->
<Badge variant="tag" class="bg-red-500">
  Deprecated
</Badge>
```

**Props:**
- `variant` - `"tag" | "default"` (default: `"default"`)
- `class` - Additional CSS classes

**Styling:**
- `tag` variant: Smaller, subtle, for content categorization
- `default` variant: Standard badge for status/labels

---

## Input

**Props:** `label`, `placeholder`, `value`, `type`, all standard input props

```svelte
<!-- Labeled text input -->
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  bind:value={email}
  required
/>

<!-- Without label -->
<Input
  placeholder="Search posts..."
  bind:value={searchQuery}
/>

<!-- Textarea-style input -->
<Input
  label="Description"
  type="textarea"
  placeholder="Write a brief summary..."
  bind:value={description}
  rows={4}
/>

<!-- Password input -->
<Input
  label="Password"
  type="password"
  bind:value={password}
  autocomplete="current-password"
/>

<!-- Number input -->
<Input
  label="Age"
  type="number"
  min={0}
  max={120}
  bind:value={age}
/>
```

**Props:**
- `label` - Optional label text (renders as `<label>`)
- `type` - Input type (`"text"`, `"email"`, `"password"`, `"number"`, `"textarea"`, etc.)
- `placeholder` - Placeholder text
- `value` - Input value (use `bind:value` for two-way binding)
- `required` - Boolean, marks field as required
- `class` - Additional CSS classes
- All standard HTML input attributes (`min`, `max`, `pattern`, `autocomplete`, etc.)

---

## Select

**Props:** `label`, `options`, `value`, `placeholder`

```svelte
<script>
let sortOrder = 'newest';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' }
];
</script>

<Select
  label="Sort By"
  bind:value={sortOrder}
  options={sortOptions}
  placeholder="Choose sorting..."
/>
```

**Advanced usage with groups:**

```svelte
<script>
const categoryOptions = [
  { value: 'tech', label: 'Technology', group: 'Topics' },
  { value: 'design', label: 'Design', group: 'Topics' },
  { value: 'published', label: 'Published', group: 'Status' },
  { value: 'draft', label: 'Draft', group: 'Status' }
];
</script>

<Select
  label="Filter By"
  bind:value={filter}
  options={categoryOptions}
/>
```

**Props:**
- `label` - Optional label text
- `options` - Array of `{ value: string, label: string, group?: string }`
- `value` - Selected value (use `bind:value` for two-way binding)
- `placeholder` - Placeholder text when nothing selected
- `class` - Additional CSS classes

---

## Tabs

**Props:** `tabs`, `value`

```svelte
<script>
let activeTab = 'app';

const tabs = [
  { value: 'app', label: 'Application' },
  { value: 'git', label: 'Git Sync' },
  { value: 'ai', label: 'AI Timeline' }
];
</script>

<Tabs bind:value={activeTab} {tabs}>
  {#if activeTab === 'app'}
    <div class="p-4">
      <h3>Application Logs</h3>
      <!-- Content for app tab -->
    </div>
  {:else if activeTab === 'git'}
    <div class="p-4">
      <h3>Git Sync Logs</h3>
      <!-- Content for git tab -->
    </div>
  {:else if activeTab === 'ai'}
    <div class="p-4">
      <h3>AI Timeline Logs</h3>
      <!-- Content for ai tab -->
    </div>
  {/if}
</Tabs>
```

**Props:**
- `tabs` - Array of `{ value: string, label: string }`
- `value` - Active tab value (use `bind:value` for two-way binding)
- `class` - Additional CSS classes

**Note:** Content goes in the default slot. You control which content to show based on `value`.

---

## Dialog

**Props:** `open`, `title`, `description`

```svelte
<script>
let showDeleteDialog = false;

function handleDelete() {
  // Delete logic
  showDeleteDialog = false;
}
</script>

<Button onclick={() => showDeleteDialog = true}>
  Delete Post
</Button>

<Dialog
  bind:open={showDeleteDialog}
  title="Delete Post"
  description="Are you sure? This action cannot be undone."
>
  <!-- Main content (optional) -->
  <p>The post will be permanently removed from the database.</p>

  <!-- Actions slot for buttons -->
  <div slot="actions" class="flex gap-2">
    <Button variant="ghost" onclick={() => showDeleteDialog = false}>
      Cancel
    </Button>
    <Button variant="default" onclick={handleDelete}>
      Delete
    </Button>
  </div>
</Dialog>
```

**Props:**
- `open` - Boolean, controls dialog visibility (use `bind:open`)
- `title` - Dialog title (rendered as heading)
- `description` - Optional description text
- `class` - Additional CSS classes

**Slots:**
- Default slot: Main content
- `actions` slot: Footer with buttons

**Behavior:**
- Clicking outside closes the dialog
- Pressing Escape closes the dialog
- Focus is trapped inside the dialog when open

---

## Accordion

**Props:** `items`

```svelte
<script>
const faqItems = [
  {
    title: 'What is AutumnsGrove?',
    content: 'A personal blog and recipe site with a terminal-grove aesthetic.'
  },
  {
    title: 'How does the AI timeline work?',
    content: 'Daily summaries are generated from GitHub commits using Claude Haiku 4.5.'
  },
  {
    title: 'Can I use the markdown editor?',
    content: 'The editor is currently for site owners only. Public access may be added later.'
  }
];
</script>

<Accordion items={faqItems} />
```

**Advanced usage with slots:**

```svelte
<Accordion>
  <div slot="item-1">
    <h4>Custom Title 1</h4>
    <p>Custom content with <strong>HTML</strong></p>
  </div>
  <div slot="item-2">
    <h4>Custom Title 2</h4>
    <p>More custom content</p>
  </div>
</Accordion>
```

**Props:**
- `items` - Array of `{ title: string, content: string }`
- `class` - Additional CSS classes

**Behavior:**
- Only one item can be expanded at a time
- Clicking an expanded item collapses it
- Smooth expand/collapse animation

---

## Sheet

**Props:** `open`, `title`, `description`

```svelte
<script>
let showFilters = false;
let keyword = '';
let category = '';
</script>

<Button onclick={() => showFilters = true}>
  Show Filters
</Button>

<Sheet
  bind:open={showFilters}
  title="Search Filters"
  description="Narrow down your search"
>
  <div class="space-y-4">
    <Input
      label="Keyword"
      placeholder="Search terms..."
      bind:value={keyword}
    />
    <Select
      label="Category"
      bind:value={category}
      options={[
        { value: 'all', label: 'All Categories' },
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design' }
      ]}
    />
    <Button onclick={() => showFilters = false}>
      Apply Filters
    </Button>
  </div>
</Sheet>
```

**Props:**
- `open` - Boolean, controls sheet visibility (use `bind:open`)
- `title` - Sheet title (rendered as heading)
- `description` - Optional description text
- `class` - Additional CSS classes

**Behavior:**
- Slides in from right side of screen
- Clicking outside closes the sheet
- Pressing Escape closes the sheet
- Overlay appears behind sheet

---

## Toast

**Usage:** Import the `toast` utility for notifications

```svelte
<script>
import { toast } from "$lib/components/ui";

function handleSave() {
  try {
    // Save logic
    toast.success("Post saved successfully!");
  } catch (error) {
    toast.error("Failed to save post");
  }
}

function handleInfo() {
  toast.info("Changes will be published after review");
}

function handleWarning() {
  toast.warning("Unsaved changes will be lost");
}
</script>

<Button onclick={handleSave}>Save</Button>
```

**API:**
- `toast.success(message)` - Green success toast
- `toast.error(message)` - Red error toast
- `toast.info(message)` - Blue info toast
- `toast.warning(message)` - Yellow warning toast

**Behavior:**
- Toasts appear in top-right corner
- Auto-dismiss after 3 seconds (configurable)
- Multiple toasts stack vertically
- Can be manually dismissed by clicking X

---

## Skeleton

**Usage:** Loading placeholders

```svelte
<script>
let loading = true;

onMount(async () => {
  const data = await fetchData();
  loading = false;
});
</script>

{#if loading}
  <div class="space-y-4">
    <!-- Title skeleton -->
    <Skeleton class="h-8 w-48 mb-4" />

    <!-- Content skeletons -->
    <Skeleton class="h-4 w-full mb-2" />
    <Skeleton class="h-4 w-full mb-2" />
    <Skeleton class="h-4 w-3/4 mb-2" />

    <!-- Card skeleton -->
    <Skeleton class="h-32 w-full rounded-lg" />
  </div>
{:else}
  <!-- Real content -->
  <h1>{data.title}</h1>
  <p>{data.content}</p>
{/if}
```

**Props:**
- `class` - CSS classes for size and shape (required)

**Common Patterns:**
- Text line: `class="h-4 w-full"`
- Heading: `class="h-8 w-48"`
- Avatar: `class="h-12 w-12 rounded-full"`
- Card: `class="h-32 w-full rounded-lg"`
- Button: `class="h-10 w-24 rounded"`

---

## Table

**Usage:** Wrapper around shadcn table primitives

```svelte
<script>
const posts = [
  { id: 1, title: 'First Post', date: '2025-11-20', status: 'Published' },
  { id: 2, title: 'Second Post', date: '2025-11-21', status: 'Draft' },
  { id: 3, title: 'Third Post', date: '2025-11-22', status: 'Published' }
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}
</script>

<Table
  headers={['Title', 'Date', 'Status', 'Actions']}
  rows={posts}
  let:row={post}
>
  <td>{post.title}</td>
  <td>{formatDate(post.date)}</td>
  <td><Badge>{post.status}</Badge></td>
  <td>
    <Button variant="link" href="/admin/blog/edit/{post.id}">
      Edit
    </Button>
  </td>
</Table>
```

**Advanced usage with custom header:**

```svelte
<Table
  rows={posts}
  let:row={post}
>
  <thead slot="header">
    <tr>
      <th>Title</th>
      <th>Date</th>
      <th class="text-right">Actions</th>
    </tr>
  </thead>

  <td>{post.title}</td>
  <td>{formatDate(post.date)}</td>
  <td class="text-right">
    <Button variant="link" href="/edit/{post.id}">Edit</Button>
  </td>
</Table>
```

**Props:**
- `headers` - Array of column header strings (optional, use `header` slot for custom)
- `rows` - Array of data objects
- `let:row` - Row variable name for slot props
- `class` - Additional CSS classes

**Slots:**
- Default slot: Table cells (`<td>` elements)
- `header` slot: Custom table header (optional)

---

## Common Patterns

### Hoverable Card Grid

```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {#each posts as post}
    <Card
      title={post.title}
      hoverable
      onclick={() => goto(`/blog/${post.slug}`)}
    >
      <p class="text-sm text-muted-foreground mb-4">
        {post.description}
      </p>
      <div class="flex gap-2 flex-wrap">
        {#each post.tags as tag}
          <Badge variant="tag">{tag}</Badge>
        {/each}
      </div>
    </Card>
  {/each}
</div>
```

### Form with Validation

```svelte
<script>
let title = '';
let description = '';
let errors = {};

function validate() {
  errors = {};
  if (!title) errors.title = 'Title is required';
  if (title.length < 3) errors.title = 'Title must be at least 3 characters';
  if (!description) errors.description = 'Description is required';
  return Object.keys(errors).length === 0;
}

function handleSubmit() {
  if (!validate()) {
    toast.error("Please fix validation errors");
    return;
  }
  // Submit logic
  toast.success("Post created successfully!");
}
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <Input
    label="Title"
    bind:value={title}
    required
    class={errors.title ? 'border-red-500' : ''}
  />
  {#if errors.title}
    <p class="text-sm text-red-500 mt-1">{errors.title}</p>
  {/if}

  <Input
    label="Description"
    type="textarea"
    bind:value={description}
    rows={4}
    class={errors.description ? 'border-red-500' : ''}
  />
  {#if errors.description}
    <p class="text-sm text-red-500 mt-1">{errors.description}</p>
  {/if}

  <div class="flex gap-2 mt-4">
    <Button type="submit" variant="default">Create Post</Button>
    <Button type="button" variant="ghost" onclick={() => goto('/admin')}>
      Cancel
    </Button>
  </div>
</form>
```

### Tabbed Interface with Table

```svelte
<script>
let activeTab = 'all';
$: filteredPosts = posts.filter(p => {
  if (activeTab === 'published') return p.status === 'Published';
  if (activeTab === 'drafts') return p.status === 'Draft';
  return true; // 'all'
});
</script>

<Tabs
  bind:value={activeTab}
  tabs={[
    { value: 'all', label: 'All Posts' },
    { value: 'published', label: 'Published' },
    { value: 'drafts', label: 'Drafts' }
  ]}
/>

<Table
  headers={['Title', 'Date', 'Status', 'Actions']}
  rows={filteredPosts}
  let:row={post}
>
  <td>{post.title}</td>
  <td>{formatDate(post.date)}</td>
  <td><Badge>{post.status}</Badge></td>
  <td>
    <Button variant="link" href="/admin/blog/edit/{post.slug}">Edit</Button>
  </td>
</Table>
```

### Confirmation Dialog

```svelte
<script>
let showConfirm = false;
let itemToDelete = null;

function confirmDelete(item) {
  itemToDelete = item;
  showConfirm = true;
}

function handleDelete() {
  // Delete logic
  deletePost(itemToDelete.id);
  toast.success(`Deleted ${itemToDelete.title}`);
  showConfirm = false;
  itemToDelete = null;
}
</script>

<Button variant="ghost" onclick={() => confirmDelete(post)}>
  Delete
</Button>

<Dialog
  bind:open={showConfirm}
  title="Confirm Deletion"
  description="This action cannot be undone."
>
  {#if itemToDelete}
    <p>Are you sure you want to delete <strong>{itemToDelete.title}</strong>?</p>
  {/if}

  <div slot="actions">
    <Button variant="ghost" onclick={() => showConfirm = false}>
      Cancel
    </Button>
    <Button variant="default" onclick={handleDelete}>
      Delete
    </Button>
  </div>
</Dialog>
```

### Loading State with Skeleton

```svelte
<script>
let loading = true;
let posts = [];

onMount(async () => {
  posts = await fetchPosts();
  loading = false;
});
</script>

{#if loading}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Array(6) as _}
      <Card>
        <Skeleton class="h-6 w-48 mb-4" />
        <Skeleton class="h-4 w-full mb-2" />
        <Skeleton class="h-4 w-full mb-2" />
        <Skeleton class="h-4 w-3/4 mb-4" />
        <div class="flex gap-2">
          <Skeleton class="h-6 w-16 rounded-full" />
          <Skeleton class="h-6 w-16 rounded-full" />
        </div>
      </Card>
    {/each}
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each posts as post}
      <Card title={post.title} hoverable>
        <p>{post.description}</p>
        <div class="flex gap-2 mt-4">
          {#each post.tags as tag}
            <Badge variant="tag">{tag}</Badge>
          {/each}
        </div>
      </Card>
    {/each}
  </div>
{/if}
```

---

## Advanced Usage

For advanced use cases, you can import and use shadcn primitives directly:

```svelte
<script>
import {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogPortal
} from "$lib/components/ui";
</script>

<DialogRoot>
  <DialogTrigger>Open Custom Dialog</DialogTrigger>
  <DialogPortal>
    <!-- Custom dialog content with full control -->
  </DialogPortal>
</DialogRoot>
```

**Available primitives:**
- `DialogRoot`, `DialogTrigger`, `DialogClose`, `DialogPortal`
- `SheetRoot`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetContent`
- `TableRoot`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `SelectRoot`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`
- `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`
- And more... (see `src/lib/components/ui/index.ts` for full list)

---

## Tips

1. **Use bind:value for form inputs**: Always use `bind:value` for two-way data binding
2. **Use bind:open for dialogs/sheets**: Allows components to close themselves
3. **Combine with Tailwind utilities**: Add spacing, colors, sizing with utility classes
4. **Check dark mode**: All components support dark mode via CSS variables
5. **Test accessibility**: Use keyboard navigation to verify Tab/Enter/Escape work
6. **Read the source**: Wrapper components are simple - check the source for props/behavior

---

**See also:**
- Full migration docs: `docs/shadcn-migration-complete.md`
- Component library: `src/lib/components/ui/`
- shadcn-svelte docs: https://www.shadcn-svelte.com/

---

*Last updated: November 29, 2025*
