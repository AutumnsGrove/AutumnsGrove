<script>
  /**
   * ActivityOverview - Weekly activity visualization
   * Shows a GitHub-style contribution chart for recent days
   */
  import Sparkline from './Sparkline.svelte';

  /**
   * @type {{ date: string, commits: number, additions: number, deletions: number }[]}
   */
  let {
    data = [],
    days = 14
  } = $props();

  // Ensure we have the right number of days
  const filledData = $derived(() => {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = data.find(d => d.date === dateStr);
      result.push({
        date: dateStr,
        commits: dayData?.commits || 0,
        additions: dayData?.additions || 0,
        deletions: dayData?.deletions || 0,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }

    return result;
  });

  const commitData = $derived(filledData().map(d => d.commits));
  const locData = $derived(filledData().map(d => d.additions + d.deletions));

  const totalCommits = $derived(filledData().reduce((sum, d) => sum + d.commits, 0));
  const totalAdditions = $derived(filledData().reduce((sum, d) => sum + d.additions, 0));
  const totalDeletions = $derived(filledData().reduce((sum, d) => sum + d.deletions, 0));
  const activeDays = $derived(filledData().filter(d => d.commits > 0).length);

  // Get intensity level for heatmap (0-4)
  function getIntensity(commits) {
    if (commits === 0) return 0;
    if (commits <= 2) return 1;
    if (commits <= 5) return 2;
    if (commits <= 10) return 3;
    return 4;
  }
</script>

<div class="activity-overview">
  <div class="overview-header">
    <h3>Recent Activity</h3>
    <div class="overview-stats">
      <span class="stat">
        <strong>{totalCommits}</strong> commits
      </span>
      <span class="stat">
        <strong>{activeDays}</strong>/{days} days
      </span>
    </div>
  </div>

  <div class="overview-content">
    <!-- Heatmap -->
    <div class="heatmap">
      {#each filledData() as day}
        <div
          class="heatmap-cell level-{getIntensity(day.commits)}"
          class:today={day.isToday}
          title="{day.date}: {day.commits} commits"
        >
          <span class="cell-day">{day.dayOfWeek.charAt(0)}</span>
        </div>
      {/each}
    </div>

    <!-- Sparklines -->
    <div class="sparklines">
      <div class="sparkline-row">
        <span class="sparkline-label">Commits</span>
        <Sparkline
          data={commitData}
          width={140}
          height={20}
          strokeColor="#5cb85f"
          fillColor="rgba(92, 184, 95, 0.15)"
        />
      </div>
      <div class="sparkline-row">
        <span class="sparkline-label">LOC</span>
        <Sparkline
          data={locData}
          width={140}
          height={20}
          strokeColor="#5bc0de"
          fillColor="rgba(91, 192, 222, 0.15)"
        />
      </div>
    </div>
  </div>

  <div class="overview-footer">
    <div class="loc-summary">
      <span class="add">+{totalAdditions.toLocaleString()}</span>
      <span class="del">-{totalDeletions.toLocaleString()}</span>
    </div>
  </div>
</div>

<style>
  .activity-overview {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
  }

  :global(.dark) .activity-overview {
    background: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .overview-header h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #2c5f2d;
    font-weight: 600;
  }

  :global(.dark) .overview-header h3 {
    color: #5cb85f;
  }

  .overview-stats {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: #666;
  }

  :global(.dark) .overview-stats {
    color: #999;
  }

  .overview-stats strong {
    color: #333;
  }

  :global(.dark) .overview-stats strong {
    color: #eee;
  }

  .overview-content {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }

  @media (max-width: 500px) {
    .overview-content {
      flex-direction: column;
      gap: 0.75rem;
    }
  }

  /* Heatmap */
  .heatmap {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    max-width: 200px;
  }

  .heatmap-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0;
    transition: transform 0.15s ease;
  }

  .heatmap-cell:hover {
    transform: scale(1.2);
  }

  .heatmap-cell.today {
    outline: 1px solid #5cb85f;
    outline-offset: 1px;
  }

  .heatmap-cell.level-0 {
    background: #ebedf0;
  }

  .heatmap-cell.level-1 {
    background: #9be9a8;
  }

  .heatmap-cell.level-2 {
    background: #40c463;
  }

  .heatmap-cell.level-3 {
    background: #30a14e;
  }

  .heatmap-cell.level-4 {
    background: #216e39;
  }

  :global(.dark) .heatmap-cell.level-0 {
    background: #161b22;
  }

  :global(.dark) .heatmap-cell.level-1 {
    background: #0e4429;
  }

  :global(.dark) .heatmap-cell.level-2 {
    background: #006d32;
  }

  :global(.dark) .heatmap-cell.level-3 {
    background: #26a641;
  }

  :global(.dark) .heatmap-cell.level-4 {
    background: #39d353;
  }

  .cell-day {
    display: none;
  }

  /* Sparklines */
  .sparklines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sparkline-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sparkline-label {
    font-size: 0.7rem;
    color: #888;
    width: 45px;
    text-align: right;
  }

  :global(.dark) .sparkline-label {
    color: #777;
  }

  /* Footer */
  .overview-footer {
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
  }

  :global(.dark) .overview-footer {
    border-top-color: #333;
  }

  .loc-summary {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .loc-summary .add {
    color: #28a745;
  }

  .loc-summary .del {
    color: #dc3545;
  }

  :global(.dark) .loc-summary .add {
    color: #5cb85f;
  }

  :global(.dark) .loc-summary .del {
    color: #e57373;
  }
</style>
