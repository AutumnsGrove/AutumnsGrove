<script>
  import { Calendar, Play, RefreshCw, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, DollarSign, Cpu, TrendingUp, ChevronDown, Edit3, X, Save, List } from 'lucide-svelte';

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

  // Entry browsing and editing
  let entries = $state([]);
  let loadingEntries = $state(false);
  let entriesPage = $state(0);
  let entriesTotal = $state(0);
  const entriesLimit = 10;

  // Edit modal state
  let editModalOpen = $state(false);
  let editingEntry = $state(null);
  let editForm = $state({ brief_summary: '', detailed_timeline: '', gutter_content: [] });
  let saving = $state(false);
  let editError = $state(null);
  let editSuccess = $state(null);
  let gutterJsonError = $state(null);

  // Validation constants (must match server-side)
  const MAX_BRIEF_SUMMARY_LENGTH = 500;
  const MAX_DETAILED_TIMELINE_LENGTH = 50000;
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

  // Entry browsing functions
  async function fetchEntries() {
    loadingEntries = true;
    try {
      const offset = entriesPage * entriesLimit;
      const res = await fetch(`/api/timeline?limit=${entriesLimit}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        entries = data.summaries || [];
        entriesTotal = data.pagination?.total || 0;
      }
    } catch (e) {
      console.error('Failed to fetch entries:', e);
    }
    loadingEntries = false;
  }

  function openEditModal(entry) {
    editingEntry = entry;
    editForm = {
      brief_summary: entry.brief_summary || '',
      detailed_timeline: entry.detailed_timeline || '',
      gutter_content: entry.gutter_content || []
    };
    editError = null;
    editSuccess = null;
    gutterJsonError = null;
    editModalOpen = true;
  }

  function closeEditModal() {
    editModalOpen = false;
    editingEntry = null;
    editError = null;
    editSuccess = null;
  }

  async function saveEntry() {
    if (!editingEntry) return;

    // Client-side validation
    if (!editForm.brief_summary?.trim()) {
      editError = 'Brief summary is required';
      return;
    }

    if (editForm.brief_summary.length > MAX_BRIEF_SUMMARY_LENGTH) {
      editError = `Brief summary exceeds ${MAX_BRIEF_SUMMARY_LENGTH} characters`;
      return;
    }

    if (editForm.detailed_timeline?.length > MAX_DETAILED_TIMELINE_LENGTH) {
      editError = `Detailed timeline exceeds ${MAX_DETAILED_TIMELINE_LENGTH} characters`;
      return;
    }

    if (gutterJsonError) {
      editError = 'Please fix the JSON error in gutter content';
      return;
    }

    saving = true;
    editError = null;
    editSuccess = null;

    try {
      const res = await fetch(`/api/timeline/${editingEntry.summary_date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief_summary: editForm.brief_summary,
          detailed_timeline: editForm.detailed_timeline,
          gutter_content: editForm.gutter_content,
          // Include for optimistic locking to prevent race conditions
          expected_updated_at: editingEntry.updated_at
        })
      });

      // Handle network errors vs API errors
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Network error. Please check your connection and try again.');
      }

      if (!res.ok) {
        // Special handling for conflict (race condition)
        if (res.status === 409) {
          throw new Error('This entry was modified by someone else. Please close and reopen to get the latest version.');
        }
        throw new Error(data.message || `Server error (${res.status})`);
      }

      editSuccess = 'Entry updated successfully!';

      // Update local entries list
      const idx = entries.findIndex(e => e.summary_date === editingEntry.summary_date);
      if (idx >= 0 && data.entry) {
        entries[idx] = data.entry;
        entries = [...entries];
      }

      // Refresh latest summary if this was it
      if (latestSummary?.summary_date === editingEntry.summary_date) {
        await fetchLatestSummary();
      }

      // Close after short delay to show success message
      setTimeout(() => {
        closeEditModal();
      }, 1000);

    } catch (e) {
      editError = e.message || 'An unexpected error occurred';
      console.error('Save error:', e);
    } finally {
      saving = false;
    }
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      closeEditModal();
    }
  }

  // Fetch on mount
  $effect(() => {
    fetchLatestSummary();
    fetchModels();
    fetchUsageStats();
  });

  // Fetch entries on mount and when page changes
  let entriesInitialized = false;
  $effect(() => {
    // Track entriesPage to trigger refetch on change
    const page = entriesPage;
    if (!entriesInitialized) {
      entriesInitialized = true;
    }
    fetchEntries();
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
        <span>Processing...</span>
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

  <!-- Browse & Edit Entries -->
  <section class="entries-section">
    <h2><List size={18} /> Browse & Edit Entries</h2>
    <p class="section-desc">View and edit existing timeline summaries</p>

    {#if loadingEntries}
      <div class="status-loading">
        <Loader2 size={20} class="spinner" />
        <span>Loading entries...</span>
      </div>
    {:else if entries.length > 0}
      <div class="entries-list">
        {#each entries as entry}
          <div class="entry-item" class:rest-day={entry.is_rest_day}>
            <div class="entry-info">
              <span class="entry-date">{entry.summary_date}</span>
              <span class="entry-stats">
                {#if entry.is_rest_day}
                  <span class="rest-badge">Rest Day</span>
                {:else}
                  {entry.commit_count} commits &bull; +{entry.total_additions}/-{entry.total_deletions}
                {/if}
              </span>
            </div>
            {#if entry.brief_summary}
              <p class="entry-brief">{entry.brief_summary.slice(0, 100)}{entry.brief_summary.length > 100 ? '...' : ''}</p>
            {/if}
            <button class="edit-btn" onclick={() => openEditModal(entry)} disabled={entry.is_rest_day}>
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          </div>
        {/each}
      </div>

      <div class="pagination">
        <button
          class="page-btn"
          onclick={() => entriesPage = Math.max(0, entriesPage - 1)}
          disabled={entriesPage === 0}
        >
          Previous
        </button>
        <span class="page-info">
          Page {entriesPage + 1} of {Math.ceil(entriesTotal / entriesLimit)}
        </span>
        <button
          class="page-btn"
          onclick={() => entriesPage = entriesPage + 1}
          disabled={(entriesPage + 1) * entriesLimit >= entriesTotal}
        >
          Next
        </button>
      </div>
    {:else}
      <div class="no-entries">No timeline entries yet</div>
    {/if}
  </section>

  <footer class="page-footer">
    <a href="/timeline" target="_blank" class="view-link">View Public Timeline</a>
  </footer>
</div>

<!-- Edit Modal -->
{#if editModalOpen && editingEntry}
  <div
    class="modal-overlay"
    onclick={closeEditModal}
    onkeydown={handleModalKeydown}
    role="presentation"
  >
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div class="modal-header">
        <h3 id="edit-modal-title">
          <Edit3 size={18} />
          Edit Entry: {editingEntry.summary_date}
        </h3>
        <button class="close-btn" onclick={closeEditModal} aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div class="modal-body">
        {#if editError}
          <div class="edit-message error">
            <XCircle size={16} />
            {editError}
          </div>
        {/if}
        {#if editSuccess}
          <div class="edit-message success">
            <CheckCircle size={16} />
            {editSuccess}
          </div>
        {/if}

        <div class="form-group">
          <label for="edit-brief">Brief Summary</label>
          <textarea
            id="edit-brief"
            bind:value={editForm.brief_summary}
            rows="3"
            placeholder="A 1-2 sentence overview of the day's work..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="edit-detailed">Detailed Timeline (Markdown)</label>
          <textarea
            id="edit-detailed"
            bind:value={editForm.detailed_timeline}
            rows="12"
            placeholder="Detailed markdown breakdown of the day's work..."
          ></textarea>
        </div>

        <details class="gutter-section">
          <summary>Gutter Comments ({editForm.gutter_content?.length || 0})</summary>
          <p class="gutter-hint">JSON array of gutter items. Edit with care.</p>
          <textarea
            class="gutter-textarea"
            class:json-invalid={gutterJsonError}
            value={JSON.stringify(editForm.gutter_content, null, 2)}
            oninput={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (!Array.isArray(parsed)) {
                  gutterJsonError = 'Must be a JSON array';
                } else {
                  editForm.gutter_content = parsed;
                  gutterJsonError = null;
                }
              } catch (err) {
                gutterJsonError = 'Invalid JSON syntax';
              }
            }}
            rows="6"
          ></textarea>
          {#if gutterJsonError}
            <p class="json-error">{gutterJsonError}</p>
          {/if}
        </details>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" onclick={closeEditModal}>
          Cancel
        </button>
        <button class="modal-btn save" onclick={saveEntry} disabled={saving || gutterJsonError}>
          {#if saving}
            <Loader2 size={16} class="spinner" />
            <span>Saving...</span>
          {:else}
            <Save size={16} />
            <span>Save Changes</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

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

  /* Entries Section */
  .entries-section {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  :global(.dark) .entries-section {
    background: #252525;
    border-color: #333;
  }

  .entries-section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    margin: 0 0 0.25rem;
    color: #333;
  }

  :global(.dark) .entries-section h2 {
    color: #eee;
  }

  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .entry-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #eee;
  }

  :global(.dark) .entry-item {
    background: #2a2a2a;
    border-color: #333;
  }

  .entry-item.rest-day {
    opacity: 0.6;
  }

  .entry-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 140px;
  }

  .entry-date {
    font-weight: 600;
    color: #2c5f2d;
    font-size: 0.95rem;
  }

  :global(.dark) .entry-date {
    color: #5cb85f;
  }

  .entry-stats {
    font-size: 0.8rem;
    color: #666;
  }

  :global(.dark) .entry-stats {
    color: #999;
  }

  .rest-badge {
    background: #888;
    color: white;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }

  .entry-brief {
    flex: 1;
    margin: 0;
    font-size: 0.85rem;
    color: #555;
    min-width: 200px;
  }

  :global(.dark) .entry-brief {
    color: #bbb;
  }

  .edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: #5cb85f;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .edit-btn:hover:not(:disabled) {
    background: #4cae4c;
  }

  .edit-btn:disabled {
    background: #888;
    cursor: not-allowed;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  :global(.dark) .pagination {
    border-top-color: #333;
  }

  .page-btn {
    padding: 0.4rem 0.75rem;
    background: #2c5f2d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .page-btn:hover:not(:disabled) {
    background: #224822;
  }

  .page-btn:disabled {
    background: #888;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 0.85rem;
    color: #666;
  }

  :global(.dark) .page-info {
    color: #999;
  }

  .no-entries {
    text-align: center;
    color: #888;
    padding: 2rem;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  :global(.dark) .modal-content {
    background: #1e1e1e;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e0e0e0;
    background: #f9f9f9;
  }

  :global(.dark) .modal-header {
    background: #252525;
    border-bottom-color: #333;
  }

  .modal-header h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.1rem;
    color: #2c5f2d;
  }

  :global(.dark) .modal-header h3 {
    color: #5cb85f;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: #e0e0e0;
  }

  :global(.dark) .close-btn {
    color: #aaa;
  }

  :global(.dark) .close-btn:hover {
    background: #333;
  }

  .modal-body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
  }

  .edit-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .edit-message.error {
    background: #fdecea;
    color: #c00;
  }

  :global(.dark) .edit-message.error {
    background: #3a2020;
    color: #f88;
  }

  .edit-message.success {
    background: #e8f5e9;
    color: #2c5f2d;
  }

  :global(.dark) .edit-message.success {
    background: #1b3a1b;
    color: #5cb85f;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: #333;
    font-size: 0.9rem;
  }

  :global(.dark) .form-group label {
    color: #ddd;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    background: white;
    color: #333;
  }

  :global(.dark) .form-group textarea {
    background: #2a2a2a;
    border-color: #444;
    color: #eee;
  }

  .form-group textarea:focus {
    outline: none;
    border-color: #5cb85f;
    box-shadow: 0 0 0 2px rgba(92, 184, 95, 0.2);
  }

  .gutter-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  :global(.dark) .gutter-section {
    border-top-color: #333;
  }

  .gutter-section summary {
    cursor: pointer;
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
    user-select: none;
  }

  :global(.dark) .gutter-section summary {
    color: #aaa;
  }

  .gutter-hint {
    font-size: 0.8rem;
    color: #888;
    margin: 0.5rem 0;
  }

  .gutter-textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.8rem;
    font-family: monospace;
    resize: vertical;
    background: #f5f5f5;
    color: #333;
  }

  :global(.dark) .gutter-textarea {
    background: #1a1a1a;
    border-color: #444;
    color: #ccc;
  }

  .gutter-textarea.json-invalid {
    border-color: #c00;
    background: #fff5f5;
  }

  :global(.dark) .gutter-textarea.json-invalid {
    border-color: #f66;
    background: #2a1a1a;
  }

  .json-error {
    color: #c00;
    font-size: 0.8rem;
    margin: 0.35rem 0 0;
  }

  :global(.dark) .json-error {
    color: #f88;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid #e0e0e0;
    background: #f9f9f9;
  }

  :global(.dark) .modal-footer {
    background: #252525;
    border-top-color: #333;
  }

  .modal-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .modal-btn.cancel {
    background: #ddd;
    color: #333;
  }

  .modal-btn.cancel:hover {
    background: #ccc;
  }

  :global(.dark) .modal-btn.cancel {
    background: #444;
    color: #ddd;
  }

  :global(.dark) .modal-btn.cancel:hover {
    background: #555;
  }

  .modal-btn.save {
    background: #5cb85f;
    color: white;
  }

  .modal-btn.save:hover:not(:disabled) {
    background: #4cae4c;
  }

  .modal-btn.save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-btn :global(.spinner) {
    animation: spin 1s linear infinite;
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

    .entry-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .entry-info {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .edit-btn {
      width: 100%;
      justify-content: center;
    }

    .modal-content {
      max-height: 95vh;
    }
  }
</style>
