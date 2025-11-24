<script>
  import LogViewer from '$lib/components/LogViewer.svelte';

  let activeTab = $state('all');

  const tabs = [
    { id: 'all', label: 'All Logs', icon: '📋', description: 'All logs across all categories' },
    { id: 'api', label: 'API Activity', icon: '🌐', description: 'API requests and responses' },
    { id: 'github', label: 'GitHub', icon: '🐙', description: 'GitHub API calls and rate limits' },
    { id: 'errors', label: 'Errors', icon: '❌', description: 'Errors and exceptions' },
    { id: 'cache', label: 'Cache', icon: '💾', description: 'KV cache operations' }
  ];
</script>

<div class="logs-page">
  <header class="logs-header">
    <h1>🖥️ System Console</h1>
    <p>Real-time logs and system activity monitoring</p>
  </header>

  <div class="tabs">
    {#each tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        onclick={() => activeTab = tab.id}
        title={tab.description}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </div>

  <div class="log-viewer-container">
    <LogViewer category={activeTab} />
  </div>

  <div class="help-section">
    <details>
      <summary>ℹ️ How to use the console</summary>
      <div class="help-content">
        <h4>Features:</h4>
        <ul>
          <li><strong>Real-time streaming:</strong> Logs update live as events occur</li>
          <li><strong>Search:</strong> Filter logs by keyword</li>
          <li><strong>Auto-scroll:</strong> Automatically scroll to newest logs (can be disabled)</li>
          <li><strong>Copy:</strong> Click the 📋 icon to copy any log entry</li>
          <li><strong>Metadata:</strong> Expand details to see full log context</li>
        </ul>

        <h4>Log Categories:</h4>
        <ul>
          <li><strong>🌐 API Activity:</strong> All API endpoint calls with timing and status codes</li>
          <li><strong>🐙 GitHub:</strong> GitHub API operations, rate limits, and remaining quota</li>
          <li><strong>❌ Errors:</strong> Application errors, exceptions, and stack traces</li>
          <li><strong>💾 Cache:</strong> KV cache hits, misses, and storage operations</li>
        </ul>

        <h4>Log Levels:</h4>
        <ul>
          <li><strong style="color: #3b82f6">ℹ️ Info:</strong> Normal operations and informational messages</li>
          <li><strong style="color: #28a745">✅ Success:</strong> Successful operations (HTTP 2xx)</li>
          <li><strong style="color: #ffc107">⚠️ Warning:</strong> Potential issues (HTTP 4xx)</li>
          <li><strong style="color: #dc3545">❌ Error:</strong> Failures and exceptions (HTTP 5xx)</li>
        </ul>
      </div>
    </details>
  </div>
</div>

<style>
  .logs-page {
    max-width: 1400px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: calc(100vh - 100px); /* Account for header */
  }

  .logs-header {
    margin-bottom: 0.5rem;
  }

  .logs-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  .logs-header p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 1rem;
    transition: color 0.3s ease;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid var(--color-border);
    padding-bottom: 0;
    transition: border-color 0.3s ease;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s, color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
    position: relative;
    top: 2px;
  }

  .tab:hover {
    color: var(--color-text);
    background: var(--color-bg-secondary);
    transition: color 0.3s ease, background-color 0.3s ease;
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  .log-viewer-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .help-section {
    background: var(--mobile-menu-bg);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
  }

  .help-section summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--color-text);
    user-select: none;
    transition: color 0.3s ease;
  }

  .help-section summary:hover {
    color: var(--color-primary);
    transition: color 0.3s ease;
  }

  .help-content {
    margin-top: 1rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  .help-content h4 {
    margin: 1rem 0 0.5rem 0;
    color: var(--color-primary);
    transition: color 0.3s ease;
  }

  .help-content ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .help-content li {
    margin: 0.3rem 0;
    line-height: 1.5;
  }

  :global(.dark) .logs-header h1 {
    color: var(--color-text-dark);
  }

  :global(.dark) .logs-header p {
    color: var(--color-text-subtle-dark);
  }

  :global(.dark) .tabs {
    border-bottom-color: var(--color-border-dark);
  }

  :global(.dark) .tab {
    color: var(--color-text-subtle-dark);
  }

  :global(.dark) .tab:hover {
    color: var(--color-text-dark);
    background: var(--color-bg-secondary-dark);
  }

  :global(.dark) .tab.active {
    color: var(--color-primary-light);
    border-bottom-color: var(--color-primary-light);
  }

  :global(.dark) .help-section {
    background: var(--color-bg-tertiary-dark);
  }

  :global(.dark) .help-section summary {
    color: var(--color-text-dark);
  }

  :global(.dark) .help-section summary:hover {
    color: var(--color-primary-light);
  }

  :global(.dark) .help-content {
    color: var(--color-text-dark);
  }

  :global(.dark) .help-content h4 {
    color: var(--color-primary-light);
  }

  @media (max-width: 768px) {
    .logs-page {
      height: calc(100vh - 80px);
    }

    .tabs {
      overflow-x: auto;
      flex-wrap: nowrap;
    }

    .tab {
      white-space: nowrap;
    }

    .tab-label {
      display: none;
    }

    .tab-icon {
      font-size: 1.5rem;
    }
  }
</style>
