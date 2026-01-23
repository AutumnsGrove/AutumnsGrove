# Svelte & SvelteKit Explained (For Humans)

> A friendly guide to understanding what the hell is going on in this codebase.
> For the technical reference, see `AgentUsage/svelte5_guide.md`.

---

## What Even IS Svelte?

You know how React and Vue ship a whole runtime to your browser, and then that runtime does a bunch of work to figure out what changed and update the page?

**Svelte doesn't do that.**

Svelte is a *compiler*. You write components in `.svelte` files (which yes, look like a beautiful bastard child of JavaScript and HTML), and the compiler transforms them into tiny, efficient vanilla JavaScript at build time. No runtime. No virtual DOM diffing. Just surgical DOM updates.

The result: smaller bundles, faster pages, and code that's genuinely pleasant to write.

### The Anatomy of a `.svelte` File

```svelte
<script>
  // Your JavaScript logic lives here
  let count = $state(0);

  function increment() {
    count++;
  }
</script>

<!-- Your HTML template, but with superpowers -->
<button onclick={increment}>
  Clicked {count} times
</button>

<style>
  /* CSS that's automatically SCOPED to just this component */
  button {
    background: purple;
  }
</style>
```

**That's it.** One file. Logic, markup, styles. All scoped. All compiled away.

### The Magic Bits

