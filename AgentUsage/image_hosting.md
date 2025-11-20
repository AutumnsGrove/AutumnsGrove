# Image Hosting Guide

This project uses Cloudflare R2 for image hosting with a custom CDN domain.

## Quick Reference

**CDN Domain:** `https://cdn.autumnsgrove.com`

**Upload Command:**
```bash
./scripts/upload-image.sh <local-file> <r2-folder>
```

## Upload Workflow

### Using the Helper Script

```bash
# Blog post image
./scripts/upload-image.sh ./hero.jpg blog/my-post

# Recipe image
./scripts/upload-image.sh ~/Pictures/dish.png recipes/focaccia

# Project screenshot
./scripts/upload-image.sh ./screenshot.png projects/my-app

# Homepage/site image
./scripts/upload-image.sh ./banner.jpg site
```

The script outputs the CDN URL, Markdown syntax, and Svelte syntax for easy copying.

### Manual Upload (Wrangler CLI)

```bash
npx wrangler r2 object put autumnsgrove-images/blog/post-slug/image.jpg --file ./local-image.jpg
```

### Cloudflare Dashboard

1. Go to: Cloudflare Dashboard → R2 → `autumnsgrove-images`
2. Click "Upload" button
3. Drag and drop files or select from computer
4. Navigate to folders or create new ones

## Folder Structure

```
autumnsgrove-images/
├── blog/{post-slug}/        # Blog post images
│   ├── hero.jpg
│   └── diagram.png
├── recipes/{recipe-slug}/   # Recipe images
│   └── finished-dish.jpg
├── projects/{project-name}/ # Project screenshots
│   └── screenshot.png
└── site/                    # Homepage and general images
    ├── hero.jpg
    └── about-photo.jpg
```

## Image Reference Syntax

### In Markdown (Blog Posts, Recipes)

```markdown
![A beautiful sunset](https://cdn.autumnsgrove.com/blog/my-post/sunset.jpg)

![Finished focaccia](https://cdn.autumnsgrove.com/recipes/focaccia/finished.jpg)
```

With alt text for accessibility:
```markdown
![Screenshot showing the dashboard with three charts displaying commit activity](https://cdn.autumnsgrove.com/projects/autumnsgrove/dashboard.png)
```

### In Svelte Components

Basic usage:
```svelte
<img src="https://cdn.autumnsgrove.com/site/hero.jpg" alt="Hero image" />
```

With CSS class:
```svelte
<img
  class="hero-image"
  src="https://cdn.autumnsgrove.com/site/hero.jpg"
  alt="Welcome to Autumn's Grove"
/>
```

With loading optimization:
```svelte
<img
  src="https://cdn.autumnsgrove.com/blog/post/image.jpg"
  alt="Description"
  loading="lazy"
/>
```

## URL Format

```
https://cdn.autumnsgrove.com/{folder}/{subfolder}/{filename}
```

Examples:
- `https://cdn.autumnsgrove.com/blog/my-first-post/hero.jpg`
- `https://cdn.autumnsgrove.com/recipes/focaccia/step-3.png`
- `https://cdn.autumnsgrove.com/site/about-photo.jpg`

## Best Practices

### File Naming
- Use lowercase with hyphens: `my-image.jpg` not `My Image.jpg`
- Be descriptive: `focaccia-rising.jpg` not `IMG_1234.jpg`
- Include step numbers if sequential: `step-1-mix.jpg`, `step-2-knead.jpg`

### Image Optimization
- Resize images before uploading (max 1920px width for most uses)
- Use appropriate formats:
  - `.jpg` for photos
  - `.png` for screenshots/diagrams with text
  - `.svg` for icons/logos
- Compress images using tools like ImageOptim or Squoosh

### Organization
- Create a subfolder for each blog post/recipe/project
- Use consistent naming within projects
- Don't upload to the root - always use folders

## Troubleshooting

### Image Not Loading
1. Check if the CDN domain is active (may take a few minutes after setup)
2. Verify the path is correct (case-sensitive)
3. Check the file was uploaded: Cloudflare Dashboard → R2 → autumnsgrove-images

### 404 Error
- The R2 path is case-sensitive
- Ensure no typos in the URL
- Verify file exists in the bucket

### Permission Denied
- Make sure the bucket has a custom domain connected (not just public URL)
- Check bucket settings in Cloudflare Dashboard

## Infrastructure Details

- **R2 Bucket:** `autumnsgrove-images`
- **Wrangler Binding:** `IMAGES` (R2Bucket)
- **Custom Domain:** `cdn.autumnsgrove.com`

## Related Files

- Upload script: `scripts/upload-image.sh`
- Wrangler config: `wrangler.toml` (R2 binding on line 14-17)
- TypeScript types: `src/app.d.ts` (IMAGES binding)
