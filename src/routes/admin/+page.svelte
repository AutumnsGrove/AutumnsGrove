<script>
  let { data } = $props();

  let healthStatus = $state(null);
  let loading = $state(true);

  async function fetchHealth() {
    loading = true;
    try {
      const res = await fetch('/api/git/health');
      healthStatus = await res.json();
    } catch (error) {
      console.error('Failed to fetch health:', error);
      healthStatus = { status: 'error', error: error.message };
    }
    loading = false;
  }

  $effect(() => {
    fetchHealth();
  });
</script>

<div class="dashboard">
  <header class="dashboard-header">
    <h1>Dashboard</h1>
    <p class="welcome">Welcome back, {data.user.username}!</p>
  </header>

  <div class="stats-grid">
    <div class="stat-card">
      <h3>System Status</h3>
      {#if loading}
        <p class="stat-value loading">Loading...</p>
      {:else if healthStatus?.status === 'healthy'}
        <p class="stat-value healthy">Healthy</p>
      {:else}
        <p class="stat-value error">Error</p>
      {/if}
    </div>

    <div class="stat-card">
      <h3>GitHub Token</h3>
      {#if loading}
        <p class="stat-value loading">...</p>
      {:else}
        <p class="stat-value" class:healthy={healthStatus?.github_token_configured} class:error={!healthStatus?.github_token_configured}>
          {healthStatus?.github_token_configured ? 'Configured' : 'Missing'}
        </p>
      {/if}
    </div>

    <div class="stat-card">
      <h3>KV Cache</h3>
      {#if loading}
        <p class="stat-value loading">...</p>
      {:else}
        <p class="stat-value" class:healthy={healthStatus?.kv_configured} class:error={!healthStatus?.kv_configured}>
          {healthStatus?.kv_configured ? 'Connected' : 'Missing'}
        </p>
      {/if}
    </div>

    <div class="stat-card">
      <h3>D1 Database</h3>
      {#if loading}
        <p class="stat-value loading">...</p>
      {:else}
        <p class="stat-value" class:healthy={healthStatus?.d1_configured} class:error={!healthStatus?.d1_configured}>
          {healthStatus?.d1_configured ? 'Connected' : 'Missing'}
        </p>
      {/if}
    </div>
  </div>

  <section class="quick-actions">
    <h2>Quick Actions</h2>
    <div class="action-grid">
      <a href="/admin/blog" class="action-card">
        <span class="action-icon">&#x1F4DD;</span>
        <span class="action-label">Manage Blog Posts</span>
      </a>
      <a href="/admin/images" class="action-card">
        <span class="action-icon">&#x1F4F7;</span>
        <span class="action-label">Upload Images</span>
      </a>
      <a href="/admin/analytics" class="action-card">
        <span class="action-icon">&#x1F4CA;</span>
        <span class="action-label">View Analytics</span>
      </a>
      <a href="/admin/settings" class="action-card">
        <span class="action-icon">&#x2699;</span>
        <span class="action-label">Settings</span>
      </a>
      <a href="/" class="action-card" target="_blank">
        <span class="action-icon">&#x1F310;</span>
        <span class="action-label">View Site</span>
      </a>
    </div>
  </section>
</div>

<style>
  .dashboard {
    max-width: 1200px;
  }

  .dashboard-header {
    margin-bottom: 2rem;
  }

  .dashboard-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #24292e;
  }

  .welcome {
    margin: 0;
    color: #586069;
    font-size: 1.1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .stat-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #586069;
    font-weight: 500;
  }

  .stat-value {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .stat-value.healthy {
    color: #28a745;
  }

  .stat-value.error {
    color: #d73a49;
  }

  .stat-value.loading {
    color: #6a737d;
  }

  .quick-actions {
    margin-top: 2rem;
  }

  .quick-actions h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #24292e;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .action-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: #24292e;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .action-icon {
    font-size: 2rem;
  }

  .action-label {
    font-weight: 500;
    text-align: center;
  }
</style>
