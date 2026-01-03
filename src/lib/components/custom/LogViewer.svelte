<script>
  import { onMount, onDestroy } from 'svelte';
  import { Glass, GlassButton, Input } from '$lib/components';

  const props = $props();
  let category = $derived(props.category || 'all');

  let logs = $state([]);
  let connected = $state(false);
  let autoscroll = $state(true);
  let searchQuery = $state('');
  let eventSource = null;
  let logContainer = null;

  // Filtered logs based on search
  let filteredLogs = $derived(
    searchQuery
      ? logs.filter(log =>
          log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : logs
  );

  // Connect to SSE stream
  function connect() {
    if (eventSource) {
      eventSource.close();
    }

    const url = `/api/admin/logs?category=${category}&stream=true`;
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      connected = true;
      console.log('[LogViewer] Connected to log stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('[LogViewer] Stream connected at', data.timestamp);
        } else if (data.type === 'initial') {
          logs = data.logs;
          scrollToBottom();
        } else if (data.type === 'log') {
          logs = [data.log, ...logs].slice(0, 1000); // Keep last 1000 logs
          if (autoscroll) {
            setTimeout(scrollToBottom, 10);
          }
        } else if (data.type === 'heartbeat') {
          // Connection alive
        }
      } catch (error) {
        console.error('[LogViewer] Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[LogViewer] SSE error:', error);
      connected = false;
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          connect();
        }
      }, 5000);
    };
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      connected = false;
    }
  }

  function scrollToBottom() {
    if (logContainer && autoscroll) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  function clearLogs() {
    logs = [];
  }

  function copyLog(log) {
    const text = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(text);
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  function getLevelClass(level) {
    const classes = {
      info: 'level-info',
      success: 'level-success',
      warn: 'level-warn',
      error: 'level-error'
    };
    return classes[level] || 'level-info';
  }

  function getLevelIcon(level) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌'
    };
    return icons[level] || 'ℹ️';
  }

  onMount(() => {
    connect();
  });

  onDestroy(() => {
    disconnect();
  });

  // Reconnect when category changes
  $effect(() => {
    if (category) {
      disconnect();
      logs = [];
      connect();
    }
  });
</script>

<div class="log-viewer">
  <Glass variant="dark" intensity="medium" border class="log-controls-wrapper">
    <div class="log-controls">
      <div class="status">
        <span class="status-indicator" class:connected={connected}></span>
        <span class="status-text">{connected ? 'Live' : 'Disconnected'}</span>
        <span class="log-count">{filteredLogs.length} logs</span>
      </div>

      <div class="controls-right">
        <Input
          type="text"
          placeholder="Search logs..."
          bind:value={searchQuery}
          class="search-input"
        />

        <label class="autoscroll-toggle">
          <input type="checkbox" bind:checked={autoscroll} />
          Auto-scroll
        </label>

        <GlassButton variant="ghost" size="sm" onclick={clearLogs}>Clear</GlassButton>

        <GlassButton variant="ghost" size="sm" onclick={() => { disconnect(); connect(); }}>
          Reconnect
        </GlassButton>
      </div>
    </div>
  </Glass>

  <Glass variant="dark" intensity="strong" border class="log-container-wrapper">
    <div class="log-container" bind:this={logContainer}>
      {#if filteredLogs.length === 0}
        <div class="no-logs">
          <p>No logs yet. {connected ? 'Waiting for activity...' : 'Connecting...'}</p>
        </div>
      {:else}
        {#each filteredLogs as log (log.id)}
          <Glass variant="overlay" intensity="light" border class="log-entry {getLevelClass(log.level)}">
            <div class="log-header">
              <span class="log-icon">{getLevelIcon(log.level)}</span>
              <span class="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span class="log-category">{log.category}</span>
              <button class="btn-copy" onclick={() => copyLog(log)} title="Copy log entry">
                📋
              </button>
            </div>
            <div class="log-message">{log.message}</div>
            {#if log.metadata && Object.keys(log.metadata).length > 0}
              <details class="log-metadata">
                <summary>Metadata ({Object.keys(log.metadata).length} fields)</summary>
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </details>
            {/if}
          </Glass>
        {/each}
      {/if}
    </div>
  </Glass>
</div>

<style>
  .log-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 0;
  }

  .log-controls-wrapper {
    flex-shrink: 0;
  }

  .log-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #dc3545;
    animation: pulse 2s infinite;
  }

  .status-indicator.connected {
    background: #28a745;
    animation: none;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    color: #e0e0e0;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .log-count {
    color: #999;
    font-size: 0.85rem;
  }

  .controls-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .search-input {
    min-width: 200px;
  }

  .autoscroll-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #e0e0e0;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .log-container-wrapper {
    flex: 1;
    overflow: hidden;
  }

  .log-container {
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column-reverse;
  }

  .log-container::-webkit-scrollbar {
    width: 8px;
  }

  .log-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .log-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .no-logs {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }

  .log-entry {
    margin-bottom: 0.5rem;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .level-info {
    border-left: 3px solid #3b82f6;
  }

  .level-success {
    border-left: 3px solid #28a745;
  }

  .level-warn {
    border-left: 3px solid #ffc107;
  }

  .level-error {
    border-left: 3px solid #dc3545;
  }

  .log-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .log-icon {
    font-size: 1rem;
  }

  .log-timestamp {
    color: #999;
    font-size: 0.75rem;
  }

  .log-category {
    padding: 0.1rem 0.4rem;
    background: #3d3d3d;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .btn-copy {
    margin-left: auto;
    padding: 0.2rem 0.4rem;
    background: transparent;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .btn-copy:hover {
    opacity: 1;
  }

  .log-message {
    color: #e0e0e0;
    line-height: 1.4;
    word-break: break-word;
  }

  .log-metadata {
    margin-top: 0.5rem;
  }

  .log-metadata summary {
    color: #999;
    font-size: 0.75rem;
    cursor: pointer;
    user-select: none;
  }

  .log-metadata summary:hover {
    color: #5cb85f;
  }

  .log-metadata pre {
    margin: 0.5rem 0 0 0;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 0.75rem;
    overflow-x: auto;
  }
</style>
