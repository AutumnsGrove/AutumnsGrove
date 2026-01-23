# Recipes D1 Integration - Standalone Plan

**Status:** Ready for independent execution
**Context:** This mirrors the blog posts D1 integration but adds a URL field for recipes.

---

## Overview

Migrate recipes from local filesystem (`UserContent/Recipes/`) to D1 database, using the same Cloudflare Worker pattern as blog posts.

**Key Difference from Blog Posts:** Recipes include a `url` field for external recipe sources/references.

---

## Architecture

```
GitHub (UserContent/Recipes/)
  ↓ (on push)
GitHub Actions Workflow
  ↓ (processes markdown)
Cloudflare Worker (/sync endpoint)
  ↓ (stores in D1)
D1 Database (recipes table)
  ↓ (fetches from)
Admin Panel (/admin/recipes)
```

---

## Implementation Steps

### Step 1: Update D1 Schema

**File:** `workers/sync-posts/schema.sql`

**Add recipes table:**
```sql
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT,
  description TEXT,
  content TEXT NOT NULL,
  url TEXT,  -- NEW: External recipe URL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_date ON recipes(date DESC);
```

**Run migration:**
```bash
cd workers/sync-posts
wrangler d1 execute autumnsgrove-git-stats --file=schema.sql
```

---

### Step 2: Update Worker to Handle Recipes

**File:** `workers/sync-posts/index.js`

**Add recipe sync endpoint (similar to posts):**

