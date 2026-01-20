# The Visitor Experience

Welcome to Autumn's Grove's public-facing pages. This exhibit explains how visitors experience the site and the elegant systems that make those pages work. Think of this as a guided tour for someone learning how modern websites handle content, data, and user experience.

If you're learning web development, pay attention to the patterns here—they solve real problems in scalable, maintainable ways.

---

## Part 1: What You're Looking At

When someone visits autumnsgrove.com, they see these public pages:

- **Home** (`/`) - The entry point, featuring the latest blog post and site introduction
- **About** (`/about`) - Static page about Autumn
- **Contact** (`/contact`) - Contact form and information
- **Blog** (`/blog`) - Archive of all blog posts
- **Blog Post** (`/blog/[slug]`) - Individual post views with dynamic routing
- **Blog Search** (`/blog/search`) - Search and filter posts by tags
- **Gallery** (`/gallery`) - Image gallery with filtering
- **Dashboard** (`/dashboard`) - User-specific content (timeline, showcase, etc.)
- **Credits** (`/credits`) - Attribution and inspiration
- **RSS Feed** (`/rss.xml`) - Machine-readable content feed

**Behind the scenes:** These routes load content from two sources:
1. **UserContent/** - Markdown files committed to the repo (for local development)
2. **Cloudflare D1** - SQLite database for content created via the admin panel
3. **R2 Object Storage** - Image files for the gallery

The site gracefully falls back between these sources, so it works locally, in staging, and in production.

---

## Part 2: SvelteKit Routing Primer

SvelteKit uses **file-based routing**. The folder structure *is* the URL structure:

```
src/routes/
├── +page.svelte          → /
├── about/
│   └── +page.svelte      → /about
├── blog/
│   ├── +page.svelte      → /blog
│   ├── [slug]/
│   │   └── +page.svelte  → /blog/some-post-name
│   └── search/
│       └── +page.svelte  → /blog/search
└── gallery/
    └── +page.svelte      → /gallery
```

**The magic files:**

- `+page.svelte` - The UI component that renders (what the visitor sees)
- `+page.server.js` - Server-side code that loads data *before* rendering
- `+layout.server.js` - Shared data for all pages (root level loads site settings)

When you visit `/blog/my-post`, SvelteKit:
1. Extracts `my-post` as the `slug` parameter from the URL
2. Calls the `+page.server.js` load function with that slug
3. Fetches the post data
4. Passes it to `+page.svelte` for rendering

---

## Part 3: Key Pages & Their Patterns

### Pattern 1: Static Pages with Prerendering

**Files:** `/about`, `/contact`, `/credits`

```javascript
// about/+page.server.js
export const prerender = true;  // Build-time rendering

export function load() {
  const page = getAboutPage();

  if (!page) {
    throw error(404, "About page not found");
  }

  return { page };
}
```

**What's happening:**
- `prerender = true` tells SvelteKit to generate these pages at *build time*
- The markdown files are read when you run `npm run build`
- Visitors get pure HTML (fastest possible)
- Great for content that doesn't change often

**Why:** About and Contact pages rarely change and don't need real-time data, so we can pre-generate them once and serve them everywhere.

---

### Pattern 2: Dynamic Pages with Fallback Loading

**File:** `/blog/[slug]/+page.server.js`

This is the sophisticated one. Here's the strategy:

1. **Try the database first** (Cloudflare D1)
   - Posts created via admin panel live here
   - Includes custom metadata (gutter content, custom fonts)
   - Real-time updates

2. **Fall back to filesystem** (UserContent/)
   - Posts committed to the repo
   - Good for local development
   - Version-controlled

3. **Process the data consistently**
   - Parse markdown to HTML
   - Extract table of contents headers
   - Process special anchor tags
   - Parse JSON fields safely

```javascript
// Pseudocode of the pattern:
export async function load({ params, platform }) {
  // Step 1: Try D1 database
  if (platform?.env?.POSTS_DB) {
    try {
      const post = await platform.env.POSTS_DB.prepare(
        'SELECT ... FROM posts WHERE slug = ?'
      ).bind(params.slug).first();

      if (post) {
        // Process post data and return
        return { post: processedPost };
      }
    } catch (err) {
      console.error("D1 error:", err);
      // Fall through
    }
  }

  // Step 2: Try filesystem
  const post = getPostBySlug(params.slug);
  if (post) return { post };

  // Step 3: Post not found
  throw error(404, "Post not found");
}
```

**Why this pattern:** Developers can work locally without database setup. Deploying to Cloudflare just works. Content created in the admin panel flows through D1. It's resilient and flexible.

---

### Pattern 3: Complex Data Loading with Joins

**File:** `/gallery/+page.server.js`

The gallery is fascinating because it demonstrates enterprise patterns:

1. **Fetch from R2 object storage** (cloud file system)
   - Lists all image files
   - Handles pagination (cursor-based for efficiency)

2. **Parse filenames as metadata**
   - Format: `YYYY-MM-DD_category_filename.jpg`
   - Extracts date, category, slug from the path

3. **Batch query D1 database** (important!)
   - Max 100 images per batch (SQL query length limits)
   - Joins with gallery_images, gallery_tags, gallery_collections tables
   - Prevents memory overload with large galleries

4. **Join and filter**
   - Combine R2 data with D1 metadata
   - Extract available filters (categories, years, tags)
   - Sort by date

```javascript
// Key insight: batch loading
const batchSize = 100;
for (let i = 0; i < images.length; i += batchSize) {
  const batch = images.slice(i, i + batchSize);
  const keys = batch.map(img => img.r2_key);

  // Build safe parameterized query
  const placeholders = keys.map(() => '?').join(',');
  const query = `SELECT ... WHERE r2_key IN (${placeholders})`;

  const results = await db.prepare(query).bind(...keys).all();
  // Process results...
}
```

**Why this matters:** When you have thousands of images, fetching metadata one-by-one is slow. Batching reduces database calls from 5,000 to 50. It's the difference between a fast site and a crawling one.

---

### Pattern 4: Runtime Rendering with User Context

**File:** `/blog/+page.server.js` and `dashboard` routes

```javascript
export const prerender = false;  // Render at request time

export async function load({ locals, platform }) {
  let posts = [];

  // Try D1 first
  if (platform?.env?.POSTS_DB) {
    const result = await platform.env.POSTS_DB.prepare(
      'SELECT ... FROM posts ORDER BY date DESC'
    ).all();
    posts = result.results.map(post => ({...}));
  }

  // Fallback
  if (posts.length === 0) {
    posts = getAllPosts();  // From filesystem
  }

  return {
    posts,
    user: locals.user || null,  // Pass authenticated user
  };
}
```

**What's interesting:**
- `prerender = false` means render fresh for each visitor
- `locals.user` contains the authenticated user (set by middleware)
- Different users might see different content (admin links, etc.)
- Still fast because the data structure is cacheable

---

## Part 4: The Gutter System

Many pages include optional **"gutter content"** - asides, callouts, images, quotes that float alongside the main text.

**How it works:**

1. **Admin creates gutter content** in manifest files or via the admin panel
2. **Stored as JSON** in the database or file

```javascript
// Example gutter content structure
[
  {
    type: "comment",
    content: "This is a thoughtful aside about the topic..."
  },
  {
    type: "image",
    url: "https://cdn.autumnsgrove.com/photo.jpg",
    caption: "A meaningful moment"
  },
  {
    type: "markdown",
    content: "A [link](https://example.com) or formatted note"
  }
]
```

3. **In `+page.server.js`**, we parse and process it:

```javascript
// Safely parse JSON
let gutterContent = [];
if (pageData.gutter_content) {
  try {
    gutterContent = JSON.parse(pageData.gutter_content);

    // Convert markdown to HTML for certain types
    gutterContent = gutterContent.map((item) => {
      if ((item.type === "comment" || item.type === "markdown") && item.content) {
        return {
          ...item,
          content: sanitizeMarkdown(marked.parse(item.content))
        };
      }
      return item;
    });
  } catch (e) {
    console.warn("Failed to parse gutter_content:", e);
    gutterContent = [];
  }
}
```

4. **Pass to template**, where it renders in a sidebar

**Design principle:** Graceful degradation. If gutter content fails to parse, the main content still loads. Visitors see the core experience, not a broken page.

---

## Part 5: Data Loading Patterns (What Happens When You Visit a Page)

### The Homepage Load Process

```
1. Browser requests GET /
   ↓
2. SvelteKit calls /+layout.server.js
   • Loads site settings from D1 (font, theme, etc.)
   • Loads authenticated user (if logged in)
   • Returns shared data for all pages
   ↓
3. SvelteKit calls /+page.server.js
   • Tries D1 for "home" page
   • Falls back to filesystem getHomePage()
   • Tries D1 for latest blog post
   • Falls back to filesystem getLatestPost()
   • Returns { title, description, hero, content, headers, gutterContent, latestPost }
   ↓
4. Svelte renders /+page.svelte
   • Uses data from load function
   • Renders layout + content
   ↓
5. Browser receives HTML
   • Hydrates with JavaScript (interactivity)
   • Visitor sees the page
```

### The Blog Post Load Process

```
1. Browser requests GET /blog/my-favorite-post
   ↓
2. SvelteKit extracts slug: "my-favorite-post"
   ↓
3. Calls /blog/[slug]/+page.server.js with params.slug
   ↓
4. load function:
   • Tries POSTS_DB.prepare('SELECT ... WHERE slug = ?').bind(slug).first()
   • If found in D1:
     - Parse JSON fields (tags, gutter_content)
     - Detect if html_content is raw markdown, re-parse if needed
     - Extract headers from HTML for ToC
     - Process anchor tags
   • If not in D1, try filesystem with getPostBySlug(slug)
   • If not found anywhere, throw error(404, "Post not found")
   ↓
5. Returns { post: { slug, title, date, tags, content, headers, gutterContent, font } }
   ↓
6. Svelte renders with this data
   ↓
7. Browser receives the post page
```

---

## Part 6: Why These Patterns Matter

### 1. **Graceful Degradation**

Every page tries multiple data sources:
- Database first (real-time, production data)
- Filesystem fallback (development, version-controlled)
- Error handling (user still sees something useful)

**Impact:** Site works locally, in CI/CD, and in production with the same code.

### 2. **Performance**

- Static pages prerendered at build time (instant load)
- Batch database queries (fewer round trips)
- Cursor-based pagination (handles huge datasets)
- Lazy loading where appropriate

**Impact:** Pages load fast regardless of content size.

### 3. **Security**

- Sanitized markdown (prevents XSS attacks)
- Safe JSON parsing with try-catch
- Parameterized database queries (prevents SQL injection)
- User authentication on sensitive routes

**Impact:** Content is safe and user data is protected.

### 4. **Maintainability**

- Consistent patterns across all pages
- Server logic separated from UI components
- Clear data flow (load → return → render)
- Comments on non-obvious decisions

**Impact:** New developers can understand the code quickly.

---

## Part 7: Lessons Learned

**What works well:**

- File-based routing feels intuitive once you get it
- Server-side loading functions keep data fetching logic clean
- Fallback loading patterns are elegant for multi-environment setups
- Markdown + database hybrid approach is flexible

**Things to watch:**

- SQL query length limits force you to think about batching early
- JSON parsing errors need explicit handling (try-catch, not silent failures)
- Prerendering works great for static content, but watch out with dynamic routes
- Environment variable availability differs between dev and production (Cloudflare workers)

**Future considerations:**

- As content grows, consider query pagination for blog lists
- Caching headers matter for content delivery networks
- Consider edge functions for real-time features
- Monitoring page load times catches regressions early

---

## For the Curious Developer

The site demonstrates several professional patterns:

1. **Resilient Systems** - Multiple fallbacks, graceful error handling
2. **Scalable Architecture** - Batch loading, efficient queries, proper indexing
3. **Workflow Support** - Works for both solo development and team collaboration
4. **User Experience** - Fast load times, consistent data

If you're building your own site, steal these patterns. They're battle-tested and solve real problems.

This is home. Make it yours.

---

## Continue Your Tour

**Related exhibits:**

- **[The Architecture](/src/EXHIBIT.md)** — The high-level overview
- **[The Control Room](/src/routes/admin/EXHIBIT.md)** — The admin panel CMS
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — REST API endpoints
- **[The Content Gallery](/UserContent/EXHIBIT.md)** — Where content files originate
- **[The Workshop](/src/lib/EXHIBIT.md)** — Content processing utilities
- **[The Automation Wing](/.github/EXHIBIT.md)** — How these pages get deployed

**[← Back to the Museum Entrance](/MUSEUM.md)**
