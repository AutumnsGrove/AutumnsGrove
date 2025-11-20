<script>
  let clearingCache = $state(false);
  let cacheMessage = $state('');
  let healthStatus = $state(null);
  let loadingHealth = $state(true);

  async function fetchHealth() {
    loadingHealth = true;
    try {
      const res = await fetch('/api/git/health');
      healthStatus = await res.json();
    } catch (error) {
      console.error('Failed to fetch health:', error);
      healthStatus = { status: 'error', error: error.message };
    }
    loadingHealth = false;
  }

  async function clearCache() {
    if (!confirm('Are you sure you want to clear the cache? This will cause the next requests to be slower while data is refetched.')) {
      return;
    }

    clearingCache = true;
    cacheMessage = '';

    try {
      // This would need a corresponding API endpoint
      const res = await fetch('/api/admin/cache/clear', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        cacheMessage = 'Cache cleared successfully!';
      } else {
        cacheMessage = data.error || 'Failed to clear cache';
      }
    } catch (error) {
      cacheMessage = 'Error: ' + error.message;
    }

    clearingCache = false;
  }

  $effect(() => {
    fetchHealth();
  });
</script>

<div class="settings">
  <header class="page-header">
    <h1>Settings</h1>
    <p class="subtitle">Manage site configuration and maintenance</p>
  </header>

  <section class="settings-section">
    <h2>System Health</h2>
    <div class="health-grid">
      <div class="health-item">
        <span class="health-label">Overall Status</span>
        {#if loadingHealth}
          <span class="health-value loading">Checking...</span>
        {:else}
          <span class="health-value" class:healthy={healthStatus?.status === 'healthy'} class:error={healthStatus?.status !== 'healthy'}>
            {healthStatus?.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
          </span>
        {/if}
      </div>

      <div class="health-item">
        <span class="health-label">GitHub Token</span>
        {#if loadingHealth}
          <span class="health-value loading">...</span>
        {:else}
          <span class="health-value" class:healthy={healthStatus?.github_token_configured} class:error={!healthStatus?.github_token_configured}>
            {healthStatus?.github_token_configured ? 'Configured' : 'Missing'}
          </span>
        {/if}
      </div>

      <div class="health-item">
        <span class="health-label">KV Cache</span>
        {#if loadingHealth}
          <span class="health-value loading">...</span>
        {:else}
          <span class="health-value" class:healthy={healthStatus?.kv_configured} class:error={!healthStatus?.kv_configured}>
            {healthStatus?.kv_configured ? 'Connected' : 'Not Configured'}
          </span>
        {/if}
      </div>

      <div class="health-item">
        <span class="health-label">D1 Database</span>
        {#if loadingHealth}
          <span class="health-value loading">...</span>
        {:else}
          <span class="health-value" class:healthy={healthStatus?.d1_configured} class:error={!healthStatus?.d1_configured}>
            {healthStatus?.d1_configured ? 'Connected' : 'Not Configured'}
          </span>
        {/if}
      </div>

      {#if healthStatus?.timestamp}
        <div class="health-item full-width">
          <span class="health-label">Last Check</span>
          <span class="health-value">{new Date(healthStatus.timestamp).toLocaleString()}</span>
        </div>
      {/if}
    </div>

    <button onclick={fetchHealth} class="btn btn-secondary" disabled={loadingHealth}>
      {loadingHealth ? 'Checking...' : 'Refresh Status'}
    </button>
  </section>

  <section class="settings-section">
    <h2>Cache Management</h2>
    <p class="section-description">
      The site uses KV for caching API responses. Clearing the cache will cause
      data to be refetched from the source on the next request.
    </p>

    {#if cacheMessage}
      <div class="message" class:success={cacheMessage.includes('success')} class:error={!cacheMessage.includes('success')}>
        {cacheMessage}
      </div>
    {/if}

    <button onclick={clearCache} class="btn btn-danger" disabled={clearingCache}>
      {clearingCache ? 'Clearing...' : 'Clear All Cache'}
    </button>

    <p class="note">
      Note: The cache clear endpoint needs to be implemented at <code>/api/admin/cache/clear</code>
    </p>
  </section>

  <section class="settings-section">
    <h2>Environment</h2>
    <div class="env-info">
      <div class="env-item">
        <span class="env-label">Cache TTL</span>
        <span class="env-value">1 hour (3600 seconds)</span>
      </div>
      <div class="env-item">
        <span class="env-label">AI Cache TTL</span>
        <span class="env-value">6 hours (21600 seconds)</span>
      </div>
    </div>
  </section>

  <section class="settings-section">
    <h2>Links</h2>
    <ul class="links-list">
      <li>
        <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a>
      </li>
      <li>
        <a href="https://github.com/AutumnsGrove/AutumnsGrove" target="_blank">GitHub Repository</a>
      </li>
      <li>
        <a href="https://github.com/AutumnsGrove/AutumnsGrove/actions" target="_blank">GitHub Actions</a>
      </li>
    </ul>
  </section>
</div>

<style>
  .settings {
    max-width: 800px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.25rem 0;
    font-size: 2rem;
    color: #24292e;
  }

  .subtitle {
    margin: 0;
    color: #586069;
  }

  .settings-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #24292e;
  }

  .section-description {
    margin: 0 0 1rem 0;
    color: #586069;
    font-size: 0.9rem;
  }

  .health-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .health-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .health-item.full-width {
    grid-column: 1 / -1;
  }

  .health-label {
    font-size: 0.85rem;
    color: #586069;
  }

  .health-value {
    font-weight: 600;
  }

  .health-value.healthy {
    color: #28a745;
  }

  .health-value.error {
    color: #d73a49;
  }

  .health-value.loading {
    color: #6a737d;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f6f8fa;
    color: #24292e;
    border: 1px solid #e1e4e8;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e1e4e8;
  }

  .btn-danger {
    background: #d73a49;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #cb2431;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .message.success {
    background: #dcffe4;
    color: #22863a;
  }

  .message.error {
    background: #ffeef0;
    color: #d73a49;
  }

  .note {
    margin: 1rem 0 0 0;
    font-size: 0.8rem;
    color: #6a737d;
  }

  .note code {
    background: #f6f8fa;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.85em;
  }

  .env-info {
    display: grid;
    gap: 0.75rem;
  }

  .env-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e1e4e8;
  }

  .env-item:last-child {
    border-bottom: none;
  }

  .env-label {
    color: #586069;
    font-size: 0.9rem;
  }

  .env-value {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .links-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .links-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e1e4e8;
  }

  .links-list li:last-child {
    border-bottom: none;
  }

  .links-list a {
    color: #0366d6;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .links-list a:hover {
    text-decoration: underline;
  }
</style>
