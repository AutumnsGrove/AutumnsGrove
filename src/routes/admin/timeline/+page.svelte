<script>
  import { Calendar, Play, RefreshCw, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, DollarSign, Cpu, TrendingUp, ChevronDown } from 'lucide-svelte';

  let triggerLoading = $state(false);
  let backfillLoading = $state(false);
  let result = $state(null);
  let error = $state(null);

  // Single date trigger
  let triggerDate = $state(new Date().toISOString().split('T')[0]);

  // Backfill range
  let backfillStart = $state('');
  let backfillEnd = $state('');

  // Latest summary info
  let latestSummary = $state(null);
  let loadingLatest = $state(true);

  // AI Models and Usage
  let models = $state([]);
  let currentModel = $state(null);
  let selectedModel = $state('');
  let usageStats = $state(null);
  let loadingUsage = $state(true);
  let usageDays = $state(30);

  const WORKER_URL = '/api/timeline/trigger';

  async function fetchLatestSummary() {
    loadingLatest = true;
    try {
      const res = await fetch('/api/timeline?limit=1');
      const data = await res.json();
      latestSummary = data.summaries?.[0] || null;
    } catch (e) {
      console.error('Failed to fetch latest summary:', e);
    }
    loadingLatest = false;
  }

  async function fetchModels() {
    try {
      const res = await fetch('/api/timeline/models');
      if (res.ok) {
        const data = await res.json();
        models = data.models || [];
        currentModel = data.current;
        // Set default selection to current model
        if (currentModel) {
          selectedModel = `${currentModel.provider}:${currentModel.model}`;
        }
      }
    } catch (e) {
      console.error('Failed to fetch models:', e);
    }
  }

  async function fetchUsageStats() {
    loadingUsage = true;
    try {
      const res = await fetch(`/api/timeline/usage?days=${usageDays}`);
      if (res.ok) {
        usageStats = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch usage stats:', e);
    }
    loadingUsage = false;
  }

  async function triggerSummary() {
    triggerLoading = true;
    error = null;
    result = null;

    try {
      let url = `${WORKER_URL}?date=${triggerDate}`;
      if (selectedModel) {
        url += `&model=${encodeURIComponent(selectedModel)}`;
      }

      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger summary');
      }

      result = data;
      await Promise.all([fetchLatestSummary(), fetchUsageStats()]);
    } catch (e) {
      error = e.message;
    } finally {
      triggerLoading = false;
    }
  }

  async function backfillSummaries() {
    if (!backfillStart) {
      error = 'Please select a start date';
      return;
    }

    backfillLoading = true;
    error = null;
    result = null;

    try {
      const end = backfillEnd || backfillStart;
      let url = `${WORKER_URL}/backfill?start=${backfillStart}&end=${end}`;
      if (selectedModel) {
        url += `&model=${encodeURIComponent(selectedModel)}`;
      }

      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to backfill summaries');
      }

      result = data;
      await Promise.all([fetchLatestSummary(), fetchUsageStats()]);
    } catch (e) {
      error = e.message;
    } finally {
      backfillLoading = false;
    }
  }

  function formatCost(cost) {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(4)}`;
  }

  function formatTokens(tokens) {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  }

  // Fetch on mount
  $effect(() => {
    fetchLatestSummary();
    fetchModels();
    fetchUsageStats();
  });
</script>

<div class="timeline-admin">
  <header class="page-header">
    <h1><Calendar size={24} /> Timeline Management</h1>
    <p>Generate and manage daily development summaries</p>
  </header>

  <!-- AI Usage Stats -->
  <section class="usage-section">
    <div class="usage-header">
      <h2><TrendingUp size={18} /> AI Usage & Costs</h2>
      <select bind:value={usageDays} onchange={() => fetchUsageStats()}>
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
      </select>
    </div>

    {#if loadingUsage}
      <div class="status-loading">
        <Loader2 size={20} class="spinner" />
        <span>Loading usage stats...</span>
      </div>
    {:else if usageStats}
      <div class="usage-grid">
        <div class="usage-card">
          <div class="usage-label">Total Requests</div>
          <div class="usage-value">{usageStats.totals.totalRequests}</div>
        </div>
        <div class="usage-card cost">
          <div class="usage-label">Total Cost</div>
          <div class="usage-value">{formatCost(usageStats.totals.totalCost)}</div>
        </div>
        <div class="usage-card">
          <div class="usage-label">Input Tokens</div>
          <div class="usage-value">{formatTokens(usageStats.totals.totalInputTokens)}</div>
        </div>
        <div class="usage-card">
          <div class="usage-label">Output Tokens</div>
          <div class="usage-value">{formatTokens(usageStats.totals.totalOutputTokens)}</div>
        </div>
      </div>

      {#if Object.keys(usageStats.totals.byProvider).length > 0}
        <div class="provider-breakdown">
          <h3>Cost by Provider</h3>
          <div class="breakdown-list">
            {#each Object.entries(usageStats.totals.byProvider) as [provider, cost]}
              <div class="breakdown-item">
                <span class="provider-name">{provider}</span>
                <span class="provider-cost">{formatCost(cost)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if usageStats.requests && usageStats.requests.length > 0}
        <details class="recent-requests">
          <summary>
            <ChevronDown size={16} />
            Recent Requests ({usageStats.requests.length})
          </summary>
          <div class="requests-table-wrapper">
            <table class="requests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Model</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {#each usageStats.requests.slice(0, 20) as req}
                  <tr class:failed={!req.success}>
                    <td>{req.summary_date || req.request_date}</td>
                    <td class="model-cell">{req.model.split('/').pop().split('-').slice(0, 2).join('-')}</td>
                    <td>{formatTokens(req.input_tokens + req.output_tokens)}</td>
                    <td>{formatCost(req.estimated_cost_usd)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </details>
      {/if}
    {:else}
      <div class="no-usage">No usage data yet</div>
    {/if}
  </section>

  <!-- Latest Summary Status -->
  <section class="status-section">
    <h2><Clock size={18} /> Latest Summary</h2>
    {#if loadingLatest}
      <div class="status-loading">
        <Loader2 size={20} class="spinner" />
        <span>Loading...</span>
      </div>
    {:else if latestSummary}
      <div class="latest-summary">
        <div class="summary-date">{latestSummary.summary_date}</div>
        <div class="summary-stats">
          {#if latestSummary.commit_count > 0}
            <span class="stat">{latestSummary.commit_count} commits</span>
            <span class="stat">+{latestSummary.total_additions} / -{latestSummary.total_deletions}</span>
            {#if latestSummary.ai_model}
              <span class="stat model">{latestSummary.ai_model.split(':').pop().split('-').slice(0, 2).join('-')}</span>
            {/if}
          {:else}
            <span class="stat rest">Rest Day</span>
          {/if}
        </div>
        {#if latestSummary.brief_summary}
          <p class="summary-brief">{latestSummary.brief_summary}</p>
        {/if}
      </div>
    {:else}
      <div class="no-summary">
        <AlertTriangle size={20} />
        <span>No summaries generated yet</span>
      </div>
    {/if}
  </section>

  <!-- Generate Summary -->
  <section class="action-section">
    <h2><Play size={18} /> Generate Summary</h2>
    <p class="section-desc">Generate an AI summary for a specific date</p>

    <div class="input-row">
      <div class="input-group">
        <label for="trigger-date">Date</label>
        <input
          type="date"
          id="trigger-date"
          bind:value={triggerDate}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div class="input-group">
        <label for="model-select">AI Model</label>
        <select id="model-select" bind:value={selectedModel}>
          {#each models as model}
            <option
              value="{model.provider}:{model.id}"
              disabled={model.notImplemented}
            >
              {model.name} ({model.providerName}){model.notImplemented ? ' - Coming Soon' : ''}
            </option>
          {/each}
        </select>
      </div>
    </div>

    <button
      class="action-btn primary"
      onclick={triggerSummary}
      disabled={triggerLoading}
    >
      {#if triggerLoading}
        <Loader2 size={16} class="spinner" />
        <span>Generating...</span>
      {:else}
        <Play size={16} />
        <span>Generate Summary</span>
      {/if}
    </button>
  </section>

  <!-- Backfill Summaries -->
  <section class="action-section">
    <h2><RefreshCw size={18} /> Backfill Past Days</h2>
    <p class="section-desc">Generate summaries for a range of past dates (max 30 days)</p>

    <div class="input-row">
      <div class="input-group">
        <label for="backfill-start">Start Date</label>
        <input
          type="date"
          id="backfill-start"
          bind:value={backfillStart}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div class="input-group">
        <label for="backfill-end">End Date (optional)</label>
        <input
          type="date"
          id="backfill-end"
          bind:value={backfillEnd}
          min={backfillStart}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>

    <button
      class="action-btn secondary"
      onclick={backfillSummaries}
      disabled={backfillLoading || !backfillStart}
    >
      {#if backfillLoading}
        <Loader2 size={16} class="spinner" />
        <span>Backfilling...</span>
      {:else}
        <RefreshCw size={16} />
        <span>Backfill Summaries</span>
      {/if}
    </button>
  </section>

  <!-- Result Display -->
  {#if error}
    <div class="result error">
      <XCircle size={20} />
      <span>{error}</span>
    </div>
  {/if}

  {#if result}
    <div class="result success">
      <CheckCircle size={20} />
      <div class="result-content">
        {#if result.processed}
          <p><strong>Backfill Complete:</strong> {result.processed} days processed</p>
          {#if result.totalCost > 0}
            <p class="cost-info">Total cost: {formatCost(result.totalCost)}</p>
          {/if}
          <ul class="result-list">
            {#each result.results as r}
              <li class:rest={r.type === 'rest_day'} class:error={!r.success}>
                {r.date}: {r.success ? (r.type === 'rest_day' ? 'Rest day' : `${r.commit_count} commits`) : r.error}
                {#if r.cost > 0}
                  <span class="item-cost">({formatCost(r.cost)})</span>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p><strong>{result.date}:</strong> {result.type === 'rest_day' ? 'Rest day (no commits)' : `${result.commit_count} commits`}</p>
          {#if result.brief}
            <p class="brief">{result.brief}</p>
          {/if}
          {#if result.cost > 0}
            <p class="cost-info">Cost: {formatCost(result.cost)} ({formatTokens(result.tokens?.input || 0)} in / {formatTokens(result.tokens?.output || 0)} out)</p>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  <footer class="page-footer">
    <a href="/timeline" target="_blank" class="view-link">View Public Timeline</a>
  </footer>
</div>

<style>
  .timeline-admin {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2c5f2d;
    margin: 0;
    font-size: 1.5rem;
  }

  :global(.dark) .page-header h1 {
    color: #5cb85f;
  }

  .page-header p {
    color: #666;
    margin: 0.25rem 0 0;
  }

  :global(.dark) .page-header p {
    color: #999;
  }

  /* Usage Section */
  .usage-section {
    background: linear-gradient(135deg, #f0f7f0 0%, #e8f5e9 100%);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    border: 1px solid #c8e6c9;
  }

  :global(.dark) .usage-section {
    background: linear-gradient(135deg, #1a2a1a 0%, #1b3a1b 100%);
    border-color: #2d4a2d;
  }

  .usage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .usage-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    margin: 0;
    color: #2c5f2d;
  }

  :global(.dark) .usage-header h2 {
    color: #5cb85f;
  }

  .usage-header select {
    padding: 0.35rem 0.75rem;
    border: 1px solid #c8e6c9;
    border-radius: 6px;
    font-size: 0.85rem;
    background: white;
    color: #333;
  }

  :global(.dark) .usage-header select {
    background: #252525;
    border-color: #3d5a3d;
    color: #eee;
  }

  .usage-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 600px) {
    .usage-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .usage-card {
    background: white;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  :global(.dark) .usage-card {
    background: #252525;
  }

  .usage-card.cost {
    background: #2c5f2d;
    color: white;
  }

  :global(.dark) .usage-card.cost {
    background: #3d6a3d;
  }

  .usage-label {
    font-size: 0.75rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  :global(.dark) .usage-label {
    color: #999;
  }

  .usage-card.cost .usage-label {
    color: rgba(255,255,255,0.8);
  }

  .usage-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c5f2d;
  }

  :global(.dark) .usage-value {
    color: #5cb85f;
  }

  .usage-card.cost .usage-value {
    color: white;
  }

  .provider-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #c8e6c9;
  }

  :global(.dark) .provider-breakdown {
    border-top-color: #3d5a3d;
  }

  .provider-breakdown h3 {
    font-size: 0.85rem;
    color: #555;
    margin: 0 0 0.5rem;
  }

  :global(.dark) .provider-breakdown h3 {
    color: #aaa;
  }

  .breakdown-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  :global(.dark) .breakdown-item {
    background: #252525;
  }

  .provider-name {
    color: #666;
    text-transform: capitalize;
  }

  :global(.dark) .provider-name {
    color: #999;
  }

  .provider-cost {
    font-weight: 600;
    color: #2c5f2d;
  }

  :global(.dark) .provider-cost {
    color: #5cb85f;
  }

  .recent-requests {
    margin-top: 1rem;
  }

  .recent-requests summary {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: #555;
    user-select: none;
  }

  :global(.dark) .recent-requests summary {
    color: #aaa;
  }

  .recent-requests[open] summary :global(svg) {
    transform: rotate(180deg);
  }

  .requests-table-wrapper {
    margin-top: 0.75rem;
    overflow-x: auto;
  }

  .requests-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .requests-table th,
  .requests-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  :global(.dark) .requests-table th,
  :global(.dark) .requests-table td {
    border-bottom-color: #333;
  }

  .requests-table th {
    font-weight: 600;
    color: #555;
    background: rgba(255,255,255,0.5);
  }

  :global(.dark) .requests-table th {
    color: #aaa;
    background: rgba(0,0,0,0.2);
  }

  .requests-table tr.failed {
    opacity: 0.6;
    background: #fef0f0;
  }

  :global(.dark) .requests-table tr.failed {
    background: #3a2020;
  }

  .model-cell {
    font-family: monospace;
    font-size: 0.75rem;
  }

  .no-usage {
    text-align: center;
    color: #888;
    padding: 1rem;
  }

  /* Status Section */
  .status-section {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  :global(.dark) .status-section {
    background: #2a2a2a;
  }

  .status-section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    margin: 0 0 0.75rem;
    color: #333;
  }

  :global(.dark) .status-section h2 {
    color: #eee;
  }

  .status-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
  }

  .latest-summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .summary-date {
    font-weight: 600;
    color: #2c5f2d;
  }

  :global(.dark) .summary-date {
    color: #5cb85f;
  }

  .summary-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #666;
  }

  :global(.dark) .summary-stats {
    color: #999;
  }

  .summary-stats .rest {
    color: #888;
    font-style: italic;
  }

  .summary-stats .model {
    font-family: monospace;
    font-size: 0.8rem;
    background: #e8f5e9;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  :global(.dark) .summary-stats .model {
    background: #1b3a1b;
  }

  .summary-brief {
    margin: 0;
    font-size: 0.9rem;
    color: #444;
    line-height: 1.4;
  }

  :global(.dark) .summary-brief {
    color: #ccc;
  }

  .no-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f0ad4e;
  }

  /* Action Sections */
  .action-section {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  :global(.dark) .action-section {
    background: #252525;
    border-color: #333;
  }

  .action-section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    margin: 0 0 0.25rem;
    color: #333;
  }

  :global(.dark) .action-section h2 {
    color: #eee;
  }

  .section-desc {
    color: #666;
    font-size: 0.85rem;
    margin: 0 0 1rem;
  }

  :global(.dark) .section-desc {
    color: #999;
  }

  .input-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }

  .input-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #555;
  }

  :global(.dark) .input-group label {
    color: #aaa;
  }

  .input-group input,
  .input-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    color: #333;
  }

  :global(.dark) .input-group input,
  :global(.dark) .input-group select {
    background: #333;
    border-color: #444;
    color: #eee;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn.primary {
    background: #5cb85f;
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: #4cae4c;
  }

  .action-btn.secondary {
    background: #2c5f2d;
    color: white;
  }

  .action-btn.secondary:hover:not(:disabled) {
    background: #224822;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Results */
  .result {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .result.success {
    background: #e8f5e9;
    color: #2c5f2d;
  }

  :global(.dark) .result.success {
    background: #1b3a1b;
    color: #5cb85f;
  }

  .result.error {
    background: #fdecea;
    color: #c00;
  }

  :global(.dark) .result.error {
    background: #3a2020;
    color: #f88;
  }

  .result-content {
    flex: 1;
  }

  .result-content p {
    margin: 0 0 0.5rem;
  }

  .result-content .brief {
    font-style: italic;
    opacity: 0.9;
  }

  .cost-info {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .result-list {
    margin: 0.5rem 0 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .result-list li {
    margin-bottom: 0.25rem;
  }

  .result-list li.rest {
    opacity: 0.7;
  }

  .result-list li.error {
    color: #c00;
  }

  :global(.dark) .result-list li.error {
    color: #f88;
  }

  .item-cost {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  /* Footer */
  .page-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  :global(.dark) .page-footer {
    border-top-color: #333;
  }

  .view-link {
    color: #5cb85f;
    text-decoration: none;
    font-weight: 500;
  }

  .view-link:hover {
    text-decoration: underline;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .input-row {
      flex-direction: column;
    }

    .usage-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
