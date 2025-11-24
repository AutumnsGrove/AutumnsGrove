<script>
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

  // Create the new post URL with frontmatter template
  function getNewPostUrl() {
    const template = `---
title: Your Post Title
date: ${getTodayDate()}
description: A brief description of your post
tags:
  - tag1
  - tag2
---

Your content here...
`;
    return `https://github.com/AutumnsGrove/AutumnsGrove/new/main/UserContent/Posts?filename=New-Post.md&value=${encodeURIComponent(template)}`;
  }
</script>

<div class="blog-admin">
  <header class="page-header">
    <div class="header-content">
      <h1>Blog Posts</h1>
      <p class="subtitle">{data.posts.length} posts</p>
    </div>
    <a
      href={getNewPostUrl()}
      target="_blank"
      class="btn btn-primary"
    >
      + New Post
    </a>
  </header>

  <div class="posts-table-container">
    <table class="posts-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Date</th>
          <th>Tags</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.posts as post (post.slug)}
          <tr>
            <td>
              <a href="/blog/{post.slug}" target="_blank" class="post-title">
                {post.title}
              </a>
              {#if post.description}
                <p class="post-description">{post.description}</p>
              {/if}
            </td>
            <td class="date-cell">{formatDate(post.date)}</td>
            <td class="tags-cell">
              {#if post.tags.length > 0}
                <div class="tags">
                  {#each post.tags as tag (tag)}
                    <span class="tag">{tag}</span>
                  {/each}
                </div>
              {:else}
                <span class="no-tags">-</span>
              {/if}
            </td>
            <td class="actions-cell">
              <a href="/blog/{post.slug}" target="_blank" class="action-link">View</a>
              <a
                href="https://github.com/AutumnsGrove/AutumnsGrove/edit/main/UserContent/Posts/{encodeURIComponent(post.slug)}.md"
                target="_blank"
                class="action-link"
              >
                Edit
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="empty-state">
              No blog posts yet. Create your first post!
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="info-box">
    <h3>How Blog Posts Work</h3>
    <p>
      Blog posts are markdown files stored in the <code>UserContent/Posts/</code> directory.
      To add or edit posts, you can:
    </p>
    <ul>
      <li>Use the "Edit" links above to modify files directly on GitHub</li>
      <li>Clone the repo and edit files locally with your preferred editor</li>
      <li>Changes will deploy automatically when pushed to main</li>
    </ul>
  </div>
</div>

<style>
  .blog-admin {
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

  :global(.dark) .header-content h1 {
    color: var(--color-text-dark);
  }

  .subtitle {
    margin: 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .subtitle {
    color: var(--color-text-subtle-dark);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    transition: background-color 0.2s ease;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .posts-table-container {
    background: var(--mobile-menu-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }

  :global(.dark) .posts-table-container {
    background: var(--color-bg-tertiary-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .posts-table {
    width: 100%;
    border-collapse: collapse;
  }

  .posts-table th,
  .posts-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }

  :global(.dark) .posts-table th,
  :global(.dark) .posts-table td {
    border-bottom-color: var(--color-border-dark);
  }

  .posts-table th {
    background: var(--color-bg-secondary);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  :global(.dark) .posts-table th {
    background: var(--color-border-dark);
    color: var(--color-text-dark);
  }

  .post-title {
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  :global(.dark) .post-title {
    color: var(--color-primary-light);
  }

  .post-title:hover {
    text-decoration: underline;
  }

  .post-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .post-description {
    color: var(--color-text-subtle-dark);
  }

  .date-cell {
    white-space: nowrap;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .date-cell {
    color: var(--color-text-subtle-dark);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag {
    background: var(--tag-bg);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .tag:hover {
    background: var(--tag-bg-hover);
    transform: scale(1.05);
  }

  .no-tags {
    color: var(--color-text-subtle);
    transition: color 0.3s ease;
  }

  :global(.dark) .no-tags {
    color: var(--color-text-subtle-dark);
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

  :global(.dark) .action-link {
    color: var(--color-primary-light);
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

  :global(.dark) .empty-state {
    color: var(--color-text-subtle-dark);
  }

  .info-box {
    margin-top: 2rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .info-box {
    background: var(--color-bg-tertiary-dark);
    border-color: var(--color-border-dark);
  }

  .info-box h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .info-box h3 {
    color: var(--color-text-dark);
  }

  .info-box p {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .info-box p {
    color: var(--color-text-subtle-dark);
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .info-box ul {
    color: var(--color-text-subtle-dark);
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

  :global(.dark) .info-box code {
    background: var(--color-border-dark);
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .btn {
      text-align: center;
    }

    .posts-table th:nth-child(2),
    .posts-table td:nth-child(2),
    .posts-table th:nth-child(3),
    .posts-table td:nth-child(3) {
      display: none;
    }

    .posts-table th,
    .posts-table td {
      padding: 0.75rem 0.5rem;
    }

    .action-link {
      margin-right: 0.5rem;
    }
  }
</style>
