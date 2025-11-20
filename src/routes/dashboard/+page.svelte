<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	// Hardcoded to your account
	const USERNAME = 'AutumnsGrove';

	let loading = $state(false);
	let error = $state('');
	let userData = $state(null);
	let stats = $state(null);

	let hoursChartInstance = null;
	let daysChartInstance = null;
	let hoursCanvas = $state(null);
	let daysCanvas = $state(null);

	async function fetchStats() {
		loading = true;
		error = '';
		userData = null;
		stats = null;

		try {
			// Fetch user info
			const userResponse = await fetch(`/api/git/user/${USERNAME}`);
			if (!userResponse.ok) {
				const errorData = await userResponse.json().catch(() => ({}));
				throw new Error(errorData.message || 'User not found');
			}
			userData = await userResponse.json();

			// Fetch stats
			const statsResponse = await fetch(`/api/git/stats/${USERNAME}?limit=15`);
			if (!statsResponse.ok) {
				const errorData = await statsResponse.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to fetch stats');
			}
			stats = await statsResponse.json();

			// Render charts after stats are loaded
			setTimeout(() => {
				if (stats) {
					renderHoursChart(stats.commits_by_hour);
					renderDaysChart(stats.commits_by_day);
				}
			}, 0);
		} catch (e) {
			error = e.message || 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function renderHoursChart(commitsByHour) {
		if (!hoursCanvas) return;
		const ctx = hoursCanvas.getContext('2d');

		if (hoursChartInstance) {
			hoursChartInstance.destroy();
		}

		const hours = Array.from({ length: 24 }, (_, i) => i);
		const data = hours.map((hour) => commitsByHour[hour] || 0);

		hoursChartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: hours.map((h) => `${h}:00`),
				datasets: [
					{
						label: 'Commits',
						data: data,
						backgroundColor: 'rgba(92, 184, 95, 0.6)',
						borderColor: '#2c5f2d',
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(0, 0, 0, 0.1)' }
					},
					x: {
						grid: { display: false }
					}
				}
			}
		});
	}

	function renderDaysChart(commitsByDay) {
		if (!daysCanvas) return;
		const ctx = daysCanvas.getContext('2d');

		if (daysChartInstance) {
			daysChartInstance.destroy();
		}

		const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		const data = daysOrder.map((day) => commitsByDay[day] || 0);

		daysChartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: daysOrder.map((d) => d.substring(0, 3)),
				datasets: [
					{
						label: 'Commits',
						data: data,
						backgroundColor: 'rgba(92, 184, 95, 0.6)',
						borderColor: '#2c5f2d',
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(0, 0, 0, 0.1)' }
					},
					x: {
						grid: { display: false }
					}
				}
			}
		});
	}

	function formatNumber(num) {
		return num?.toLocaleString() || '0';
	}

	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(() => {
		// Auto-load stats on page mount
		fetchStats();

		return () => {
			if (hoursChartInstance) hoursChartInstance.destroy();
			if (daysChartInstance) daysChartInstance.destroy();
		};
	});
</script>

<svelte:head>
	<title>Git Dashboard - AutumnsGrove</title>
	<meta name="description" content="Visualize your GitHub commit activity and statistics" />
</svelte:head>

