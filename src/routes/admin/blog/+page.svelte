<script>
  let { data } = $props();

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="blog-admin">
  <header class="page-header">
    <div class="header-content">
      <h1>Blog Posts</h1>
      <p class="subtitle">{data.posts.length} posts</p>
    </div>
    <a
      href="https://github.com/AutumnsGrove/AutumnsGrove/new/main/posts"
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
        {#each data.posts as post}
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
                  {#each post.tags as tag}
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
                href="https://github.com/AutumnsGrove/AutumnsGrove/edit/main/posts/{post.slug}.md"
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
      Blog posts are markdown files stored in the <code>posts/</code> directory.
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
    color: #24292e;
  }

  .subtitle {
    margin: 0;
    color: #586069;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: #2ea44f;
    color: white;
  }

  .btn-primary:hover {
    background: #22863a;
  }

  .posts-table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .posts-table {
    width: 100%;
    border-collapse: collapse;
  }

  .posts-table th,
  .posts-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e1e4e8;
  }

  .posts-table th {
    background: #f6f8fa;
    font-weight: 600;
    font-size: 0.85rem;
    color: #24292e;
  }

  .post-title {
    font-weight: 500;
    color: #0366d6;
    text-decoration: none;
  }

  .post-title:hover {
    text-decoration: underline;
  }

  .post-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: #586069;
  }

  .date-cell {
    white-space: nowrap;
    color: #586069;
    font-size: 0.9rem;
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
    color: #6a737d;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .action-link {
    color: #0366d6;
    text-decoration: none;
    font-size: 0.9rem;
    margin-right: 1rem;
  }

  .action-link:hover {
    text-decoration: underline;
  }

  .empty-state {
    text-align: center;
    color: #586069;
    padding: 3rem 1rem;
  }

  .info-box {
    margin-top: 2rem;
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .info-box h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: #24292e;
  }

  .info-box p {
    margin: 0 0 0.75rem 0;
    color: #586069;
    font-size: 0.9rem;
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #586069;
    font-size: 0.9rem;
  }

  .info-box li {
    margin-bottom: 0.25rem;
  }

  .info-box code {
    background: #e1e4e8;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.85em;
  }
</style>
