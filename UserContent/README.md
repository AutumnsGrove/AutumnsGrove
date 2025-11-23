# UserContent Guide

This folder contains all the content for your AutumnsGrove website. Each subfolder represents a different section of the site.

## Directory Structure

```
UserContent/
├── Home/           # Homepage content
├── Posts/          # Blog posts
├── Recipes/        # Recipe pages
├── About/          # About page
├── Contact/        # Contact page
└── README.md       # This file
```

## How It Works

Each page on the site corresponds to a markdown file in one of these folders. When you want to add or edit content, you simply edit the markdown file and the site rebuilds automatically.

### Creating Content

1. **Add a markdown file** to the appropriate folder
2. **Add frontmatter** at the top (see examples below)
3. **Write your content** in markdown
4. **Push to GitHub** - the site rebuilds automatically

---

## Folder-Specific Guides

### Home (`Home/`)

The homepage uses `home.md` with special frontmatter for the hero section and galleries.

**Example:**
```yaml
---
title: "AutumnsGrove - Home"
description: "Your site description"
hero:
  title: "Welcome to AutumnsGrove"
  subtitle: "A space for thoughts, projects, and ideas."
  cta:
    text: "Read the Blog"
    link: "/blog"
galleries:
  - title: "Gallery Title"
    images:
      - url: "https://cdn.example.com/image.jpg"
        alt: "Image description"
        caption: "Image caption"
---

## About This Space

Your intro content here...
```

### Posts (`Posts/`)

Blog posts are standard markdown files with frontmatter.

**Example:**
```yaml
---
title: "My Blog Post Title"
date: 2025-01-15
tags: [tag1, tag2]
description: "A brief description of the post"
---

Your post content here...
```

### Recipes (`Recipes/`)

Recipes work like posts but can also have step icons via a `recipe.json` file in the gutter folder.

**Example:**
```yaml
---
title: "Recipe Name"
date: 2025-01-15
tags: [bread, easy]
description: "Recipe description"
---

## Overview
Total Time: 45 minutes
...
```

### About (`About/`)

The about page uses `about.md` with standard frontmatter.

### Contact (`Contact/`)

The contact page uses `contact.md` with standard frontmatter.

---

## The Gutter System

The "gutter" is a sidebar that appears next to your content. It can contain comments, images, galleries, and more. This is what makes your content rich and interactive.

### How Gutter Works

For any markdown file named `MyContent.md`, you can create a gutter folder:

```
MyContent.md
MyContent/
└── gutter/
    ├── manifest.json    # Required: defines gutter items
    ├── note.md          # Optional: markdown content
    └── photo.jpg        # Optional: images
```

### The Manifest File

The `manifest.json` file defines what appears in the gutter and where:

```json
{
  "items": [
    {
      "type": "comment",
      "file": "note.md",
      "anchor": "## Section Title"
    },
    {
      "type": "photo",
      "file": "https://cdn.example.com/image.jpg",
      "anchor": "paragraph:1",
      "caption": "Photo caption"
    }
  ]
}
```

### Gutter Item Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `comment` | Markdown content | `file`, `anchor` |
| `photo` | Single image | `file` (or URL), `anchor`, `caption` |
| `gallery` | Multiple images | `images`, `anchor` |
| `emoji` | Small icon | `url` or `file`, `anchor` |

### Anchor Types

Anchors determine where the gutter item appears relative to your content:

1. **Header anchor**: `"## Section Title"` - appears next to that header
2. **Paragraph anchor**: `"paragraph:3"` - appears next to the 3rd paragraph
3. **Tag anchor**: `"anchor:myname"` - appears next to `<!-- anchor:myname -->` in your markdown

### Complete Gutter Example

**Post file: `Posts/My Post.md`**
```markdown
---
title: "My Post"
date: 2025-01-15
---

Welcome to my post!

<!-- anchor:important-note -->

## Main Section

This is the main content...
```

**Gutter manifest: `Posts/My Post/gutter/manifest.json`**
```json
{
  "items": [
    {
      "type": "comment",
      "file": "welcome.md",
      "anchor": "paragraph:1"
    },
    {
      "type": "photo",
      "file": "https://cdn.example.com/photo.jpg",
      "anchor": "anchor:important-note",
      "caption": "Relevant photo"
    },
    {
      "type": "comment",
      "file": "section-note.md",
      "anchor": "## Main Section"
    }
  ]
}
```

**Gutter comment: `Posts/My Post/gutter/welcome.md`**
```markdown
Hi! Thanks for reading.
```

---

## Recipe-Specific: Step Icons

Recipes can have instruction icons that appear next to each step. This uses a `recipe.json` file in the gutter folder.

### Recipe Metadata

**File: `Recipes/My Recipe/gutter/recipe.json`**
```json
{
  "theme": "Italian bread",
  "cuisine": "Italian",
  "icons_used": ["mix", "bake", "serve"],
  "steps": [
    {
      "step": 1,
      "icons": ["mix"],
      "text": "Mix the ingredients..."
    },
    {
      "step": 2,
      "icons": ["bake"],
      "text": "Bake at 450°..."
    }
  ]
}
```

### Available Icons

Icons are stored in `/static/icons/instruction/` and include:
- `mix` - mixing/stirring
- `bake` - oven baking
- `stovetop` - stovetop cooking
- `chop` - cutting/chopping
- `marinate` - resting/rising
- `serve` - plating/serving

---

## Quick Reference

### Adding a New Blog Post

1. Create `Posts/My New Post.md`
2. Add frontmatter with title, date, tags, description
3. Write content
4. (Optional) Create `Posts/My New Post/gutter/manifest.json` for sidebar content

### Adding a New Recipe

1. Create `Recipes/My Recipe.md`
2. Add frontmatter with title, date, tags, description
3. Write recipe content with `## Step N:` headers
4. Create `Recipes/My Recipe/gutter/recipe.json` for step icons
5. (Optional) Add `manifest.json` for gutter comments

### Adding Gutter Content to Existing Page

1. Create folder matching the markdown filename (without .md)
2. Create `gutter/` subfolder
3. Create `manifest.json` with items array
4. Add referenced markdown or image files

---

## Tips

- **Keep filenames simple** - avoid special characters
- **Use descriptive anchors** - makes content easier to maintain
- **Test locally** - run `npm run dev` to preview changes
- **Images on CDN** - for best performance, host images on the CDN
- **Gutter is optional** - pages work fine without gutter content

---

*Last updated: November 2025*
