<script>
  import LogViewer from '$lib/components/custom/LogViewer.svelte';
  import { Tabs } from '@groveengine/engine/components/ui';

  let activeTab = $state('all');

  const tabs = [
    { value: 'all', label: 'All Logs', description: 'All logs across all categories' },
    { value: 'api', label: 'API Activity', description: 'API requests and responses' },
    { value: 'github', label: 'GitHub', description: 'GitHub API calls and rate limits' },
    { value: 'errors', label: 'Errors', description: 'Errors and exceptions' },
    { value: 'cache', label: 'Cache', description: 'KV cache operations' }
  ];
</script>

<div class="logs-page">
  <header class="logs-header">
    <h1>🖥️ System Console</h1>
    <p>Real-time logs and system activity monitoring</p>
  </header>

  <Tabs bind:value={activeTab} tabs={tabs} />

  <div class="log-viewer-container">
    <LogViewer category={activeTab} />
  </div>

  <div class="help-section">
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
  @media (max-width: 768px) {
    .logs-page {
      height: calc(100vh - 80px);
    }
  }
</style>