- `{curly braces}` = "this is JavaScript, interpolate it"
- `{#if condition}...{/if}` = conditional rendering
- `{#each items as item}...{/each}` = loops
- `onclick={handler}` = event handling (no `on:click`, just `onclick`)
- `$state()`, `$derived()`, `$props()` = **runes** (Svelte 5's reactivity system)

---

## What's SvelteKit Then?

If Svelte is the component framework, **SvelteKit is the full-stack meta-framework** built on top of it.

Think of it like this:
| Svelte | SvelteKit |
|--------|-----------|
| React | Next.js |
| Vue | Nuxt |
| Components | Full website/app framework |

SvelteKit gives you:
- **File-based routing** (folder structure = URL structure)
- **Server-side rendering** (pages load fast, SEO works)
- **API routes** (build your backend right alongside your frontend)
- **Data loading** (fetch data before the page renders)
- **Deployment adapters** (Cloudflare, Vercel, Node, static, etc.)

---

## Routes: The Folder = URL Magic

The `src/routes/` folder IS your website. Every folder becomes a URL path.

```
src/routes/
├── +page.svelte           → yoursite.com/
├── about/
│   └── +page.svelte       → yoursite.com/about
├── blog/
│   ├── +page.svelte       → yoursite.com/blog
│   └── [slug]/
│       └── +page.svelte   → yoursite.com/blog/any-post-here
└── api/
    └── posts/
        └── +server.js     → yoursite.com/api/posts
```

### The Special Files

| File | What It Does |
|------|--------------|
| `+page.svelte` | The UI for that route |
| `+page.server.js` | Runs on the server BEFORE the page loads (fetch data, check auth, etc.) |
| `+page.js` | Runs on both server AND client (universal load) |
| `+layout.svelte` | Wraps all pages in that folder (nav, footer, shared UI) |
| `+layout.server.js` | Server-side data for the layout |
| `+server.js` | A pure API endpoint (no UI, just returns JSON) |
| `+error.svelte` | What shows when something breaks |

---

## Slugs: Dynamic URL Segments

The `[slug]` in `src/routes/blog/[slug]/` is a **dynamic route parameter**.

When someone visits `/blog/my-first-post`:
1. SvelteKit matches it to `src/routes/blog/[slug]/`
2. `params.slug` becomes `"my-first-post"`
3. Your `+page.server.js` uses that to fetch the right content

```javascript
// src/routes/blog/[slug]/+page.server.js
export async function load({ params }) {
  const { slug } = params;  // "my-first-post"

  const post = await database.getPost(slug);
  return { post };
}
```

**Why "slug"?** It's the URL-friendly version of a title. Instead of `/blog/post?id=42069`, you get `/blog/making-queer-spaces-online`. Human-readable, SEO-friendly, and just nicer.

You can name the parameter anything: `[id]`, `[username]`, `[whatever]`. The name becomes the key in `params`.

---

## The Data Flow (How It All Connects)

Here's what happens when someone visits a page:

```
1. User visits /blog/some-post

2. SvelteKit matches: src/routes/blog/[slug]/

3. FIRST, runs +page.server.js ON THE SERVER:
   └── Gets `slug` from URL params
   └── Fetches post from database
   └── Returns { post: {...} }

4. THEN, renders +page.svelte:
   └── Receives data via $props()
   └── let { data } = $props();
   └── data.post now has your content!

5. Svelte compiles the template to DOM updates
   └── Page appears in browser, fully rendered
```

The `load()` function is the bridge between your backend and your frontend. Server runs first, component receives the data, user sees the result.

---

## Runes: The $ Things

Svelte 5 introduced "runes" - special compiler instructions that start with `$`.

| Rune | What It Does | Example |
|------|--------------|---------|
| `$state()` | Reactive variable that triggers updates | `let count = $state(0)` |
| `$derived()` | Computed value that auto-updates | `let doubled = $derived(count * 2)` |
| `$props()` | Receive data from parent/server | `let { data } = $props()` |
| `$effect()` | Run side effects when things change | `$effect(() => console.log(count))` |

These replace the old `$:` reactive syntax from Svelte 4. More explicit, more powerful.

---

## This Project's Architecture

```
src/
├── routes/                  # The website structure
│   ├── +page.svelte         # Homepage
│   ├── +layout.server.js    # Root data loading (auth, settings)
│   ├── blog/
│   │   ├── +page.svelte     # Blog listing
│   │   └── [slug]/          # Individual posts (dynamic)
│   ├── recipes/[slug]/      # Recipe pages (dynamic)
│   ├── gallery/             # Image gallery
│   ├── admin/               # Admin dashboard (protected)
│   └── api/                 # Backend API endpoints
│       ├── posts/           # CRUD for blog posts
│       ├── images/          # Image upload/management
│       └── git/             # GitHub integration
│
├── lib/                     # Shared code ($lib alias)
│   ├── components/          # Reusable Svelte components
│   ├── content/             # Markdown processing
│   └── utils/               # Helper functions
│
└── app.html                 # The HTML shell everything renders into
```

### The `$lib` Import Alias

When you see `import { Button } from '$lib/components'`, that's SvelteKit's way of saying "look in `src/lib/`". Clean imports, no relative path hell.

---

## The Cloudflare Connection

This project uses `@sveltejs/adapter-cloudflare`, which means:

1. **Build time:** SvelteKit compiles everything
2. **Deploy:** Cloudflare Pages hosts your static assets
3. **Runtime:** Your `+page.server.js` and `+server.js` files run as Cloudflare Workers
4. **Bindings:** D1 (database), R2 (storage), KV (cache) are available via `platform.env`

```javascript
// How you access Cloudflare services
export async function load({ platform }) {
  if (platform?.env?.POSTS_DB) {
    const posts = await platform.env.POSTS_DB
      .prepare("SELECT * FROM posts")
      .all();
    return { posts: posts.results };
  }
}
```

---

## Quick Mental Model

| Concept | What It Means |
|---------|---------------|
| `.svelte` file | Component = logic + markup + styles in one file |
| `src/routes/` | Folder structure = URL structure |
| `+page.svelte` | The visible UI for a route |
| `+page.server.js` | Fetch data before render (runs on server) |
| `+server.js` | API endpoint (no UI, just JSON) |
| `[slug]` | Dynamic URL segment, becomes `params.slug` |
| `$props()` | How components receive data |
| `$state()` | Reactive variable that triggers UI updates |
| `$lib/` | Import alias for `src/lib/` |
| `platform.env` | Access to Cloudflare D1/R2/KV bindings |

---

## Why This Setup Is Actually Great

1. **File-based routing** means you never have to manually configure routes
2. **Server-side rendering** means fast initial loads and good SEO
3. **Scoped CSS** means no more class name collisions
4. **The compiler** means smaller bundles than React/Vue
5. **Cloudflare edge deployment** means your server code runs close to users
6. **D1/R2 integration** means database and storage without managing infrastructure

The learning curve is real, but once the mental model clicks, it's genuinely one of the most pleasant ways to build websites.

---

## When You're Confused

1. **"Where does this data come from?"** → Check the `+page.server.js` in that route
2. **"How do I add a new page?"** → Create a folder in `src/routes/` with a `+page.svelte`
3. **"How do I make an API endpoint?"** → Create a `+server.js` with GET/POST/etc functions
4. **"Why isn't my change showing?"** → Check if you need to restart the dev server
5. **"What's platform.env?"** → That's Cloudflare giving you access to D1/R2/KV

---

*For the technical deep-dive on runes, TypeScript, and edge cases, see `AgentUsage/svelte5_guide.md`.*