<div class="dashboard">
	<header class="dashboard-header">
		<h1>Git Dashboard</h1>
		<p>Visualize your GitHub commit activity</p>
	</header>

	<div class="refresh-section">
		<button onclick={fetchStats} disabled={loading}>
			{#if loading}
				Loading...
			{:else}
				Refresh Stats
			{/if}
		</button>
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if userData && stats}
		<div class="results">
			<!-- User Info Card -->
			<section class="card user-card">
				<h2>User Info</h2>
				<div class="user-info">
					<p><strong>Name:</strong> {userData.name || userData.login}</p>
					<p><strong>Username:</strong> @{userData.login}</p>
					<p><strong>Public Repos:</strong> {userData.public_repos}</p>
					<p><strong>Followers:</strong> {userData.followers} | <strong>Following:</strong> {userData.following}</p>
					{#if userData.bio}
						<p><strong>Bio:</strong> {userData.bio}</p>
					{/if}
				</div>
			</section>

			<!-- Stats Cards -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{formatNumber(stats.total_commits)}</div>
					<div class="stat-label">Total Commits</div>
				</div>
				<div class="stat-card">
					<div class="stat-value additions">+{formatNumber(stats.total_additions)}</div>
					<div class="stat-label">Lines Added</div>
				</div>
				<div class="stat-card">
					<div class="stat-value deletions">-{formatNumber(stats.total_deletions)}</div>
					<div class="stat-label">Lines Deleted</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{stats.repos_analyzed}</div>
					<div class="stat-label">Repos Analyzed</div>
				</div>
			</div>

			<!-- Charts -->
			<div class="charts-grid">
				<section class="card chart-card">
					<h3>When Do You Code?</h3>
					<div class="chart-container">
						<canvas bind:this={hoursCanvas}></canvas>
					</div>
				</section>

				<section class="card chart-card">
					<h3>Which Days Are Most Active?</h3>
					<div class="chart-container">
						<canvas bind:this={daysCanvas}></canvas>
					</div>
				</section>
			</div>

			<!-- Top Repos -->
			<section class="card">
				<h3>Top Repositories</h3>
				{#if Object.keys(stats.commits_by_repo).length > 0}
					<div class="repo-list">
						{#each Object.entries(stats.commits_by_repo) as [repo, commits]}
							<div class="repo-item">
								<span class="repo-name">{repo}</span>
								<span class="repo-commits">{commits} commits</span>
							</div>
						{/each}
					</div>
				{:else}
					<p>No repository data available.</p>
				{/if}
			</section>

			<!-- Recent Commits -->
			<section class="card">
				<h3>Recent Commits</h3>
				{#if stats.recent_commits && stats.recent_commits.length > 0}
					<div class="commits-list">
						{#each stats.recent_commits as commit}
							<div class="commit-item">
								<div class="commit-meta">
									<span class="commit-sha">{commit.sha}</span>
									<span class="commit-repo">{commit.repo}</span>
									<span class="commit-date">{formatDate(commit.date)}</span>
								</div>
								<div class="commit-message">{commit.message}</div>
								<div class="commit-stats">
									<span class="additions">+{commit.additions}</span>
									<span class="deletions">-{commit.deletions}</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p>No recent commits found.</p>
				{/if}
			</section>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 1000px;
		margin: 0 auto;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.dashboard-header h1 {
		color: #2c5f2d;
		margin: 0;
	}

	:global(.dark) .dashboard-header h1 {
		color: #5cb85f;
	}

	.dashboard-header p {
		color: #666;
		margin: 0.5rem 0 0;
	}

	:global(.dark) .dashboard-header p {
		color: #aaa;
	}

	.refresh-section {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.refresh-section button {
		padding: 0.75rem 1.5rem;
		background: #2c5f2d;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	:global(.dark) .refresh-section button {
		background: #5cb85f;
		color: #1a1a1a;
	}

	.refresh-section button:hover:not(:disabled) {
		background: #4a9d4f;
	}

	.refresh-section button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		background: #fee;
		color: #c00;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		text-align: center;
	}

	:global(.dark) .error {
		background: #4a2020;
		color: #ff8080;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	:global(.dark) .card {
		background: #2a2a2a;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.card h2,
	.card h3 {
		margin: 0 0 1rem;
		color: #2c5f2d;
	}

	:global(.dark) .card h2,
	:global(.dark) .card h3 {
		color: #5cb85f;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .stat-card {
		background: #2a2a2a;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #2c5f2d;
	}

	:global(.dark) .stat-value {
		color: #5cb85f;
	}

	.stat-value.additions {
		color: #28a745;
	}

	.stat-value.deletions {
		color: #dc3545;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	:global(.dark) .stat-label {
		color: #aaa;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 900px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	.chart-card {
		height: 350px;
	}

	.chart-container {
		height: 250px;
	}

	.repo-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.repo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	:global(.dark) .repo-item {
		background: #333;
	}

	.repo-name {
		font-weight: 500;
	}

	.repo-commits {
		color: #666;
		font-size: 0.9rem;
	}

	:global(.dark) .repo-commits {
		color: #aaa;
	}

	.commits-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.commit-item {
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	:global(.dark) .commit-item {
		background: #333;
	}

	.commit-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
	}

	.commit-sha {
		font-family: monospace;
		background: #e0e0e0;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	:global(.dark) .commit-sha {
		background: #444;
	}

	.commit-repo {
		color: #2c5f2d;
		font-weight: 500;
	}

	:global(.dark) .commit-repo {
		color: #5cb85f;
	}

	.commit-date {
		color: #666;
	}

	:global(.dark) .commit-date {
		color: #aaa;
	}

	.commit-message {
		margin-bottom: 0.5rem;
	}

	.commit-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		font-family: monospace;
	}

	.additions {
		color: #28a745;
	}

	.deletions {
		color: #dc3545;
	}

	@media (max-width: 600px) {
		.search-section {
			flex-direction: column;
			align-items: stretch;
		}

		.search-section input {
			width: 100%;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
