# Phase 3B: Migrate Public Routes to Wrapper Components

## Context

Admin routes are migrated (Phase 3A). Now we update public-facing routes. These are user-facing pages that need extra care to maintain the warm, authentic AutumnsGrove aesthetic.

**Goal**: Update all public routes to use wrapper components while preserving the site's personality.

---

## Routes to Migrate

1. `/+layout.svelte` - Header, nav, footer, search, theme toggle
2. `/+page.svelte` - Homepage hero, CTA button
3. `/blog/+page.svelte` - Post cards, tags
4. `/blog/search/+page.svelte` - Search input, filters, cards
5. `/blog/[slug]/+page.svelte` - Back link, tags
6. `/recipes/+page.svelte` - Recipe cards
7. `/recipes/[slug]/+page.svelte` - Back link, tags, IconLegend
8. `/about/+page.svelte` - Warning banner
9. `/credits/+page.svelte` - Credit cards, font preview
10. `/dashboard/+page.svelte` - Complex stats, charts, selects
11. `/gallery/+page.svelte` - Gallery grid, lightbox
12. `/timeline/+page.svelte` - Timeline cards, expandable sections
13. `/contact/+page.svelte` - Simple content
14. `/auth/login/+page.svelte` - Login form

---

## Main Layout (/+layout.svelte)

This is the most important file. Migrate carefully.

### Header Navigation

Keep the structure, update components:

```svelte
<script>
  import { Button, Sheet, Input, Toast } from "$lib/components/ui";
  import { Search, Sun, Moon, Menu, X } from "lucide-svelte";
  // ... existing imports
</script>

<!-- Desktop search button -->
<Button variant="ghost" size="icon" onclick={toggleSearch} aria-label="Search">
  <Search class="h-5 w-5" />
</Button>

<!-- Theme toggle -->
<Button variant="ghost" size="icon" onclick={toggleTheme} aria-label="Toggle theme">
  {#if isDark}
    <Sun class="h-5 w-5" />
  {:else}
    <Moon class="h-5 w-5" />
  {/if}
</Button>

<!-- Mobile menu button -->
<Button variant="ghost" size="icon" class="lg:hidden" onclick={toggleMobileMenu}>
  {#if mobileMenuOpen}
    <X class="h-6 w-6" />
  {:else}
    <Menu class="h-6 w-6" />
  {/if}
</Button>
```

### Mobile Menu

Option A: Keep current implementation (simpler)
Option B: Use Sheet component (more polished)

```svelte
<!-- Option B: Sheet-based mobile menu -->
<Sheet bind:open={mobileMenuOpen} side="left" title="Menu">
  <nav class="flex flex-col gap-2 mt-4">
    {#each navItems as item}
      <a
        href={item.href}
        class="px-4 py-2 rounded-md hover:bg-secondary"
        class:bg-primary={$page.url.pathname === item.href}
        class:text-primary-foreground={$page.url.pathname === item.href}
        onclick={() => mobileMenuOpen = false}
      >
        {item.label}
      </a>
    {/each}
  </nav>
</Sheet>
```

### Search Input

```svelte
<!-- Expanded search -->
{#if searchExpanded}
  <div class="absolute inset-x-0 top-full bg-background border-b p-4">
    <Input
      bind:value={searchQuery}
      placeholder="Search posts... (Press '/' to focus)"
      class="max-w-xl mx-auto"
      autofocus
    />
  </div>
{/if}
```

### Footer

Simple Tailwind styling, minimal changes needed.

### CSS Cleanup

The `+layout.svelte` has a large `<style>` block. After migration:

1. Remove all `:root` CSS variable definitions (now in app.css)
2. Remove button styles
3. Remove form input styles
4. Keep: navigation animation styles, layout positioning
5. Convert remaining styles to Tailwind where practical

---

## Homepage (/+page.svelte)

### Hero Section

```svelte
<section class="hero bg-gradient-to-b from-background via-secondary/30 to-primary/10 dark:from-background dark:via-secondary/20 dark:to-primary/5 py-16 px-4">
  <div class="max-w-3xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-primary mb-4">
      {data.title}
    </h1>
    <p class="text-xl text-muted-foreground mb-8">
      {data.subtitle}
    </p>
    <Button variant="primary" size="lg" href="/about">
      Learn More
    </Button>
  </div>
</section>
```

