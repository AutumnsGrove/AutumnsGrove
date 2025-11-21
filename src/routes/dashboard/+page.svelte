<script>
	import { untrack } from 'svelte';
	import Chart from 'chart.js/auto';
	import Heatmap from './Heatmap.svelte';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import {
		GitCommit,
		Plus,
		Minus,
		FolderGit2,
		Calendar,
		Clock,
		CalendarDays,
		Code,
		ExternalLink,
		RefreshCw
	} from 'lucide-svelte';

	// Hardcoded to your account
	const USERNAME = 'AutumnsGrove';

	let loading = $state(false);
	let error = $state('');
	let userData = $state(null);
	let stats = $state(null);
	let reposData = $state([]);
	let activityData = $state([]);
	let lastRefreshed = $state(null);

	// Commit pagination state
	let commits = $state([]);
	let commitsPage = $state(1);
	let commitsLoading = $state(false);
	let commitsHasMore = $state(true);
	let commitsTotalPages = $state(0);
	let commitsLimitReached = $state(false);
	const MAX_PAGES = 10;
	const DEFAULT_PER_PAGE = 20;
	let sentinelElement = $state(null);

	// Debounce timer for filter changes
	let filterDebounceTimer = $state(null);

	// Time range filter
	let timeRange = $state('all'); // 'all', '6months', '30days', 'today'

	// Repo limit (how many repos to analyze)
	let repoLimit = $state(15); // Default to 15, max is 50 (GitHub API limit)

	// Calculate the 'since' date based on selected time range
	// Normalized to start of day for consistent caching
	function getSinceDate() {
		if (timeRange === 'all') return null;

		const now = new Date();
		if (timeRange === 'today') {
			// Start of today (UTC)
			now.setUTCHours(0, 0, 0, 0);
		} else if (timeRange === '30days') {
			now.setDate(now.getDate() - 30);
			now.setUTCHours(0, 0, 0, 0);
		} else if (timeRange === '6months') {
			now.setMonth(now.getMonth() - 6);
			now.setUTCHours(0, 0, 0, 0);
		}
		return now.toISOString();
	}

	// Handle time range change with debounce
	function handleTimeRangeChange(event) {
		timeRange = event.target.value;
		// Immediately clear commits to avoid showing stale data during loading
		commits = [];
		commitsPage = 1;
		commitsHasMore = true;
		commitsLimitReached = false;

		// Debounce the fetch to prevent rapid API calls
		if (filterDebounceTimer) {
			clearTimeout(filterDebounceTimer);
			timerIds.delete(filterDebounceTimer);
		}
		filterDebounceTimer = scheduleTimeout(() => {
			fetchStats();
			filterDebounceTimer = null;
		}, 300);
	}

	// Handle repo limit change with debounce
	function handleRepoLimitChange(event) {
		repoLimit = parseInt(event.target.value, 10);
		// Immediately clear commits to avoid showing stale data during loading
		commits = [];
		commitsPage = 1;
		commitsHasMore = true;
		commitsLimitReached = false;

		// Debounce the fetch to prevent rapid API calls
		if (filterDebounceTimer) {
			clearTimeout(filterDebounceTimer);
			timerIds.delete(filterDebounceTimer);
		}
		filterDebounceTimer = scheduleTimeout(() => {
			fetchStats();
			filterDebounceTimer = null;
		}, 300);
	}

	// Refresh rate limiting (5 minutes = 300000ms)
	const REFRESH_COOLDOWN = 5 * 60 * 1000;
	let refreshMessage = $state('');
	let clickCount = $state(0);
	let clickTimer = null;

	// Track all timers for cleanup on unmount
	let timerIds = $state(new Set());
	let abortController = $state(null);
	let commitsAbortController = $state(null);
	let isMounted = $state(false);

	function scheduleTimeout(callback, delay) {
		const id = setTimeout(() => {
			callback();
			// Self-cleanup: remove from tracking set when completed
			timerIds.delete(id);
		}, delay);
		timerIds.add(id);
		return id;
	}

	function clearAllTimers() {
		timerIds.forEach(id => clearTimeout(id));
		timerIds.clear();
	}

	function handleAvatarClick() {
		clickCount++;

		if (clickTimer) {
			clearTimeout(clickTimer);
			timerIds.delete(clickTimer);
		}

		clickTimer = scheduleTimeout(() => {
			clickCount = 0;
			clickTimer = null;
		}, 800);

		if (clickCount === 3) {
			attemptRefresh();
			// Reset after a brief moment to show full circle
			scheduleTimeout(() => {
				clickCount = 0;
			}, 300);
		}
	}

	function attemptRefresh() {
		const lastRefresh = localStorage.getItem('dashboard_last_refresh');
		const refreshCount = parseInt(localStorage.getItem('dashboard_refresh_count') || '0');
		const now = Date.now();

		if (lastRefresh) {
			const timeSince = now - parseInt(lastRefresh);
			const timeRemaining = REFRESH_COOLDOWN - timeSince;

			if (timeRemaining > 0) {
				const minutesLeft = Math.ceil(timeRemaining / 60000);
				refreshMessage = `Rate limited. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`;
				scheduleTimeout(() => { refreshMessage = ''; }, 3000);
				console.log(`[Dashboard Refresh] Blocked - ${minutesLeft}m remaining`);
				return;
			}
		}

		// Log refresh event
		const newCount = refreshCount + 1;
		localStorage.setItem('dashboard_last_refresh', now.toString());
		localStorage.setItem('dashboard_refresh_count', newCount.toString());

		// Estimate cost: 3 API calls (user, stats, repos)
		// GitHub API: free, but rate limited to 5000/hour with token
		console.log(`[Dashboard Refresh] #${newCount} at ${new Date().toISOString()}`);
		console.log(`[Dashboard Refresh] Est. cost: 3 GitHub API calls`);

		refreshMessage = 'Refreshing...';
		fetchStats(true).then(() => { // Pass true to bypass cache
			refreshMessage = 'Refreshed!';
			scheduleTimeout(() => { refreshMessage = ''; }, 2000);
		});
	}

	let hoursChartInstance = null;
	let daysChartInstance = null;
	let hoursCanvas = $state(null);
	let daysCanvas = $state(null);

	async function fetchStats(bypassCache = false) {
		// Abort any in-flight requests
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();
		const signal = abortController.signal;

		loading = true;
		error = '';

		try {
			// Build stats URL with time range filter
			const since = getSinceDate();
			let statsUrl = `/api/git/stats/${USERNAME}?limit=${repoLimit}`;
			if (since) {
				statsUrl += `&since=${encodeURIComponent(since)}`;
			}
			if (bypassCache) {
				statsUrl += '&bypass_cache=true';
			}
			console.log(`[Dashboard] Fetching stats with timeRange=${timeRange}, repoLimit=${repoLimit}, since=${since || 'null'}, bypassCache=${bypassCache}`);
			console.log(`[Dashboard] Stats URL: ${statsUrl}`);

			// Fetch all data in parallel for better performance
			const contributionsUrl = bypassCache
				? `/api/git/contributions/${USERNAME}?bypass_cache=true`
				: `/api/git/contributions/${USERNAME}`;
			const [userResponse, statsResponse, reposResponse, contributionsResponse] = await Promise.all([
				fetch(`/api/git/user/${USERNAME}`, { signal }),
				fetch(statsUrl, { signal }),
				fetch(`/api/git/repos/${USERNAME}`, { signal }),
				fetch(contributionsUrl, { signal })
			]);

			// Process user response (required)
			if (!userResponse.ok) {
				const errorData = await userResponse.json().catch(() => ({}));
				throw new Error(errorData.message || 'User not found');
			}
			userData = await userResponse.json();

			// Process stats response (required)
			if (!statsResponse.ok) {
				const errorData = await statsResponse.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to fetch stats');
			}
			stats = await statsResponse.json();
			console.log(`[Dashboard] Stats received: commits=${stats.total_commits}, filtered_since=${stats.filtered_since || 'none'}, cached=${stats.cached}`);

			// Process repos response (optional)
			if (reposResponse.ok) {
				reposData = await reposResponse.json();
			}

			// Process contributions response (optional)
			if (contributionsResponse.ok) {
				const contributionsResult = await contributionsResponse.json();
				activityData = contributionsResult.activity || [];
			}

			// Render charts after stats are loaded using microtask for better performance
			queueMicrotask(() => {
				if (stats && isMounted) {
					renderHoursChart(stats.commits_by_hour);
					renderDaysChart(stats.commits_by_day);
				}
			});

			// Fetch initial commits with pagination
			commits = [];
			commitsPage = 1;
			commitsHasMore = true;
			commitsLimitReached = false;
			await fetchCommits(1, true);

			// Update last refreshed timestamp
			lastRefreshed = new Date();
		} catch (e) {
			// Ignore abort errors
			if (e.name === 'AbortError') {
				return;
			}
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

		// Convert to 12-hour format with AM/PM
		const formatHour = (h) => {
			if (h === 0) return '12 AM';
			if (h === 12) return '12 PM';
			if (h < 12) return `${h} AM`;
			return `${h - 12} PM`;
		};

		hoursChartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: hours.map(formatHour),
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
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatRefreshTime(date) {
		if (!date) return '';
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function getRepoDescription(repoName) {
		const repo = reposData.find(r => r.name === repoName);
		return repo?.description || '';
	}

	// Fetch paginated commits
	async function fetchCommits(page = 1, reset = false) {
		// Guard against multiple simultaneous non-reset calls
		if (commitsLoading && !reset) return;
		if (!reset && !commitsHasMore) return;
		if (page > MAX_PAGES) {
			commitsLimitReached = true;
			commitsHasMore = false;
			return;
		}

		// Abort any in-flight commits requests to prevent race conditions
		if (commitsAbortController) {
			commitsAbortController.abort();
		}
		commitsAbortController = new AbortController();
		const signal = commitsAbortController.signal;

		commitsLoading = true;

		try {
			const since = getSinceDate();
			let url = `/api/git/commits/${USERNAME}?repo_limit=${repoLimit}&page=${page}&per_page=${DEFAULT_PER_PAGE}`;
			if (since) {
				url += `&since=${encodeURIComponent(since)}`;
			}

			const response = await fetch(url, { signal });
			if (!response.ok) {
				throw new Error('Failed to fetch commits');
			}

			const data = await response.json();

			if (reset) {
				commits = data.commits || [];
			} else {
				commits = [...commits, ...(data.commits || [])];
			}

			commitsPage = data.page;
			commitsTotalPages = data.total_pages;
			commitsHasMore = data.has_more && data.page < MAX_PAGES;
			commitsLimitReached = data.page >= MAX_PAGES && data.has_more;
		} catch (e) {
			if (e.name === 'AbortError') return;
			console.error('Error fetching commits:', e);
		} finally {
			commitsLoading = false;
		}
	}

	// Load more commits (called by IntersectionObserver)
	function loadMoreCommits() {
		if (!commitsLoading && commitsHasMore && !commitsLimitReached) {
			fetchCommits(commitsPage + 1);
		}
	}

	// Set up IntersectionObserver for infinite scroll
	let observer = null;

	function setupIntersectionObserver() {
		if (observer) {
			observer.disconnect();
		}

		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMoreCommits();
				}
			},
			{ threshold: 0.1 }
		);

		if (sentinelElement) {
			observer.observe(sentinelElement);
		}
	}

	// Watch sentinelElement changes
	$effect(() => {
		if (sentinelElement && isMounted) {
			setupIntersectionObserver();
			return () => {
				if (observer) {
					observer.disconnect();
				}
			};
		}
	});

	$effect(() => {
		// Use untrack to prevent isMounted assignment from causing re-execution
		untrack(() => {
			isMounted = true;
		});
		// Auto-load stats on page mount
		fetchStats();

		return () => {
			isMounted = false;
			// Abort any in-flight fetch requests
			if (abortController) {
				abortController.abort();
			}
			if (commitsAbortController) {
				commitsAbortController.abort();
			}
			// Clear all tracked timers
			clearAllTimers();
			// Destroy chart instances
			if (hoursChartInstance) hoursChartInstance.destroy();
			if (daysChartInstance) daysChartInstance.destroy();
			// Disconnect observer
			if (observer) {
				observer.disconnect();
			}
		};
	});