```javascript
// Add after POST /sync endpoint (around line 100)
app.post('/sync-recipes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.SYNC_API_KEY}`) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { recipes } = await c.req.json();
    if (!Array.isArray(recipes)) {
      return c.json({ success: false, error: 'Invalid recipes array' }, 400);
    }

    const db = c.env.DB;

    // Clear existing recipes
    await db.prepare('DELETE FROM recipes').run();

    // Insert new recipes
    const stmt = db.prepare(`
      INSERT INTO recipes (slug, title, date, tags, description, content, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const results = [];
    for (const recipe of recipes) {
      try {
        const result = await stmt.bind(
          recipe.slug,
          recipe.title,
          recipe.date,
          JSON.stringify(recipe.tags || []),
          recipe.description || '',
          recipe.content,
          recipe.url || null  // NEW field
        ).run();
        results.push({ slug: recipe.slug, success: true });
      } catch (error) {
        console.error(`Error inserting recipe ${recipe.slug}:`, error);
        results.push({ slug: recipe.slug, success: false, error: error.message });
      }
    }

    return c.json({
      success: true,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error syncing recipes:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add GET /recipes endpoint (around line 150)
app.get('/recipes', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db
      .prepare('SELECT slug, title, date, tags, description, url FROM recipes ORDER BY date DESC')
      .all();

    // Parse tags JSON
    const recipes = results.map(recipe => ({
      ...recipe,
      tags: JSON.parse(recipe.tags || '[]')
    }));

    return c.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add GET /recipes/:slug endpoint (around line 170)
app.get('/recipes/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = c.env.DB;

    const recipe = await db
      .prepare('SELECT * FROM recipes WHERE slug = ?')
      .bind(slug)
      .first();

    if (!recipe) {
      return c.json({ success: false, error: 'Recipe not found' }, 404);
    }

    // Parse tags JSON
    recipe.tags = JSON.parse(recipe.tags || '[]');

    return c.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
```

**Deploy worker:**
```bash
cd workers/sync-posts
wrangler deploy
```

---

### Step 3: Create GitHub Actions Workflow

**File:** `.github/workflows/sync-recipes.yml`

```yaml
name: Sync Recipes to D1

on:
  push:
    branches:
      - main
    paths:
      - 'UserContent/Recipes/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Process Recipes
        id: process
        run: |
          node -e "
          const fs = require('fs');
          const path = require('path');

          const recipesDir = 'UserContent/Recipes';
          const recipes = [];

          // Read all .md files in Recipes directory
          const files = fs.readdirSync(recipesDir)
            .filter(f => f.endsWith('.md'));

          for (const file of files) {
            const filePath = path.join(recipesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = {};
            frontmatterMatch[1].split('\n').forEach(line => {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length) {
                const value = valueParts.join(':').trim();
                frontmatter[key.trim()] = value.replace(/^['\"]|['\"]$/g, '');
              }
            });

            // Parse tags if present
            let tags = [];
            if (frontmatter.tags) {
              tags = frontmatter.tags
                .replace(/[\[\]]/g, '')
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);
            }

            const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
            const recipeContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');

            recipes.push({
              slug,
              title: frontmatter.title || file.replace('.md', ''),
              date: frontmatter.date || new Date().toISOString().split('T')[0],
              tags,
              description: frontmatter.description || '',
              content: recipeContent,
              url: frontmatter.url || null  // NEW: Extract URL from frontmatter
            });
          }

          // Write to file
          fs.writeFileSync('recipes-processed.json', JSON.stringify({ recipes }, null, 2));
          console.log(\`Processed \${recipes.length} recipes\`);
          "

      - name: Sync to Cloudflare Worker
        run: |
          curl -X POST https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev/sync-recipes \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_SYNC_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d @recipes-processed.json
```

---

### Step 4: Update Admin Recipes Page

**File:** `src/routes/admin/recipes/+page.server.js`

**Replace filesystem approach with D1:**

```javascript
export const prerender = false;

const WORKER_URL = 'https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev';

export async function load() {
  try {
    const response = await fetch(`${WORKER_URL}/recipes`);
    if (!response.ok) {
      console.error('Failed to fetch recipes from worker:', response.statusText);
      return { recipes: [] };
    }

    // Worker API returns an array directly (same as blog posts)
    const recipesArray = await response.json();

    // Transform recipes
    const recipes = recipesArray.map(recipe => ({
      slug: recipe.slug,
      title: recipe.title,
      date: recipe.date,
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      description: recipe.description || '',
      url: recipe.url || null,  // NEW: Include URL field
    }));

    return { recipes };
  } catch (error) {
    console.error('Error fetching recipes from worker:', error);
    return { recipes: [] };
  }
}
```

**File:** `src/routes/admin/recipes/+page.svelte`

**Update table to display URL field:**

```svelte
<!-- Around line 50, in the table -->
<thead>
  <tr>
    <th>Title</th>
    <th>Date</th>
    <th>Tags</th>
    <th>URL</th>  <!-- NEW column -->
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  {#each recipes as recipe}
    <tr>
      <td>{recipe.title}</td>
      <td>{recipe.date}</td>
      <td>
        {#if recipe.tags.length > 0}
          {recipe.tags.join(', ')}
        {:else}
          <span class="no-tags">No tags</span>
        {/if}
      </td>
      <td>
        {#if recipe.url}
          <a href={recipe.url} target="_blank" rel="noopener noreferrer">
            View Source
          </a>
        {:else}
          <span class="no-url">—</span>
        {/if}
      </td>
      <td>
        <a href={`/recipes/${recipe.slug}`} target="_blank">View</a>
        <a href={`https://github.com/yourusername/AutumnsGrove/edit/main/UserContent/Recipes/${recipe.slug}.md`}>
          Edit
        </a>
      </td>
    </tr>
  {/each}
</tbody>
```

---

### Step 5: Update Recipe Display Page (Optional)

**File:** `src/routes/recipes/[slug]/+page.svelte`

**Add URL display if recipe has external source:**

```svelte
{#if data.recipe.url}
  <div class="recipe-source">
    <p>
      Original recipe:
      <a href={data.recipe.url} target="_blank" rel="noopener noreferrer">
        View source
      </a>
    </p>
  </div>
{/if}
```

---

### Step 6: Update Recipe Markdown Frontmatter Template

**Example recipe frontmatter with URL field:**

```markdown
---
title: Amazing Focaccia Bread
date: 2025-11-20
tags: [bread, italian, baking]
description: A simple and delicious focaccia recipe
url: https://www.kingarthurbaking.com/recipes/focaccia-recipe
---

## Ingredients

...
```

---

## Testing Checklist

- [ ] D1 schema migration successful
- [ ] Worker endpoints deployed:
  - [ ] POST /sync-recipes (authenticated)
  - [ ] GET /recipes (returns array)
  - [ ] GET /recipes/:slug (returns single recipe)
- [ ] GitHub Actions workflow triggers on recipe changes
- [ ] Recipes sync successfully to D1
- [ ] Admin page displays recipes from D1
- [ ] URL field displays correctly in admin table
- [ ] External URLs open in new tab
- [ ] Recipe display page shows source link (if URL present)
- [ ] Tags parse correctly
- [ ] Edit links point to GitHub

---

## Migration Notes

**Existing Recipe:**
- `UserContent/Recipes/focaccia-recipe.md` (1 recipe currently)

**After Migration:**
1. Recipe will remain in GitHub for version control
2. GitHub Actions will sync to D1 on every push
3. Admin panel will read from D1 (faster, cached)
4. Edit workflow still goes through GitHub

**Backward Compatibility:**
- Keep `UserContent/Recipes/` directory structure
- Legacy markdown files still work
- Gradual migration path

---

## Rollback Plan

If D1 integration fails:
1. Revert `src/routes/admin/recipes/+page.server.js` to use `getAllRecipes()` from `markdown.js`
2. Disable GitHub Actions workflow
3. Recipes continue working from filesystem

---

## Future Enhancements

- Add recipe categories (breakfast, dinner, dessert)
- Add cooking time and difficulty fields
- Add ingredient list extraction
- Add nutrition information
- Add recipe ratings/favorites

---

## Files Modified Summary

1. `workers/sync-posts/schema.sql` - Add recipes table
2. `workers/sync-posts/index.js` - Add recipe endpoints
3. `.github/workflows/sync-recipes.yml` - New workflow file
4. `src/routes/admin/recipes/+page.server.js` - Fetch from D1
5. `src/routes/admin/recipes/+page.svelte` - Display URL column
6. `src/routes/recipes/[slug]/+page.svelte` - Show source link (optional)

---

**Ready to execute independently at any time.**
