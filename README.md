# AutumnsGrove

A personal blog for sharing thoughts, projects, and articles. Built with SvelteKit and deployed to Cloudflare Pages.

**Features:** Markdown-based blogging • Static site generation • Fast performance • Clean, modern design

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:5173
```

### Build for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
AutumnsGrove/
├── src/
│   ├── routes/                 # SvelteKit routes
│   │   ├── +layout.svelte     # Main layout with navigation
│   │   ├── +page.svelte       # Homepage
│   │   └── blog/              # Blog routes
│   │       ├── +page.svelte   # Blog index (list all posts)
│   │       ├── +page.server.js
│   │       └── [slug]/        # Individual post pages
│   ├── lib/
│   │   └── utils/
│   │       └── markdown.js    # Markdown parser utilities
│   └── app.html               # HTML template
├── posts/                      # Markdown blog posts
│   ├── welcome-to-my-blog.md
│   ├── building-with-sveltekit.md
│   └── the-power-of-simplicity.md
├── ClaudeUsage/                # Development guides
├── svelte.config.js            # SvelteKit + Cloudflare config
├── vite.config.js              # Vite build config
└── package.json
```

---

## ✍️ Writing Blog Posts

Create new blog posts by adding Markdown files to the `posts/` directory:

### Post Format

```markdown
---
title: "Your Post Title"
date: "2025-01-25"
tags: ["tag1", "tag2", "tag3"]
description: "A short description of your post"
---

# Your Post Title

Your content here...
```

### Frontmatter Fields

- **title** (required) - The post title
- **date** (required) - Publication date in YYYY-MM-DD format
- **tags** (optional) - Array of tags for categorization
- **description** (optional) - Short description for previews

### How It Works

1. Add a `.md` file to the `posts/` directory
2. The blog automatically discovers and parses it
3. Posts appear on `/blog` sorted by date (newest first)
4. Individual posts are accessible at `/blog/[filename]`
5. All pages are pre-rendered as static HTML at build time

---

## 🚀 Deployment to Cloudflare Pages

### Prerequisites
- GitHub account
- Cloudflare account (free tier works)
- This repository pushed to GitHub

### Deploy Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub repository

3. **Configure Build Settings**
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
   - **Root directory:** `/` (leave empty)

4. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live in minutes!

### Custom Domain (Optional)

After deployment, you can add a custom domain:
- Go to your Pages project
- Click "Custom domains"
- Follow the DNS configuration steps

---

## 🛠️ Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** - Web framework
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Marked](https://marked.js.org/)** - Markdown parser
- **[Gray Matter](https://github.com/jonschlinkert/gray-matter)** - Frontmatter parser
- **[@sveltejs/adapter-cloudflare](https://kit.svelte.dev/docs/adapter-cloudflare)** - Cloudflare Pages adapter

---

## 🎨 Customization

### Styling
All styles are scoped within Svelte components. Main styling is in:
- `src/routes/+layout.svelte` - Global styles and layout
- `src/routes/+page.svelte` - Homepage styles
- `src/routes/blog/+page.svelte` - Blog index styles
- `src/routes/blog/[slug]/+page.svelte` - Individual post styles

### Navigation
Update the navigation in `src/routes/+layout.svelte`:
```svelte
<nav>
  <a href="/">Home</a>
  <a href="/blog">Blog</a>
  <!-- Add more links here -->
</nav>
```

### Homepage
Edit `src/routes/+page.svelte` to customize the homepage content and design.

---

## 📚 Development Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## 🤝 Working with Claude Code

This project includes Claude Code instructions in `CLAUDE.md`. Key features:

- Automatic context loading
- Git commit standards (conventional commits)
- Pre-commit hooks for code quality
- Comprehensive development guides in `ClaudeUsage/`

### Example Commands
```bash
# Ask Claude to add a new feature
"Add an RSS feed for the blog"

# Ask Claude to create a new post
"Create a blog post about learning SvelteKit"

# Ask Claude to update styling
"Make the blog cards have a hover effect"
```

---

## 📝 License

TBD

---

**Last updated:** 2025-11-04
**Built with:** SvelteKit + Claude Code CLI
