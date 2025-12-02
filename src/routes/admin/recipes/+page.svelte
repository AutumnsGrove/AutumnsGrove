<script>
  import { Button, Badge } from "@autumnsgrove/grove-engine/components/ui";

  let { data } = $props();

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Generate today's date in YYYY-MM-DD format
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Create the new recipe URL with frontmatter template (includes url field)
  function getNewRecipeUrl() {
    const template = `---
title: Your Recipe Title
date: ${getTodayDate()}
description: A brief description of your recipe
url: # Optional: link to original recipe source
tags:
  - recipe
  - tag2
---

## Ingredients

- Ingredient 1
- Ingredient 2

## Instructions

1. First step
2. Second step
`;
    return `https://github.com/AutumnsGrove/AutumnsGrove/new/main/UserContent/Recipes?filename=New-Recipe.md&value=${encodeURIComponent(template)}`;
  }

  // Check if recipe has external URL
  function hasUrl(recipe) {
    return recipe.url && recipe.url.trim() !== '';
  }
</script>

<div class="recipes-admin">
  <header class="page-header">
    <div class="header-content">
      <h1>Recipes</h1>
      <p class="subtitle">{data.recipes.length} recipes</p>
    </div>
    <Button
      variant="primary"
      onclick={() => window.open(getNewRecipeUrl(), '_blank')}
    >
      + New Recipe
    </Button>
  </header>

  <div class="recipes-table-container">
    <table class="recipes-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Date</th>
          <th>Tags</th>
          <th>Source</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.recipes as recipe (recipe.slug)}
          <tr>
            <td>
              <a href="/recipes/{recipe.slug}" target="_blank" class="recipe-title">
                {recipe.title}
              </a>
              {#if recipe.description}
                <p class="recipe-description">{recipe.description}</p>
              {/if}
            </td>
            <td class="date-cell">{formatDate(recipe.date)}</td>
            <td class="tags-cell">
              {#if recipe.tags.length > 0}
                <div class="tags">
                  {#each recipe.tags as tag (tag)}
                    <Badge variant="tag">{tag}</Badge>
                  {/each}
                </div>
              {:else}
                <span class="no-tags">-</span>
              {/if}
            </td>
            <td class="url-cell">
              {#if hasUrl(recipe)}
                <a href={recipe.url} target="_blank" rel="noopener noreferrer" class="source-link">
                  View Source
                </a>
              {:else}
                <span class="no-url">Original</span>
              {/if}
            </td>
            <td class="actions-cell">
              <a href="/recipes/{recipe.slug}" target="_blank" class="action-link">View</a>
              <a
                href="https://github.com/AutumnsGrove/AutumnsGrove/edit/main/UserContent/Recipes/{encodeURIComponent(recipe.slug)}.md"
                target="_blank"
                class="action-link"
              >
                Edit
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="empty-state">
              No recipes yet. Create your first recipe!
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="info-box">
    <h3>How Recipes Work</h3>
    <p>
      Recipes are markdown files stored in the <code>UserContent/Recipes/</code> directory
      and synced to D1 database.
      {#if data.source === 'd1'}
        <span class="source-badge d1">Loading from D1</span>
      {:else}
        <span class="source-badge filesystem">Loading from filesystem</span>
      {/if}
    </p>
    <ul>
      <li>Use the "Edit" links above to modify files directly on GitHub</li>
      <li>Add a <code>url:</code> field in frontmatter to link to original recipe sources</li>
      <li>Changes sync to D1 automatically when pushed to main</li>
    </ul>
  </div>
</div>

<style>
  .recipes-admin {
    max-width: 1200px;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }
  .header-content h1 {
    margin: 0 0 0.25rem 0;
    font-size: 2rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
  .subtitle {
    margin: 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .recipes-table-container {
    background: var(--mobile-menu-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }
  :global(.dark) .recipes-table-container {
    background: var(--color-bg-tertiary-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  .recipes-table {
    width: 100%;
    border-collapse: collapse;
  }
  .recipes-table th,
  .recipes-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .recipes-table th {
    background: var(--color-bg-secondary);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  .recipe-title {
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .recipe-title:hover {
    text-decoration: underline;
  }
  .recipe-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .date-cell {
    white-space: nowrap;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .no-tags {
    color: var(--color-text-subtle);
    transition: color 0.3s ease;
  }
  .url-cell {
    white-space: nowrap;
  }
  .source-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .source-link:hover {
    text-decoration: underline;
  }
  .no-url {
    color: var(--color-text-subtle);
    font-size: 0.85rem;
    font-style: italic;
    transition: color 0.3s ease;
  }
  .actions-cell {
    white-space: nowrap;
  }
  .action-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    margin-right: 1rem;
    transition: color 0.3s ease;
  }
  .action-link:hover {
    text-decoration: underline;
  }
  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: 3rem 1rem;
    transition: color 0.3s ease;
  }
  .info-box {
    margin-top: 2rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .info-box h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
  .info-box p {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .info-box ul {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .info-box li {
    margin-bottom: 0.25rem;
  }
  .info-box code {
    background: var(--color-border);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.85em;
    transition: background-color 0.3s ease;
  }
  .source-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: 0.5rem;
  }
  .source-badge.d1 {
    background: #2c5f2d;
    color: white;
  }
  .source-badge.filesystem {
    background: #666;
    color: white;
  }
  /* Mobile styles */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    /* Hide Date, Tags, and Source columns on mobile */
    .recipes-table th:nth-child(2),
    .recipes-table td:nth-child(2),
    .recipes-table th:nth-child(3),
    .recipes-table td:nth-child(3),
    .recipes-table th:nth-child(4),
    .recipes-table td:nth-child(4) {
      display: none;
    }
    .recipes-table th,
    .recipes-table td {
      padding: 0.75rem 0.5rem;
    }
    .action-link {
      margin-right: 0.5rem;
    }
  }
</style>
