<script>
  import { Card, Button, Skeleton, toast } from "$lib/components/ui";

  let stats = $state(null);
  let loading = $state(true);
  let error = $state('');

  async function fetchStats() {
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/git/stats/AutumnsGrove');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      stats = await res.json();
    } catch (err) {
      toast.error('Failed to load analytics data');
      console.error('Failed to fetch stats:', err);
      error = err.message;
    }

    loading = false;
  }

  $effect(() => {
    fetchStats();
  });
</script>

<div class="analytics">
  <header class="page-header">
    <div class="header-content">
      <h1>Analytics</h1>
      <p class="subtitle">GitHub activity and site statistics</p>
    </div>
    <a href="/dashboard" target="_blank" class="btn btn-secondary">
      View Full Dashboard
    </a>
  </header>

  {#if loading}
    <div class="stats-grid">
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>
  {:else if error}
    <div class="error-state">
      <h3>Failed to load analytics</h3>
      <p>{error}</p>
      <Button onclick={fetchStats} variant="secondary">Retry</Button>
    </div>
  {:else if stats}
    <div class="stats-grid">
      <Card title="Total Commits (30 days)" class="large">
        <p class="stat-value">{stats.totalCommits || 0}</p>
      </Card>

      <Card title="Public Repos">
        <p class="stat-value">{stats.publicRepos || 0}</p>
      </Card>

      <Card title="Followers">
        <p class="stat-value">{stats.followers || 0}</p>
      </Card>

      <Card title="Following">
        <p class="stat-value">{stats.following || 0}</p>
      </Card>
    </div>

    {#if stats.topRepos && stats.topRepos.length > 0}
      <section class="section">
        <h2>Top Repositories</h2>
        <div class="repos-list">
          {#each stats.topRepos.slice(0, 5) as repo, index (index)}
            <div class="repo-item">
              <div class="repo-info">
                <a href={repo.url} target="_blank" class="repo-name">
                  {repo.name}
                </a>
                {#if repo.description}
                  <p class="repo-description">{repo.description}</p>
                {/if}
              </div>
              <div class="repo-stats">
                <span class="repo-stat">
                  &#x2B50; {repo.stars || 0}
                </span>
                <span class="repo-stat">
                  &#x1F374; {repo.forks || 0}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if stats.recentCommits && stats.recentCommits.length > 0}
      <section class="section">
        <h2>Recent Commits</h2>
        <div class="commits-list">
          {#each stats.recentCommits.slice(0, 10) as commit, index (index)}
            <div class="commit-item">
              <div class="commit-info">
                <p class="commit-message">{commit.message}</p>
                <p class="commit-meta">
                  <a href={commit.repoUrl} target="_blank">{commit.repo}</a>
                  &middot;
                  {new Date(commit.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}

  <section class="section info">
    <h2>About Analytics</h2>
    <p>
      This page shows your GitHub activity statistics. For more detailed charts
      including commit heatmaps, activity by hour/day, and full commit history,
      visit the <a href="/dashboard" target="_blank">full dashboard</a>.
    </p>
    <p>
      Statistics are cached for 1 hour. You can refresh the cache from the
      <a href="/admin/settings">Settings</a> page.
    </p>
  </section>
</div>

<style>
  .analytics {
    max-width: 1000px;
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
  .loading-state,
  .error-state {
    background: var(--mobile-menu-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 3rem;
    text-align: center;
    transition: background-color 0.3s ease;
  }
  .error-state h3 {
    margin: 0 0 0.5rem 0;
    color: #d73a49;
  }
  .error-state p {
    margin: 0 0 1rem 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .stats-grid :global(.large) {
    grid-column: 1 / -1;
  }
  @media (min-width: 600px) {
    .stats-grid :global(.large) {
      grid-column: span 1;
    }
  }
  .stat-value {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
  .section {
    background: var(--mobile-menu-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: background-color 0.3s ease;
  }
  .section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
  .section.info {
    background: var(--color-bg-secondary);
    box-shadow: none;
    border: 1px solid var(--color-border);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .section.info p {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .section.info p:last-child {
    margin-bottom: 0;
  }
  .section.info a {
    color: var(--color-primary);
    transition: color 0.3s ease;
  }
  .repos-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .repo-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .repo-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .repo-name {
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .repo-name:hover {
    text-decoration: underline;
  }
  .repo-description {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .repo-stats {
    display: flex;
    gap: 1rem;
  }
  .repo-stat {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .commits-list {
    display: flex;
    flex-direction: column;
  }
  .commit-item {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .commit-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .commit-message {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
  .commit-meta {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }
  .commit-meta a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .commit-meta a:hover {
    text-decoration: underline;
  }
</style>
