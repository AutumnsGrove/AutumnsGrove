# The Control Room: A Museum Exhibit

Welcome to **The Control Room**—the ~7,000 line admin panel that powers Autumn's Grove. This exhibit is designed for you, for anyone learning how websites actually work behind the scenes. Think of it as a guided tour through the machinery that keeps a modern web presence alive.

---

## What You're Looking At

This admin panel is a **full-featured content management system** built right into the site itself. It's the operating system of the Grove. When you visit the public site, you're seeing the output of decisions made here.

**The scope is intentional:**
- 17 files across multiple sections
- ~7,136 lines of carefully organized code
- Eight distinct admin areas (dashboard, blog, pages, images, analytics, timeline, logs, settings)
- Full CRUD operations for all content
- Real-time health monitoring and system integration

This is the crown jewel of the codebase—where policy becomes content, where settings become aesthetics, where the *what* becomes the *how*.

---

## Auth Protection Pattern: The Bouncer at the Door

Every admin route is protected by a simple but elegant pattern established in `+layout.server.js`:

```javascript
export async function load({ locals, url }) {
  if (!locals.user) {
    throw redirect(
      302,
      `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
    );
  }

  return { user: locals.user };
}
```

**What this does:**
1. Every admin page runs this check *before* rendering
2. If no user is logged in, you're redirected to login
3. The `redirect` parameter preserves where you were trying to go
4. After login, you return to your intended destination (not just the dashboard)

**Why this matters:** This is the difference between a site that feels thoughtful and one that feels frustrating. Good UX doesn't reset you to the start.

The `prerender = false` flag is crucial—these pages must be rendered on-demand because they require authentication and show personalized data. Static generation is impossible here.

---

## The Sections: A Functional Map

### Dashboard (`+page.svelte`)

The first thing you see. It's not decoration—it's operational intelligence.

**What it shows:**
- System health status (GitHub token, KV cache, D1 database)
- Blog post count
- Quick action cards for all admin areas
- A teaser for upcoming features

**Why it's smart:**
```javascript
const [health, postsData] = await Promise.all([
  api.get('/api/git/health'),
  api.get('/api/posts').catch(() => null)
]);
```

These requests run *in parallel*, not sequentially. The dashboard loads faster because it's fetching health and content at the same time.

### Blog Posts (`blog/+page.svelte`, `blog/edit/[slug]/+page.server.js`)

Full CRUD for your writing.

**The view:** A clean table showing all posts with metadata (date, tags, description). Mobile-responsive hiding of columns. Actions for viewing and editing each post.

**The load function** (the interesting part):
```javascript
// Try D1 (database) first
if (platform?.env?.POSTS_DB) {
  try {
    const post = await platform.env.POSTS_DB.prepare(
      `SELECT ... FROM posts WHERE slug = ?`
    ).bind(slug).first();
    // Return with source: "d1"
  }
}

// Fallback to filesystem
const modules = import.meta.glob("/UserContent/Posts/*.md", {
  eager: true,
  query: "?raw"
});
// Find matching file and parse with gray-matter
```

**This is resilience in action:** The system tries the database first (fast, centralized), but if that fails, it falls back to reading markdown files directly. Your content *always* loads, even if databases are unreachable.

### Pages CMS (`pages/+page.svelte`, `pages/edit/[slug]/+page.server.js`)

Manage static pages (Home, About, Contact, etc.) with the same markdown editor approach as blog posts.

**Key difference:** Pages are synced via scripts (`node scripts/sync-pages.cjs --remote`). They live in `UserContent/Home/`, `UserContent/About/`, etc., and the admin panel lets you edit them in-place without leaving the web interface.

### Images (`images/+page.svelte`)

Gallery management for visual content.

### Analytics (`analytics/+page.svelte`)

Visitor tracking, behavior metrics, and performance data. This is where you understand who's actually reading your work.

### Timeline (`timeline/+page.svelte`)

A chronological view of your life, curated through the admin panel. This is the personal archive.

### Logs/Console (`logs/+page.svelte`)

System output, error messages, and operational events. A window into what the machinery is doing right now.

### Settings (`settings/+page.svelte`)

The nerve center. This is where the complexity lives:

**Font Selection:**
Nine font choices with real-time preview. This isn't about preferences—it's about accessibility. Options include:
- Alagard (default medieval aesthetic)
- Atkinson Hyperlegible (accessibility for low vision)
- OpenDyslexic (accessibility for dyslexia)
- Lexend (reading fluency)
- Cormorant (elegant serif aesthetic)

When you select a font, it's saved to the database and applied immediately via CSS custom properties.

**Health Check:**
Four status indicators that poll the backend:
- Overall system status
- GitHub token configuration
- KV cache connectivity
- D1 database connection

**AI Writing Assistant:**
Toggle to enable Claude-powered writing analysis. Options include:
- Model selection (Haiku or Sonnet)
- Usage tracking (requests, tokens, cost)
- Clear explanation that it analyzes, never generates

**Cache Management:**
Clear the KV cache on-demand. The system refetches data from source on next request.

---

## Key Files Deep Dive

### `+layout.svelte`: The Frame

This is where the sidebar lives—the navigation structure for the entire admin panel.

**Smart features:**
- Desktop sidebar (250px wide, collapsible to 60px)
- Mobile navigation via Sheet component (overlay menu)
- Collapsed state persisted to localStorage
- Responsive breakpoint at 768px

The sidebar shows:
- Admin Panel header with collapse button
- Eight navigation links (each with icons)
- User info (email) at bottom
- Logout button

**Why this architecture:** The layout is a SvelteKit `+layout.svelte`, which means all nested routes inherit this structure. Add a new admin page? It automatically gets the sidebar.

### `+layout.server.js`: The Gatekeeper

Three lines of authentication logic that protect everything.

The `export const prerender = false` is the critical line—it ensures these routes can't be pre-built as static HTML. Each request must be evaluated fresh.

### `blog/+page.server.js` and `pages/+page.server.js`

These load the posts and pages by querying the database, returning paginated lists.

### `settings/+page.svelte`: The Maestro

489 lines of settings management. This is the most complex single file in the admin section because it manages multiple semi-independent systems:

**State management:**
```javascript
let currentFont = $state('alagard');
let aiEnabled = $state(false);
let aiModel = $state('haiku');
let healthStatus = $state(null);
let loadingHealth = $state(true);
```

Each setting has its own loading and saving state. This prevents race conditions where a user changes something while it's still being saved.

**The save pattern:**
```javascript
async function saveFont() {
  savingFont = true;
  fontMessage = '';

  try {
    await api.put('/api/admin/settings', {
      setting_key: 'font_family',
      setting_value: currentFont
    });
    fontMessage = 'Font setting saved!';
  } catch (error) {
    fontMessage = 'Error: ' + error.message;
  }

  savingFont = false;
}
```

This is a complete async operation pattern:
1. Set loading state
2. Clear previous message
3. Try to save
4. Show success or error message
5. Reset loading state

Users see feedback at every step. There's no mystery—they know what's happening.

---

## UI Patterns: How the Admin Interface Is Built

### The GlassCard Component

Used throughout to organize settings into logical groupings. It's not just decoration—it creates visual hierarchy and separates concerns.

```svelte
<GlassCard title="Font Selection" variant="default">
  <!-- content -->
