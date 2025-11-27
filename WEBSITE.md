# AutumnsGrove Website Documentation

> **Note:** This is the website/project documentation. For the profile README, see [README.md](README.md).

A personal website for blogging, sharing recipes, demonstrating projects, and visualizing GitHub activity. Built with SvelteKit 5 and deployed to Cloudflare Pages with D1 database, R2 storage, and KV caching.

**Features:**
- Markdown-based blogging with gutter annotations and table of contents
- GitHub Dashboard with activity heatmap, stats, and time filtering
- Admin panel with GitHub OAuth authentication
- Image hosting via Cloudflare R2 CDN
- GitHub-style code blocks with syntax highlighting and copy buttons
- Blog search functionality
- Photo gallery with lightbox and mood board views
- Semantic instruction icons for recipes
- Scheduled data sync via Cloudflare Workers

---

## Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# Run development server
npm run dev

# Visit http://localhost:5173
```

### Build for Production

```bash
# Build for Cloudflare Pages
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
AutumnsGrove/
├── src/
│   ├── routes/                     # SvelteKit routes
│   │   ├── +layout.svelte          # Main layout with navigation
│   │   ├── +page.svelte            # Homepage with Willow gallery
│   │   ├── blog/                   # Blog routes
│   │   │   ├── +page.svelte        # Blog index
│   │   │   ├── +page.server.js
│   │   │   └── [slug]/             # Individual posts
│   │   ├── recipes/                # Recipe routes
│   │   │   ├── +page.svelte        # Recipe index
│   │   │   ├── +page.server.js
│   │   │   └── [slug]/             # Individual recipes
│   │   ├── dashboard/              # GitHub Dashboard
│   │   │   ├── +page.svelte        # Stats visualization
│   │   │   └── Heatmap.svelte      # Activity heatmap component
│   │   ├── admin/                  # Admin panel (protected)
│   │   │   ├── +layout.svelte      # Admin layout
│   │   │   ├── +layout.server.js   # Auth guard
│   │   │   ├── +page.svelte        # Admin dashboard
│   │   │   ├── blog/               # Blog management
│   │   │   ├── images/             # Image upload (R2)
│   │   │   ├── analytics/          # Site analytics
│   │   │   └── settings/           # Site settings
│   │   ├── auth/                   # Authentication
│   │   │   ├── login/              # Login page
│   │   │   ├── callback/           # OAuth callback
│   │   │   ├── github/             # GitHub OAuth initiate
│   │   │   ├── logout/             # Logout handler
│   │   │   └── me/                 # Current user endpoint
│   │   └── api/                    # API endpoints
│   │       ├── git/                # GitHub data APIs
│   │       │   ├── stats/          # User statistics
│   │       │   ├── repos/          # Repository list
│   │       │   ├── history/        # Commit history
│   │       │   ├── activity/       # Activity feed
│   │       │   ├── contributions/  # Contribution data
│   │       │   ├── todos/          # TODO extraction
│   │       │   ├── user/           # User profile
│   │       │   ├── health/         # API health check
│   │       │   └── sync/           # Manual data sync
│   │       ├── ai/                 # AI-powered endpoints
│   │       │   └── analyze/        # Repository analysis
│   │       └── images/
│   │           └── upload/         # R2 image upload
│   ├── lib/
│   │   ├── components/             # Reusable components
│   │   │   ├── ContentWithGutter.svelte  # Layout with sidebar annotations
│   │   │   ├── GutterItem.svelte         # Individual gutter annotation
│   │   │   ├── LeftGutter.svelte         # Left sidebar container
│   │   │   ├── ImageGallery.svelte       # Multi-image gallery
│   │   │   ├── Lightbox.svelte           # Modal image viewer
│   │   │   ├── ZoomableImage.svelte      # Zoomable image component
│   │   │   ├── TableOfContents.svelte    # Auto-generated TOC
│   │   │   ├── MobileTOC.svelte          # Mobile-friendly TOC
│   │   │   ├── CollapsibleSection.svelte # Expandable sections
│   │   │   ├── LogViewer.svelte          # Admin console logging
│   │   │   ├── IconLegend.svelte         # Recipe instruction icons
│   │   │   └── index.js                  # Component exports
│   │   ├── utils/
│   │   │   ├── markdown.js         # Markdown parser
│   │   │   └── github.js           # GitHub API utilities
│   │   ├── auth/
│   │   │   ├── jwt.js              # JWT token handling
│   │   │   └── session.js          # Session management
│   │   └── db/
│   │       └── schema.sql          # D1 database schema
│   ├── hooks.server.js             # Server hooks (auth)
│   ├── app.html                    # HTML template
│   └── app.d.ts                    # TypeScript declarations
├── UserContent/                    # All user-created content
│   ├── Posts/                      # Markdown blog posts
│   │   ├── [post-name].md          # Post content
│   │   └── [post-name]/gutter/     # Gutter annotations for post
│   ├── About/                      # About page content
│   ├── Home/                       # Homepage content
│   └── Contact/                    # Contact page content
├── static/
│   ├── favicon.png
│   ├── images/                     # Local images
│   ├── icons/
│   │   └── instruction/            # EmojiKitchen WebP icons
│   └── cdn-index.html              # R2 bucket index
├── docs/                           # Project documentation
│   ├── GitDashboard/               # Dashboard research
│   ├── IDEAS.md                    # Future enhancements
│   └── *.md                        # Implementation guides
├── AgentUsage/                     # Claude Code workflow guides
├── workers/                        # Cloudflare Workers
├── scripts/                        # Utility scripts
├── AGENT.md                        # Agent instructions
├── CLAUDE.md                       # Claude Code config
├── TODOS.md                        # Current task list
├── svelte.config.js                # SvelteKit config
├── vite.config.js                  # Vite build config
├── wrangler.toml                   # Cloudflare config
└── package.json
```

---

## Writing Content

### Blog Posts

Create Markdown files in the `UserContent/Posts/` directory:

```markdown
---
title: "Your Post Title"
date: "2025-01-25"
tags: ["tag1", "tag2"]
description: "A short description"
---

