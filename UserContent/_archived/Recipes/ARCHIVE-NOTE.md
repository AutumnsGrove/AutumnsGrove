# Archived: Recipes Section

**Archived:** 2025-12-05
**Commit:** `c423634` (feat: remove recipes section entirely)
**Branch:** `claude/remove-recipes-01J4qw74eFyqH1CSUwpcB7PT`

## Why Archived

The recipes section was removed from the site to be re-added later as part of a "knowledge base" feature.

## What Was Removed

- Public routes: `/recipes`, `/recipes/[slug]`
- Admin routes: `/admin/recipes`
- Recipe functions in `src/lib/content/markdown.js`
- Recipe endpoints in `workers/sync-posts/index.js`
- GitHub Actions workflow: `.github/workflows/sync-recipes.yml`

## To Restore

1. Check out commit `c423634~1` (the commit before removal) to see the original implementation
2. Or reference the removed files in that commit's diff
3. Recipe images are archived at `static/images/_archived/recipes/`
