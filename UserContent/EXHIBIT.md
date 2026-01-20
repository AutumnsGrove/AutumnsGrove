# The Content Gallery: Where Words Begin

> *The journey of every post, page, and gutter note—from markdown file to rendered page.*

---

## What You're Looking At

This is `UserContent/`—the creative heart of AutumnsGrove. While the rest of the codebase is machinery, this is *material*. Blog posts, the about page, the contact form's words, the home page's welcome—it all starts here.

Think of this as a writer's desk. The folders are labeled. The files are markdown. When you want to say something, you write it here, and the machinery in the rest of the museum turns it into a webpage.

---

## The Directory Map

```
UserContent/
├── Home/                    # The front door
│   └── home.md             # Hero section, intro content
├── About/
│   ├── about.md            # Who you are
│   └── about/gutter/       # Sidebar content for about page
├── Contact/
│   └── contact.md          # How to reach you
├── Posts/                   # The blog archive
│   ├── my-post.md          # A blog post
│   ├── my-post/gutter/     # Sidebar content for that post
│   │   ├── manifest.json   # What appears where
│   │   └── note.md         # A margin note
│   └── ...
├── _archived/               # Content moved out of rotation
│   └── Recipes/            # Old recipe section
├── site-config.json        # Global site configuration
└── README.md               # Documentation for content creators
```

Every folder represents a section of the site. Every `.md` file is content waiting to be rendered. The `gutter/` folders hold the marginalia—the asides, images, and notes that appear alongside your writing.

---

## The Content Flow

This is the journey of your words from markdown file to browser:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         1. WRITE                                     │
│  You create `Posts/my-story.md` with frontmatter and markdown       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      2. BUILD TIME                                   │
│  import.meta.glob loads all markdown files at build                  │
│  gray-matter extracts frontmatter (title, date, tags)               │
│  marked converts markdown → HTML                                     │
│  Content is bundled into the application                             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      3. REQUEST TIME                                 │
│  Visitor requests /blog/my-story                                     │
│  +page.server.js checks D1 database first (production content)      │
│  Falls back to bundled UserContent (local/dev)                       │
│  Processes gutter content, extracts headers for TOC                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       4. RENDER                                      │
│  +page.svelte receives processed content                             │
│  Renders HTML with gutter items positioned                           │
│  Browser hydrates for interactivity                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontmatter: The Metadata Contract

Every content file starts with YAML frontmatter—a contract between you and the system:

### Blog Posts

```yaml
---
title: "My Journey with SvelteKit"
date: 2025-01-15
tags: [svelte, web-dev, learning]
description: "What I learned building my first real web application."
---

Your content here...
```

### Static Pages (Home, About, Contact)

```yaml
---
title: "About Me"
description: "Learn about who I am and what I do."
hero:
  title: "Hello, I'm Autumn"
  subtitle: "Developer, writer, tea enthusiast"
  cta:
    text: "Read the Blog"
    link: "/blog"
---

Content after the hero section...
```

The frontmatter tells the system:
- **title**: What appears in the browser tab and headings
- **date**: When it was written (for sorting)
- **tags**: Categories for filtering
- **description**: SEO and preview text
- **hero**: Special formatting for landing pages

---

## The Gutter System: Marginalia for the Web

The gutter is AutumnsGrove's signature feature—sidebar content that floats alongside your writing without interrupting it. Think of it like margin notes in a well-loved book.

### How Gutter Works

For any content file `my-post.md`, you can create a matching folder:

```
Posts/
├── my-post.md              # The main content
└── my-post/
    └── gutter/
        ├── manifest.json   # Required: defines what goes where
        ├── aside-note.md   # A margin comment
        ├── photo.jpg       # An image
        └── quote.md        # A pullquote
```

### The Manifest File

The `manifest.json` file is the conductor. It tells the system what to display and where:

```json
{
  "items": [
    {
      "type": "comment",
      "file": "aside-note.md",
      "anchor": "## Section Title"
    },
    {
      "type": "photo",
      "file": "https://cdn.autumnsgrove.com/photo.jpg",
      "anchor": "paragraph:3",
      "caption": "A moment that inspired this"
    },
    {
      "type": "markdown",
      "file": "quote.md",
      "anchor": "anchor:important-point"
    }
  ]
}
```

### Anchor Types

Anchors tell the system *where* to position each gutter item:

| Anchor Format | Meaning |
|---------------|---------|
| `"## Section Title"` | Next to that heading |
| `"paragraph:3"` | Next to the third paragraph |
| `"anchor:myname"` | Next to `<!-- anchor:myname -->` in your content |

### Gutter Item Types

| Type | What It Shows |
|------|---------------|
| `comment` or `markdown` | Rendered markdown content |
| `photo` or `image` | A single image with optional caption |
| `gallery` | Multiple images with navigation |
| `emoji` | A small icon or graphic |