# Your Post Title

Your content here...
```

**Frontmatter Fields:**
- **title** (required) - Post title
- **date** (required) - Publication date (YYYY-MM-DD)
- **tags** (optional) - Array of tags
- **description** (optional) - Short preview text

### Gutter Annotations

Posts can have sidebar annotations (gutters) for supplementary content. Create a `gutter/` folder alongside your post:

```
UserContent/Posts/
├── my-post.md
└── my-post/
    └── gutter/
        ├── manifest.json      # Defines gutter items and anchors
        ├── intro-note.md      # Markdown content for annotation
        └── diagram.svg        # Images can be included too
```

The `manifest.json` links gutter items to specific anchors in the main post content.

### Recipes

Recipes support both Markdown (`.md`) and JSON (`.json`) formats. JSON format enables semantic instruction icons with visual cues for actions like mixing, heating, and timing.

---

## Key Features

### GitHub Dashboard

Visualize your GitHub activity with:
- Contribution heatmap (similar to GitHub's)
- Repository statistics
- Commit history
- Activity feed
- AI-powered repository analysis (via Claude API)

Data is synced every 6 hours via Cloudflare Workers cron trigger and cached in D1 database.

### Admin Panel

Protected admin area with GitHub OAuth:
- Blog post management with D1 database sync
- Recipe management
- Image uploads to R2 CDN with sorting options
- Real-time system console with log streaming
- Site analytics
- Settings with Cloudflare service status

Access via `/admin` after authenticating through `/auth/login`.

### Code Blocks

GitHub-style code blocks with:
- Syntax highlighting by language
- One-click copy button
- Language label display
- Word wrapping enabled by default

### Image Hosting

Images are hosted on Cloudflare R2:
- Drag-and-drop upload in admin panel
- Automatic CDN distribution
- Direct URL access for embedding

### Photo Gallery

Multi-image gallery component with:
- Grid layout
- Lightbox viewing
- Image captions

Currently showcases Willow photos on the homepage.

---

## Cloudflare Integration

### Services Used

- **Pages** - Static site hosting with SSR support
- **D1** - SQLite database for GitHub stats history
- **R2** - Object storage for images
- **KV** - API response caching
- **Workers** - Scheduled sync jobs

### Environment Variables

Set secrets via Wrangler:

```bash
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

See `.dev.vars.example` for local development setup.

---

## Tech Stack

- **[SvelteKit 5](https://kit.svelte.dev/)** - Web framework with Svelte 5 runes
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Marked](https://marked.js.org/)** - Markdown parser
- **[Gray Matter](https://github.com/jonschlinkert/gray-matter)** - Frontmatter parser
- **[Chart.js](https://www.chartjs.org/)** - Data visualization
- **[Mermaid](https://mermaid.js.org/)** - Diagram generation
- **[@sveltejs/adapter-cloudflare](https://kit.svelte.dev/docs/adapter-cloudflare)** - Cloudflare Pages adapter

---

## Deployment

### Prerequisites
- GitHub account
- Cloudflare account (free tier works)
- Repository pushed to GitHub

### Deploy Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Pages > Create project
   - Connect your GitHub repository

3. **Configure Build Settings**
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
   - **Root directory:** `/` (leave empty)

4. **Set Up Bindings**
   - Add D1 database binding: `GIT_STATS_DB`
   - Add R2 bucket binding: `IMAGES`
   - Add KV namespace binding: `CACHE_KV`

5. **Configure Secrets**
   - Add all required secrets (see Environment Variables)

6. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live in minutes!

### Custom Domain

After deployment:
- Go to your Pages project
- Click "Custom domains"
- Follow DNS configuration steps

---

## API Endpoints

### Public Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/git/stats/[username]` | GitHub user statistics |
| `GET /api/git/repos/[username]` | Repository list |
| `GET /api/git/activity/[username]` | Activity feed |
| `GET /api/git/contributions/[username]` | Contribution data |
| `GET /api/git/history/[username]/[repo]` | Commit history |
| `GET /api/git/todos/[username]/[repo]` | TODO extraction |
| `GET /api/git/user/[username]` | User profile |
| `GET /api/git/health` | API health check |

### Protected Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/git/sync` | Trigger manual data sync |
| `POST /api/images/upload` | Upload image to R2 |
| `POST /api/ai/analyze/[username]/[repo]` | AI repository analysis |

---

## Development Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## Working with Claude Code

This project uses Claude Code for development. Key files:

- **`AGENT.md`** - Main project instructions (read this first)
- **`CLAUDE.md`** - Claude Code configuration
- **`AgentUsage/`** - Detailed workflow guides and best practices

### Example Commands

```bash
# Add a new feature
"Add dark mode toggle to the site"

# Create content
"Create a blog post about learning SvelteKit"

# Update styling
"Make the blog cards have a hover effect"

# Debug issues
"The dashboard heatmap isn't showing data correctly"
```

---

## License

This repository uses a split license approach:

- **Creative Content** (`UserContent/` directory) — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
  - Blog posts, recipes, and original media
  - Requires attribution, non-commercial use, and share-alike

- **Source Code** — [MIT License](https://opensource.org/licenses/MIT)
  - Free to use, modify, and distribute
  - A standalone engine repository is also planned

See [LICENSE](LICENSE) for full details.

---

**Last updated:** 2025-11-27
**Built with:** SvelteKit 5 + Cloudflare Pages + Claude Code