</script>

<svelte:head>
	<title>Git Dashboard - AutumnsGrove</title>
	<meta name="description" content="Visualize your GitHub commit activity and statistics" />
</svelte:head>

<div class="dashboard">
	<!-- Temporary Warning Notice -->
	<div class="site-warning">
		<strong>Note:</strong> This page has known interactivity issues. If buttons or navigation stop working,
		please refresh the page. When returning to Home, you may need to refresh again.
	</div>

	<header class="dashboard-header">
		<h1>Git Dashboard</h1>
		<p>My GitHub commit activity</p>
	</header>

	<!-- Explanation Box for non-developers -->
	<CollapsibleSection title="What do these metrics mean?">
		<div class="explanation-content">
			<div class="explanation-item">
				<strong>Commits</strong>
				<p>A commit is like a "save point" in code. Each commit captures a snapshot of changes made to the project. More commits = more active development.</p>
			</div>
			<div class="explanation-item">
				<strong>Lines Added / Deleted</strong>
				<p>These show how much code was written (added) or removed (deleted). High numbers indicate significant changes to the codebase.</p>
			</div>
			<div class="explanation-item">
				<strong>Repositories</strong>
				<p>A repository (repo) is a project folder that contains all code and history. Think of it like a folder for a specific project.</p>
			</div>
			<div class="explanation-item">
				<strong>Heatmap</strong>
				<p>The green grid shows coding activity over time. Darker squares = more commits on that day. It's like a calendar of productivity.</p>
			</div>
			<div class="explanation-item">
				<strong>Charts</strong>
				<p>The bar charts show when coding happens most - by hour of day and day of week. Useful for understanding work patterns.</p>
			</div>
		</div>
	</CollapsibleSection>

	{#if loading}
		<div class="loading-indicator">Loading...</div>
	{/if}

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if userData && stats}
		<div class="results">
			<!-- User Info Card - Compact -->
			<section class="user-card-compact">
				<button
					class="avatar-button"
					onclick={handleAvatarClick}
					title="Triple-click to refresh"
					aria-label="Triple-click to refresh stats"
				>
					<div class="avatar-wrapper">
						<svg class="progress-ring" viewBox="0 0 48 48">
							<circle
								class="progress-ring-circle"
								cx="24"
								cy="24"
								r="22"
								stroke-dasharray="138.23"
								stroke-dashoffset={138.23 - (clickCount / 3) * 138.23}
							/>
						</svg>
						<img src={userData.avatar_url} alt="{userData.login}" class="user-avatar" />
					</div>
				</button>
				<div class="user-details">
					<span class="user-name">{userData.name || userData.login}</span>
					<span class="user-meta">@{userData.login} · {userData.public_repos} repos · {userData.followers} followers</span>
				</div>
				{#if refreshMessage}
					<span class="refresh-message">{refreshMessage}</span>
				{/if}
			</section>

			<!-- Time Range Selector -->
			<div class="time-range-selector">
				<Calendar size={18} />
				<label for="time-range">Time Range:</label>
				<select id="time-range" value={timeRange} onchange={handleTimeRangeChange}>
					<option value="all">All Time</option>
					<option value="6months">Last 6 Months</option>
					<option value="30days">Last 30 Days</option>
					<option value="today">Today</option>
				</select>

				<span class="selector-divider"></span>

				<FolderGit2 size={18} />
				<label for="repo-limit">Repos:</label>
				<select id="repo-limit" value={repoLimit} onchange={handleRepoLimitChange}>
					<option value="15">Top 15</option>
					<option value="25">Top 25</option>
					<option value="35">Top 35</option>
					<option value="50">All (50 max)</option>
				</select>

				{#if lastRefreshed}
					<span class="selector-divider"></span>
					<span class="last-refreshed-inline">
						<RefreshCw size={14} /> {formatRefreshTime(lastRefreshed)}
					</span>
				{/if}
			</div>

			<!-- Stats Cards -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon"><GitCommit size={24} /></div>
					<div class="stat-value">{formatNumber(stats.total_commits)}</div>
					<div class="stat-label">Commits (Top {stats.repos_analyzed} Repos)</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon additions"><Plus size={24} /></div>
					<div class="stat-value additions">+{formatNumber(stats.total_additions)}</div>
					<div class="stat-label">Lines Added</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon deletions"><Minus size={24} /></div>
					<div class="stat-value deletions">-{formatNumber(stats.total_deletions)}</div>
					<div class="stat-label">Lines Deleted</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon"><FolderGit2 size={24} /></div>
					<div class="stat-value">{stats.repos_analyzed}</div>
					<div class="stat-label">Repos Analyzed</div>
				</div>
			</div>

			<!-- Charts -->
			<div class="charts-grid">
				<section class="card chart-card">
					<h3><Clock size={20} /> When Do I Code?</h3>
					<div class="chart-container">
						<canvas bind:this={hoursCanvas}></canvas>
					</div>
				</section>

				<section class="card chart-card">
					<h3><CalendarDays size={20} /> Most Active Days</h3>
					<div class="chart-container">
						<canvas bind:this={daysCanvas}></canvas>
					</div>
				</section>
			</div>

			<!-- Heatmap -->
			<Heatmap activity={activityData} days={365} />

			<!-- Top Repos -->
			<section class="card">
				<h3><FolderGit2 size={20} /> Top Repositories</h3>
				{#if Object.keys(stats.commits_by_repo).length > 0}
					<div class="repo-list">
						{#each Object.entries(stats.commits_by_repo) as [repo, commitCount]}
							<div class="repo-item">
								<div class="repo-info">
									<span class="repo-name">{repo}</span>
									{#if getRepoDescription(repo)}
										<span class="repo-description">{getRepoDescription(repo)}</span>
									{/if}
								</div>
								<span class="repo-commits">{commitCount} commits</span>
							</div>
						{/each}
					</div>
				{:else}
					<p>No repository data available.</p>
				{/if}
			</section>

			<!-- Recent Commits -->
			<section class="card">
				<h3><GitCommit size={20} /> Recent Commits</h3>
				{#if commits && commits.length > 0}
					<div class="commits-list-container">
						{#each commits as commit}
							<div class="commit-item">
								<div class="commit-header">
									<span class="commit-sha">{commit.sha}</span>
									<span class="commit-date">{formatDate(commit.date)}</span>
									<span class="commit-repo-name"><em>{commit.repo}</em></span>
								</div>
								<div class="commit-message">{commit.message}</div>
								<div class="commit-stats">
									<span class="additions">+{commit.additions}</span>
									<span class="deletions">-{commit.deletions}</span>
								</div>
							</div>
						{/each}

						<!-- Loading indicator -->
						{#if commitsLoading}
							<div class="commits-loading">Loading more commits...</div>
						{/if}

						<!-- Limit reached message -->
						{#if commitsLimitReached}
							<div class="commits-limit-reached">
								You've hit the limit! There's more commits out there, but that's all you can see here.
							</div>
						{:else if !commitsHasMore && commits.length > 0}
							<div class="commits-end">No more commits to load.</div>
						{/if}

						<!-- Sentinel element for infinite scroll -->
						{#if commitsHasMore && !commitsLimitReached}
							<div bind:this={sentinelElement} class="commits-sentinel"></div>
						{/if}
					</div>
				{:else if !commitsLoading}
					<p>No recent commits found.</p>
				{:else}
					<div class="commits-loading">Loading commits...</div>
				{/if}
			</section>

			<!-- Footer with Source Link and Attribution -->
			<footer class="dashboard-footer">
				<p>
					<a href="https://github.com/AutumnsGrove/AutumnsGrove" target="_blank" rel="noopener noreferrer">
						<Code size={16} /> View Source Code <ExternalLink size={14} />
					</a>
				</p>
				<p class="attribution">Stats analyzed with Claude AI</p>
			</footer>
		</div>
	{/if}
</div>

<style>
	.site-warning {
		background: #fff3cd;
		border: 1px solid #ffc107;
		color: #856404;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	:global(.dark) .site-warning {
		background: #3d3200;
		border-color: #ffc107;
		color: #ffd54f;
	}

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
		color: var(--color-text-muted-dark);
	}

	/* Explanation Content */
	.explanation-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.explanation-item {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e8e8e8;
	}

	.explanation-item:last-child {
		padding-bottom: 0;
		border-bottom: none;
	}

	:global(.dark) .explanation-item {
		border-bottom-color: #333;
	}

	.explanation-item strong {
		display: block;
		color: #2c5f2d;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	:global(.dark) .explanation-item strong {
		color: #5cb85f;
	}

	.explanation-item p {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
		line-height: 1.4;
	}

	:global(.dark) .explanation-item p {
		color: var(--color-text-subtle-dark);
	}

	.loading-indicator {
		text-align: center;
		padding: 1rem;
		color: #666;
		font-style: italic;
	}

	:global(.dark) .loading-indicator {
		color: var(--color-text-muted-dark);
	}

	/* Compact User Card */
	.user-card-compact {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	:global(.dark) .user-card-compact {
		background: #2a2a2a;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.avatar-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
		transition: transform 0.15s ease;
	}

	.avatar-button:hover {
		transform: scale(1.05);
	}

	.avatar-button:active {
		transform: scale(0.95);
	}

	.avatar-wrapper {
		position: relative;
		width: 48px;
		height: 48px;
	}

	.progress-ring {
		position: absolute;
		top: 0;
		left: 0;
		width: 48px;
		height: 48px;
		transform: rotate(-90deg);
	}

	.progress-ring-circle {
		fill: none;
		stroke: #5cb85f;
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.2s ease;
	}

	.user-avatar {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: block;
	}

	.refresh-message {
		margin-left: auto;
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background: #e8f5e9;
		color: #2c5f2d;
	}

	:global(.dark) .refresh-message {
		background: #1b3a1b;
		color: #5cb85f;
	}

	/* Time Range Selector */
	.time-range-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .time-range-selector {
		background: #2a2a2a;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.time-range-selector label {
		font-weight: 500;
		color: #2c5f2d;
		font-size: 0.9rem;
	}

	:global(.dark) .time-range-selector label {
		color: #5cb85f;
	}

	.time-range-selector select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		color: #333;
		font-size: 0.9rem;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.time-range-selector select:hover {
		border-color: #5cb85f;
	}

	.time-range-selector select:focus {
		outline: none;
		border-color: #2c5f2d;
		box-shadow: 0 0 0 2px rgba(92, 184, 95, 0.2);
	}

	:global(.dark) .time-range-selector select {
		background: #333;
		border-color: #444;
		color: #eee;
	}

	:global(.dark) .time-range-selector select:hover {
		border-color: #5cb85f;
	}

	:global(.dark) .time-range-selector select:focus {
		border-color: #5cb85f;
		box-shadow: 0 0 0 2px rgba(92, 184, 95, 0.3);
	}

	.selector-divider {
		width: 1px;
		height: 24px;
		background: #ddd;
		margin: 0 0.5rem;
	}

	:global(.dark) .selector-divider {
		background: #444;
	}

	.last-refreshed-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #666;
		margin-left: auto;
	}

	:global(.dark) .last-refreshed-inline {
		color: var(--color-text-subtle-dark);
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.user-name {
		font-weight: 600;
		font-size: 1rem;
		color: #2c5f2d;
	}

	:global(.dark) .user-name {
		color: #5cb85f;
	}

	.user-meta {
		font-size: 0.8rem;
		color: #666;
	}

	:global(.dark) .user-meta {
		color: var(--color-text-muted-dark);
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

	.card h3 {
		margin: 0 0 1rem;
		color: #2c5f2d;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

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

	.stat-icon {
		color: #2c5f2d;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .stat-icon {
		color: #5cb85f;
	}

	.stat-icon.additions {
		color: #28a745;
	}

	.stat-icon.deletions {
		color: #dc3545;
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
		color: var(--color-text-muted-dark);
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
		align-items: flex-start;
		padding: 0.75rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	:global(.dark) .repo-item {
		background: #333;
	}

	.repo-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		margin-right: 1rem;
	}

	.repo-name {
		font-weight: 500;
	}

	.repo-description {
		font-size: 0.8rem;
		color: #666;
		line-height: 1.3;
	}

	:global(.dark) .repo-description {
		color: var(--color-text-subtle-dark);
	}

	.repo-commits {
		color: #666;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	:global(.dark) .repo-commits {
		color: var(--color-text-muted-dark);
	}

	/* Scrollable commits container */
	.commits-list-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 600px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.commits-list-container::-webkit-scrollbar {
		width: 6px;
	}

	.commits-list-container::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	.commits-list-container::-webkit-scrollbar-thumb {
		background: #ccc;
		border-radius: 3px;
	}

	:global(.dark) .commits-list-container::-webkit-scrollbar-track {
		background: #333;
	}

	:global(.dark) .commits-list-container::-webkit-scrollbar-thumb {
		background: #555;
	}

	/* Pagination elements */
	.commits-loading {
		text-align: center;
		padding: 1rem;
		color: #666;
		font-style: italic;
	}

	:global(.dark) .commits-loading {
		color: var(--color-text-muted-dark);
	}

	.commits-limit-reached {
		text-align: center;
		padding: 1.5rem 1rem;
		background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
		border-radius: 8px;
		color: #856404;
		font-weight: 500;
		border: 1px solid #ffc107;
	}

	:global(.dark) .commits-limit-reached {
		background: linear-gradient(135deg, #3d3520 0%, #4a4025 100%);
		color: #ffc107;
		border-color: #ffc107;
	}

	.commits-end {
		text-align: center;
		padding: 1rem;
		color: #666;
		font-size: 0.9rem;
	}

	:global(.dark) .commits-end {
		color: var(--color-text-subtle-dark);
	}

	.commits-sentinel {
		height: 20px;
		width: 100%;
	}

	.commit-item {
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	:global(.dark) .commit-item {
		background: #333;
	}

	.commit-header {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
	}

	.commit-sha {
		font-family: monospace;
		background: #e0e0e0;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	:global(.dark) .commit-sha {
		background: #444;
	}

	.commit-repo-name {
		color: #2c5f2d;
	}

	:global(.dark) .commit-repo-name {
		color: #5cb85f;
	}

	.commit-date {
		color: #666;
	}

	:global(.dark) .commit-date {
		color: var(--color-text-muted-dark);
	}

	.commit-message {
		margin-bottom: 0.5rem;
		line-height: 1.4;
		word-break: break-word;
		white-space: pre-wrap;
	}

	.commit-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		font-family: monospace;
	}

	/* Footer styles */
	.dashboard-footer {
		text-align: center;
		padding: 1.5rem 0;
		margin-top: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	:global(.dark) .dashboard-footer {
		border-top-color: #444;
	}

	.dashboard-footer a {
		color: #2c5f2d;
		text-decoration: none;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.dashboard-footer a:hover {
		text-decoration: underline;
	}

	:global(.dark) .dashboard-footer a {
		color: #5cb85f;
	}

	.dashboard-footer .attribution {
		font-size: 0.8rem;
		color: #888;
		margin-top: 0.5rem;
	}

	:global(.dark) .dashboard-footer .attribution {
		color: var(--color-text-subtle-dark);
	}

	.additions {
		color: #28a745;
	}

	.deletions {
		color: #dc3545;
	}

	@media (max-width: 600px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.dashboard {
			padding: 0 0.5rem;
		}

		.user-card-compact {
			flex-wrap: wrap;
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.user-details {
			flex: 1;
			min-width: 0;
		}

		.user-meta {
			font-size: 0.75rem;
			word-break: break-word;
		}

		.refresh-message {
			width: 100%;
			text-align: center;
			margin-left: 0;
		}

		.time-range-selector {
			flex-wrap: wrap;
			gap: 0.5rem;
			padding: 0.75rem;
		}

		.time-range-selector label {
			font-size: 0.8rem;
		}

		.time-range-selector select {
			padding: 0.4rem 0.5rem;
			font-size: 0.85rem;
			flex: 1;
			min-width: 80px;
		}

		.selector-divider {
			display: none;
		}

		.chart-card {
			height: auto;
			min-height: 280px;
		}

		.chart-container {
			height: 200px;
		}

		.stat-card {
			padding: 1rem;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.stat-label {
			font-size: 0.75rem;
		}

		.card {
			padding: 1rem;
			border-radius: 8px;
		}

		.commit-header {
			font-size: 0.75rem;
		}

		.commit-sha {
			font-size: 0.7rem;
		}

		.repo-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.repo-info {
			margin-right: 0;
		}

		.repo-commits {
			align-self: flex-start;
		}
	}
</style>
