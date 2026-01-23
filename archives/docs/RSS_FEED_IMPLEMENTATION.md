# RSS Feed Implementation Guide

> **Status:** Research Complete - Ready for Implementation
> **Last Updated:** November 21, 2025

---

## Overview

This document contains research findings and implementation instructions for adding RSS feed support to AutumnsGrove. The feed will syndicate blog posts to RSS readers and aggregators.

---

## Research Findings

### Current Architecture Assessment

The existing codebase is **well-suited for RSS implementation**:

| Component | Status | Details |
|-----------|--------|---------|
| Structured metadata | Ready | YAML frontmatter with title, date, description, tags |
| Content loading | Ready | `getAllPosts()` function returns all posts |
| API infrastructure | Ready | Existing `/api/` routes pattern |
| Caching | Ready | KV namespace available |
| Static generation | Ready | Pre-rendering enabled |

### Blog Post Structure

**Location:** `/posts/*.md`

**Current Posts:**
- `First Post.md`
- `Demo Post.md`

**Frontmatter Format:**
```yaml
---
title: Demo Post
date: 2025-11-20
description: A demo post showing off the gutter features
tags:
  - demo
  - test
---
```

**Available Fields:**
- `title` (required) - Post title
- `date` (required) - Publication date (YYYY-MM-DD)
- `description` (optional) - Short preview text
- `tags` (optional) - Array of topic tags

### Key Utility Functions

**File:** `src/lib/utils/markdown.js`

```javascript
// Returns array of all posts with metadata
export function getAllPosts()

// Returns single post with full content
export function getPostBySlug(slug)

// Extracts headers for table of contents
export function extractHeaders(markdown)
```

### URL Structure

- Blog index: `https://autumnsgrove.com/blog`
- Individual posts: `https://autumnsgrove.com/blog/[slug]`
- Examples:
  - `https://autumnsgrove.com/blog/First Post`
  - `https://autumnsgrove.com/blog/Demo Post`

---

## Implementation Guide for Claude Code

### Task Summary

Create an RSS 2.0 feed endpoint that serves blog posts in XML format.

### Files to Create

#### 1. RSS Feed Endpoint

**Create:** `src/routes/api/feed/+server.js`

```javascript
import { getAllPosts } from '$lib/utils/markdown.js';

export const prerender = true;

export async function GET() {
    const posts = getAllPosts();

    // Sort by date descending
    const sortedPosts = posts.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    const siteUrl = 'https://autumnsgrove.com';
    const feedTitle = 'AutumnsGrove Blog';
    const feedDescription = 'A personal website for blogging, demonstrating projects, and sharing articles';
    const feedAuthor = 'Autumn';

    const items = sortedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${encodeURIComponent(post.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${encodeURIComponent(post.slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description || ''}]]></description>
      ${post.tags ? post.tags.map(tag => `<category>${tag}</category>`).join('\n      ') : ''}
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${siteUrl}</link>
    <description>${feedDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed" rel="self" type="application/rss+xml"/>
    <managingEditor>autumnbrown23@pm.me (${feedAuthor})</managingEditor>
    <webMaster>autumnbrown23@pm.me (${feedAuthor})</webMaster>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml',
            'Cache-Control': 'max-age=3600'
        }
    });
}
```

### Files to Modify

#### 2. Add RSS Link to HTML Head

**Edit:** `src/routes/+layout.svelte`

Add to the `<svelte:head>` section:

```svelte
<link rel="alternate" type="application/rss+xml" title="AutumnsGrove Blog" href="/api/feed" />
```

### Implementation Steps

1. **Create the feed endpoint**
   - Create directory: `src/routes/api/feed/`
   - Create file: `src/routes/api/feed/+server.js`
   - Implement RSS 2.0 XML generation

2. **Add RSS autodiscovery link**
   - Edit `src/routes/+layout.svelte`
   - Add `<link rel="alternate">` tag in head

3. **Test locally**
   ```bash
   npm run dev
   # Visit http://localhost:5173/api/feed
   ```

4. **Validate feed**
   - Use https://validator.w3.org/feed/ to validate
   - Test in RSS reader (Feedly, NetNewsWire, etc.)

5. **Optional enhancements**
   - Add full post content in `<content:encoded>` tag
   - Add KV caching for production
   - Create alternate feed URL at `/rss.xml`

### Site Metadata Reference

Use these values in the feed:

```javascript
const siteConfig = {
    title: 'AutumnsGrove',
    url: 'https://autumnsgrove.com',
    description: 'A personal website for blogging, demonstrating projects, and sharing articles',
    author: 'Autumn',
    email: 'autumnbrown23@pm.me',
    language: 'en-us'
};
```

### Testing Checklist

- [ ] Feed accessible at `/api/feed`
- [ ] Valid RSS 2.0 XML structure
- [ ] Posts sorted by date (newest first)
- [ ] Proper encoding of special characters (CDATA)
- [ ] Valid URLs for post links
- [ ] RSS autodiscovery link in HTML head
- [ ] Feed validates at W3C validator
- [ ] Works in at least one RSS reader

### Optional Enhancements

#### Full Content in Feed

Add full HTML content using the `content:encoded` namespace:

```javascript
// Add namespace to <rss> tag
xmlns:content="http://purl.org/rss/1.0/modules/content/"

// Add to each item
<content:encoded><![CDATA[${post.htmlContent}]]></content:encoded>
```

#### Alternative Feed URLs

Create a redirect from `/rss.xml` to `/api/feed`:

**Create:** `src/routes/rss.xml/+server.js`

```javascript
import { redirect } from '@sveltejs/kit';

export function GET() {
    throw redirect(301, '/api/feed');
}
```

#### KV Caching (Production)

```javascript
export async function GET({ platform }) {
    const cacheKey = 'rss-feed';

    // Check cache
    const cached = await platform.env.CACHE_KV.get(cacheKey);
    if (cached) {
        return new Response(cached, {
            headers: { 'Content-Type': 'application/rss+xml' }
        });
    }

    // Generate feed...
    const xml = generateFeed();

    // Cache for 1 hour
    await platform.env.CACHE_KV.put(cacheKey, xml, { expirationTtl: 3600 });

    return new Response(xml, {
        headers: { 'Content-Type': 'application/rss+xml' }
    });
}
```

---

## Dependencies

**No new dependencies required!**

RSS XML can be generated with template literals. If cleaner generation is preferred, consider:

```bash
npm install feed
```

The `feed` package provides a structured API for generating RSS/Atom feeds.

---

## References

- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [W3C Feed Validator](https://validator.w3.org/feed/)
- [SvelteKit Server Routes](https://kit.svelte.dev/docs/routing#server)
- Current markdown utilities: `src/lib/utils/markdown.js`

---

## Notes

- Feed will be pre-rendered at build time (`prerender = true`)
- URL encoding needed for slugs with spaces (e.g., "First Post" → "First%20Post")
- Consider adding a "Subscribe via RSS" link to the blog page UI

---

*Document created: November 21, 2025*