</GlassCard>
```

### State-Driven Rendering

Every section uses Svelte's `$state` and `$effect` to manage reactive data:

```javascript
let loading = $state(true);

$effect(() => {
  fetchHealth();  // Runs automatically when component mounts
});
```

When `loading` changes, the template re-renders—showing skeletons while waiting, then showing real content when ready.

### Error Boundaries

Every async operation wraps errors:

```javascript
try {
  const data = await api.get('/api/settings');
  // process data
} catch (error) {
  toast.error('Failed to load settings');  // User sees a notification
  console.error('Failed to fetch:', error); // Developers see details
}
```

### Message Feedback

Success and error messages appear in real-time:

```svelte
{#if fontMessage}
  <div class="message" class:success={fontMessage.includes('saved')} ...>
    {fontMessage}
  </div>
{/if}
```

Users never wonder if their action worked. Messages appear, then disappear after timeout.

### Skeleton Loading

While data loads, placeholder skeletons appear:

```svelte
{#if loadingHealth}
  <Skeleton class="h-12 w-full" />
{:else}
  <!-- real content -->
{/if}
```

This prevents layout shift—the page doesn't jump around when content arrives.

---

## Lessons Learned

### Database Fallback Is Critical

The blog post loader shows this perfectly—it tries D1 first, then falls back to filesystem. This pattern prevents total failure when one data source is unreachable.

### State Management Should Be Explicit

Each operation has its own loading/saving/error state. This prevents bugs where UI gets out of sync with reality.

### User Feedback Matters

At every step, users know what's happening. Is it saving? Is it an error? Did it work? The UI never leaves you guessing.

### Responsive Design Isn't Optional

The sidebar collapses on desktop, transforms to a menu sheet on mobile. Analytics and tables hide columns on small screens. The admin panel works everywhere because it was designed for everywhere.

### Accessibility Is Built In

Font choices include multiple accessibility options (Atkinson, OpenDyslexic, Lexend). The AI assistant has a clear explanation of what it does and doesn't do. Color alone isn't used to indicate status—there's text too.

### Prerendering Must Be Explicit

Most SvelteKit routes can be statically generated. Admin routes *can't* be. The `prerender = false` flag is a reminder that some pages are fundamentally dynamic.

### Parallel Requests Are Faster

The dashboard fetches health and post count at the same time using `Promise.all()`, not sequentially. This is a tiny optimization that compounds across thousands of users.

---

## The Philosophy

This admin panel represents a philosophy: **a website is a conversation with its visitors**. To have that conversation authentically, you need to control your own platform. You can't outsource the dashboard to Wordpress or Squarespace—it wouldn't sound like you.

The Grove's admin panel is built for one person making authentic, thoughtful updates to her website. It's not trying to scale to thousands of editors. It's trying to be *clear*, *safe*, and *responsive*.

Every button has a label. Every action has feedback. Every setting is reversible. Every error is survivable.

That's The Control Room. Welcome to the machinery. Now go build something.

---

**Further Reading:**
- How SvelteKit layouts work: `src/routes/admin/+layout.svelte`
- Authentication pattern: `src/routes/admin/+layout.server.js`
- Real-time state management: `src/routes/admin/settings/+page.svelte`
- Database fallback pattern: `src/routes/admin/blog/edit/[slug]/+page.server.js`

---

## Continue Your Tour

**Related exhibits:**

- **[The Architecture](/src/EXHIBIT.md)** — The high-level overview of the system
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — API endpoints that the admin panel calls
- **[The Visitor Experience](/src/routes/EXHIBIT.md)** — The public pages this panel manages
- **[The Content Gallery](/UserContent/EXHIBIT.md)** — File-based content that syncs here
- **[The Foundation](/migrations/EXHIBIT.md)** — Database schema for posts and settings
- **[The Automation Wing](/.github/EXHIBIT.md)** — CI/CD and automated code review

**[← Back to the Museum Entrance](/MUSEUM.md)**