### Latest Post Section

```svelte
<script>
  import { InternalsPostViewer } from "$lib/components/custom";
</script>

<!-- Keep the custom component, it works well -->
<InternalsPostViewer post={data.latestPost} />
```

---

## Blog Routes

### /blog/+page.svelte

```svelte
<script>
  import { Card, Badge } from "$lib/components/ui";
</script>

{#each posts as post}
  <Card hoverable class="cursor-pointer" onclick={() => goto(`/blog/${post.slug}`)}>
    <a href="/blog/{post.slug}" class="block">
      <h2 class="text-xl font-semibold text-primary mb-2">{post.title}</h2>
      <time class="text-sm text-muted-foreground">{formatDate(post.date)}</time>
      <p class="mt-2 text-foreground/80">{post.description}</p>
      <div class="flex gap-2 flex-wrap mt-4">
        {#each post.tags as tag}
          <a href="/blog/search?tag={tag}" onclick|stopPropagation>
            <Badge variant="tag">{tag}</Badge>
          </a>
        {/each}
      </div>
    </a>
  </Card>
{/each}
```

### /blog/search/+page.svelte

```svelte
<script>
  import { Input, Badge, Button } from "$lib/components/ui";
</script>

<!-- Search input -->
<div class="relative max-w-xl">
  <Input
    bind:value={searchQuery}
    placeholder="Search posts..."
    class="pl-10"
  />
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  {#if searchQuery}
    <Button
      variant="ghost"
      size="icon"
      class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
      onclick={() => searchQuery = ''}
    >
      <X class="h-4 w-4" />
    </Button>
  {/if}
</div>

<!-- Tag filters -->
<div class="flex gap-2 flex-wrap">
  {#each allTags as tag}
    <button onclick={() => toggleTag(tag)}>
      <Badge
        variant={selectedTags.includes(tag) ? "default" : "outline"}
        class="cursor-pointer"
      >
        {tag}
      </Badge>
    </button>
  {/each}
</div>
```

### /blog/[slug]/+page.svelte

```svelte
<script>
  import { Badge, Button } from "$lib/components/ui";
  import { ContentWithGutter } from "$lib/components/custom";
  import { ArrowLeft } from "lucide-svelte";
</script>

<Button variant="link" href="/blog" class="mb-4">
  <ArrowLeft class="h-4 w-4 mr-2" />
  Back to Blog
</Button>

<!-- Tags -->
<div class="flex gap-2 flex-wrap mt-4">
  {#each post.tags as tag}
    <a href="/blog/search?tag={tag}">
      <Badge variant="tag">{tag}</Badge>
    </a>
  {/each}
</div>

<!-- Content uses custom component -->
<ContentWithGutter {content} {gutterItems} {headers} />
```

---

## Recipe Routes

Similar patterns to blog routes. Key differences:

### /recipes/[slug]/+page.svelte

```svelte
<script>
  import { Badge } from "$lib/components/ui";
  import { ContentWithGutter, IconLegend } from "$lib/components/custom";
</script>

<!-- Keep IconLegend as-is -->
<IconLegend icons={usedIcons} />

<!-- Content -->
<ContentWithGutter {content} {gutterItems} {headers} />
```

---

## Dashboard (/dashboard/+page.svelte)

This is a complex page. Migrate incrementally:

```svelte
<script>
  import { Card, Select, Button, Accordion } from "$lib/components/ui";
  import { CollapsibleSection } from "$lib/components/custom"; // Keep for now or migrate to Accordion
  import { ActivityOverview, LOCBar, RepoBreakdown, Sparkline } from "$lib/components/charts";
</script>

<!-- Time range selector -->
<Select
  bind:value={timeRange}
  options={[
    { value: 'all', label: 'All Time' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'today', label: 'Today' }
  ]}
/>

<!-- Stats cards -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card title="Commits">
    <span class="text-3xl font-bold">{stats.commits}</span>
  </Card>
  <!-- ... more stat cards -->
</div>

<!-- Keep chart components as-is, just ensure containers use Tailwind -->
<Card title="Activity">
  <ActivityOverview data={activityData} />
</Card>

<!-- Collapsible explanations → Accordion -->
<Accordion
  items={[
    {
      value: 'about',
      title: 'About this dashboard',
      content: () => html`<p>Explanation text...</p>`
    }
  ]}
/>
```

