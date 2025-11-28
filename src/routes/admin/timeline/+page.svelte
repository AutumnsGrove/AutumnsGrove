<script>
  import { Calendar, Play, RefreshCw, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-svelte';

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

  // Worker URL - will be set after deployment
  // For now, use the API proxy endpoint
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

  async function triggerSummary() {
    triggerLoading = true;
    error = null;
    result = null;

    try {
      const res = await fetch(`${WORKER_URL}?date=${triggerDate}`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger summary');
      }

      result = data;
      // Refresh latest summary
      await fetchLatestSummary();
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
      const res = await fetch(`${WORKER_URL}/backfill?start=${backfillStart}&end=${end}`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to backfill summaries');
      }

      result = data;
      // Refresh latest summary
      await fetchLatestSummary();
    } catch (e) {
      error = e.message;
    } finally {
      backfillLoading = false;
    }
  }

  // Fetch on mount
  $effect(() => {
    fetchLatestSummary();
  });
</script>

<div class="timeline-admin">
  <header class="page-header">
    <h1><Calendar size={24} /> Timeline Management</h1>
    <p>Generate and manage daily development summaries</p>
  </header>

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

    <div class="input-group">
      <label for="trigger-date">Date</label>
      <input
        type="date"
        id="trigger-date"
        bind:value={triggerDate}
        max={new Date().toISOString().split('T')[0]}
      />
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
          <ul class="result-list">
            {#each result.results as r}
              <li class:rest={r.type === 'rest_day'} class:error={!r.success}>
                {r.date}: {r.success ? (r.type === 'rest_day' ? 'Rest day' : `${r.commit_count} commits`) : r.error}
              </li>
            {/each}
          </ul>
        {:else}
          <p><strong>{result.date}:</strong> {result.type === 'rest_day' ? 'Rest day (no commits)' : `${result.commit_count} commits`}</p>
          {#if result.brief}
            <p class="brief">{result.brief}</p>
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
    margin-bottom: 1rem;
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

  .input-group input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    color: #333;
  }

  :global(.dark) .input-group input {
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
  }
</style>