The gutter content is loaded, processed, and positioned by the Workshop's content module (`src/lib/content/`).

---

## The Sync Pipeline: Local to Production

Content lives in two places:

1. **UserContent/** (in the repo) — What you write locally
2. **D1 Database** (Cloudflare) — What production serves

### How Content Gets to Production

```
┌─────────────────┐     node scripts/sync-pages.cjs     ┌─────────────────┐
│   UserContent/  │ ──────────────────────────────────► │   D1 Database   │
│   (your files)  │            --remote flag            │  (production)   │
└─────────────────┘                                     └─────────────────┘
         │                                                       │
         │                                                       │
         ▼                                                       ▼
   Build-time import                                    Runtime queries
   (local development)                                  (live site)
```

The sync script:
1. Reads all markdown files from UserContent/
2. Parses frontmatter and content
3. Hashes content to detect changes
4. Upserts into D1 database (only changed posts)
5. Preserves gutter content and metadata

### Why Both?

- **Local development**: Edit markdown, see changes instantly without database
- **Production**: Centralized database for fast edge queries
- **Fallback**: If database is down, bundled content still works

This is the same resilience pattern you see throughout AutumnsGrove—always have a fallback.

---

## Special Content Types

### The Home Page (`Home/home.md`)

The home page has extra structure for the hero section:

```yaml
---
title: "AutumnsGrove"
description: "A space for thoughts, projects, and ideas"
hero:
  title: "Welcome"
  subtitle: "You found the grove."
  cta:
    text: "Read the Blog"
    link: "/blog"
galleries:
  - title: "Recent Photos"
    images:
      - url: "https://cdn.autumnsgrove.com/image1.jpg"
        alt: "Description"
        caption: "Caption text"
---

Content below the hero...
```

### Archived Content (`_archived/`)

Content you want to keep but not serve. The underscore prefix tells the build system to ignore this folder. Old recipes, draft posts, deprecated pages—they live here until you decide what to do with them.

---

## Working with Content

### Adding a New Blog Post

1. Create `Posts/my-new-post.md`
2. Add frontmatter (title, date, tags, description)
3. Write your content in markdown
4. (Optional) Create `Posts/my-new-post/gutter/manifest.json` for sidebar content
5. Run locally to preview: `pnpm dev`
6. Sync to production: `node scripts/sync-pages.cjs --remote`

### Editing a Static Page

1. Find the file: `About/about.md`, `Contact/contact.md`, etc.
2. Edit the frontmatter or content
3. Preview locally
4. Sync to production

### Adding Gutter Content to Existing Post

1. Create folder matching the post filename (without .md)
2. Create `gutter/` subfolder inside
3. Create `manifest.json` defining items
4. Add referenced markdown or image files
5. Sync and deploy

---

## The Philosophy

UserContent/ exists because content and code should be separate.

Your words aren't configuration. They're not "data" to be managed through an admin panel (though you can do that too via the Control Room). They're *files*—version-controlled, diffable, portable. You can:

- Edit with your favorite text editor
- Track changes in git
- Review diffs before publishing
- Roll back mistakes
- Work offline

This is intentional. The gutter system, the frontmatter, the folder structure—it's all designed to let you write like a writer while the machinery handles the rest.

---

## Connections

**Where content goes after leaving here:**

- **[The Workshop](/src/lib/EXHIBIT.md)** — `markdown.js` parses your files and processes gutter content
- **[The Visitor Experience](/src/routes/EXHIBIT.md)** — Routes load and render your content
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — API endpoints serve content to the admin panel
- **[Edge Computing](/workers/EXHIBIT.md)** — The sync worker pushes content to production

**What content relies on:**

- **[The Foundation](/migrations/EXHIBIT.md)** — Database schema where synced content lives
- **[The Control Room](/src/routes/admin/EXHIBIT.md)** — Alternative way to edit content via CMS

---

## Lessons Learned

1. **Markdown is portable.** These files work on any system, with any editor. No vendor lock-in.

2. **Gutter content is additive.** Posts work fine without it. The sidebar is enhancement, not requirement.

3. **Frontmatter is your API.** Consistent structure means predictable behavior. The system trusts that contract.

4. **Two sources, one truth.** Local development uses files. Production uses database. The sync script keeps them aligned.

5. **Archive, don't delete.** The `_archived/` folder is a safety net. Old content might become relevant again.

---

## Where to Go Next

- **[Back to the Museum Entrance](/MUSEUM.md)** — Overview of all exhibits
- **[The Workshop](/src/lib/EXHIBIT.md)** — See how content gets processed
- **[The Visitor Experience](/src/routes/EXHIBIT.md)** — See how content gets rendered
- **[The Architecture](/src/EXHIBIT.md)** — The big picture

---

*This is where every post begins. A file. A folder. Words waiting to become pages.*