---

## Gallery (/gallery/+page.svelte)

Gallery migration is handled in Phase 5. For now:

1. Keep existing gallery grid (convert styling to Tailwind)
2. Keep existing lightbox logic
3. Defer component changes to Phase 5

---

## Timeline (/timeline/+page.svelte)

```svelte
<script>
  import { Card, Button, Accordion } from "$lib/components/ui";
  import { ActivityOverview, LOCBar, RepoBreakdown } from "$lib/components/charts";
</script>

<!-- Timeline cards -->
{#each days as day}
  <Card class={day.isRestDay ? 'opacity-60' : ''}>
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-semibold">{day.date}</h3>
        {#if day.isToday}
          <Badge>Today</Badge>
        {/if}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => toggleExpand(day.date)}
      >
        {day.expanded ? 'Collapse' : 'Expand'}
      </Button>
    </div>

    <!-- Day content -->
    {#if day.expanded}
      <div class="mt-4 prose prose-sm dark:prose-invert">
        {@html day.content}
      </div>
    {/if}
  </Card>
{/each}
```

---

## Auth Login (/auth/login/+page.svelte)

```svelte
<script>
  import { Card, Input, Button } from "$lib/components/ui";
</script>

<div class="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
  <Card title="Sign In" class="w-full max-w-md">
    {#if step === 'email'}
      <form onsubmit={handleEmailSubmit}>
        <Input
          type="email"
          label="Email"
          bind:value={email}
          placeholder="you@example.com"
          required
          error={emailError}
        />
        <Button type="submit" class="w-full mt-4" loading={isLoading}>
          Send Code
        </Button>
      </form>
    {:else}
      <form onsubmit={handleCodeSubmit}>
        <Input
          type="text"
          label="Verification Code"
          bind:value={code}
          placeholder="000000"
          maxlength={6}
          inputmode="numeric"
          class="text-center text-2xl tracking-widest"
          error={codeError}
        />
        <Button type="submit" class="w-full mt-4" loading={isLoading}>
          Verify
        </Button>
        <Button variant="link" onclick={goBackToEmail} class="w-full mt-2">
          Use different email
        </Button>
      </form>
    {/if}

    {#if error}
      <p class="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
        {error}
      </p>
    {/if}
  </Card>
</div>
```

---

## About & Contact Pages

These are simple content pages. Minimal changes:

### /about/+page.svelte

```svelte
<!-- Convert warning banner to Tailwind -->
<div class="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-4 rounded-lg mb-8">
  <p class="text-amber-800 dark:text-amber-200">
    ⚠️ This site is under construction...
  </p>
</div>

<!-- Keep ContentWithGutter -->
<ContentWithGutter {content} {gutterItems} {headers} />
```

---

## Credits Page (/credits/+page.svelte)

```svelte
<script>
  import { Card } from "$lib/components/ui";
</script>

{#each sections as section}
  <Card title={section.title} class="mb-6">
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {#each section.items as item}
        <dt class="font-medium">{item.name}</dt>
        <dd class="text-muted-foreground">
          <a href={item.url} class="hover:text-primary underline">
            {item.description}
          </a>
        </dd>
      {/each}
    </dl>
  </Card>
{/each}
```

---

## Testing Checklist

After completing all public routes:

- [ ] Homepage loads with hero
- [ ] Navigation works (desktop + mobile)
- [ ] Search opens with `/` or `Cmd+K`
- [ ] Search filters posts correctly
- [ ] Theme toggle works and persists
- [ ] Blog list displays correctly
- [ ] Blog post content renders with gutter
- [ ] Blog search filters work
- [ ] Tags link to search page
- [ ] Recipe pages render with icons
- [ ] Dashboard charts load
- [ ] Timeline cards expand/collapse
- [ ] Gallery displays images
- [ ] Login form works
- [ ] All links navigate correctly
- [ ] Dark mode works throughout
- [ ] Mobile responsive on all pages

---

## Success Criteria

- [ ] All public routes use wrapper components
- [ ] Visual appearance matches/improves original
- [ ] Dark mode works perfectly
- [ ] Mobile responsive throughout
- [ ] Keyboard navigation works
- [ ] Search shortcuts work
- [ ] All forms submit correctly
- [ ] No console errors
