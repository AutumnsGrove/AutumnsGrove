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
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .page-header h1 {
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

  .settings-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .settings-section {
    background: var(--color-bg-tertiary-dark);
  }

  .settings-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .settings-section h2 {
    color: var(--color-text-dark);
  }

  .section-description {
    margin: 0 0 1rem 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .section-description {
    color: var(--color-text-subtle-dark);
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
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .health-label {
    color: var(--color-text-subtle-dark);
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
    color: var(--color-text-subtle);
    transition: color 0.3s ease;
  }

  :global(.dark) .health-value.loading {
    color: var(--color-text-subtle-dark);
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius-button);
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-border);
  }

  :global(.dark) .btn-secondary {
    background: var(--color-bg-secondary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  :global(.dark) .btn-secondary:hover:not(:disabled) {
    background: var(--color-border-dark);
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
    border-radius: var(--border-radius-button);
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
    color: var(--color-text-subtle);
    transition: color 0.3s ease;
  }

  :global(.dark) .note {
    color: var(--color-text-subtle-dark);
  }

  .note code {
    background: var(--color-bg-secondary);
    padding: 0.125rem 0.25rem;
    border-radius: var(--border-radius-small);
    font-size: 0.85em;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .note code {
    background: var(--color-bg-secondary-dark);
  }

  .env-info {
    display: grid;
    gap: 0.75rem;
  }

  .env-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }

  :global(.dark) .env-item {
    border-color: var(--color-border-dark);
  }

  .env-item:last-child {
    border-bottom: none;
  }

  .env-label {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .env-label {
    color: var(--color-text-subtle-dark);
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
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }

  :global(.dark) .links-list li {
    border-color: var(--color-border-dark);
  }

  .links-list li:last-child {
    border-bottom: none;
  }

  .links-list a {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .links-list a {
    color: var(--color-primary-light);
  }

  .links-list a:hover {
    text-decoration: underline;
  }
</style>
