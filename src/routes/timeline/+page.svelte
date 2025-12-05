<script>
	import { marked } from 'marked';
	import { sanitizeMarkdown } from '@autumnsgrove/groveengine/utils';
	import { Calendar, GitCommit, Plus, Minus, FolderGit2, ChevronDown, ChevronUp, Cloud, Loader2, MessageCircle, TrendingUp } from 'lucide-svelte';
	import { ActivityOverview, LOCBar, RepoBreakdown } from '$lib/components/charts';
	import { toast } from '@autumnsgrove/groveengine/ui';

	/** @type {{ summaries: any[], pagination: any, error?: string }} */
	let { data } = $props();

	let summaries = $state(data.summaries || []);
	let pagination = $state(data.pagination);
	let loadingMore = $state(false);
	let expandedCards = $state(new Set());

	// Activity data for the overview chart
	let contributionData = $state([]);  // For heatmap (from GitHub contributions API)
	let locData = $state({ additions: 0, deletions: 0 });  // For footer (from DB)
	let loadingActivity = $state(true);

	// Fetch activity data on mount - dual fetch for contributions + LOC
	async function fetchActivity() {
		loadingActivity = true;
		try {
			// Fetch both in parallel: GitHub contributions for heatmap, DB for LOC
			const [contribRes, activityRes] = await Promise.all([
				fetch('/api/git/contributions/AutumnMorning'),
				fetch('/api/timeline/activity?days=14')
			]);

			if (contribRes.ok) {
				const data = await contribRes.json();
				contributionData = data.activity || [];
			}

			if (activityRes.ok) {
				const data = await activityRes.json();
				locData = {
					additions: data.totals?.additions || 0,
					deletions: data.totals?.deletions || 0
				};
			}
		} catch (e) {
			toast.error('Failed to load activity data');
			console.error('Failed to fetch activity:', e);
		}
		loadingActivity = false;
	}

	// Fetch activity on mount
	$effect(() => {
		fetchActivity();
	});

	// Configure marked for safe rendering
	marked.setOptions({
		headerIds: false,
		mangle: false,
		breaks: true
	});

	// Fun rest day messages
	const REST_DAY_MESSAGES = [
		"Taking a well-deserved break from the keyboard",
		"Probably gaming instead of coding today",
		"Coffee > Code (just for today)",
		"Even developers need a day off",
		"Learning by not coding (it's a thing)",
		"Recharging the creative batteries",
		"Binge-watching something instead",
		"Pizza and chill, no commits to fulfill",
		"Practicing the ancient art of doing nothing",
		"Cat probably sat on the keyboard, preventing all work",
		"Touching grass (the outdoor kind)",
		"Debugging life instead of code",
		"AFK - Away From Keyboard",
		"Plot twist: no bugs to fix today"
	];

	// Get a consistent random message for a date
	function getRestDayMessage(date) {
		const hash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return REST_DAY_MESSAGES[hash % REST_DAY_MESSAGES.length];
	}

	// Format date nicely
	function formatDate(dateStr) {
		const date = new Date(dateStr + 'T12:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format short date for mobile
	function formatShortDate(dateStr) {
		const date = new Date(dateStr + 'T12:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	// Check if date is today
	function isToday(dateStr) {
		const today = new Date().toISOString().split('T')[0];
		return dateStr === today;
	}

	// GitHub username for repo links
	const GITHUB_USERNAME = 'AutumnsGrove';

	/**
	 * Get gutter items grouped by their anchor header
	 */
	function getGutterItemsByAnchor(gutterItems) {
		const grouped = {};
		for (const item of gutterItems) {
			// Extract header name from anchor (e.g., "### ProjectName" -> "ProjectName")
			const headerName = item.anchor?.replace(/^#+\s*/, '').trim() || 'General';
			if (!grouped[headerName]) {
				grouped[headerName] = [];
			}
			grouped[headerName].push(item);
		}
		return grouped;
	}

	/**
	 * Render markdown to HTML with repo links and inject gutter comments after headers
	 */
	function renderMarkdownWithGutter(text, gutterItems = []) {
		if (!text) return '';

		// Group gutter items by their anchor header
		const gutterByHeader = getGutterItemsByAnchor(gutterItems);

		// Convert ### RepoName headers to GitHub links
		let withRepoLinks = text.replace(
			/^### (.+)$/gm,
			(match, repoName) => {
				const cleanName = repoName.trim();
				return `### [${cleanName}](https://github.com/${GITHUB_USERNAME}/${cleanName})`;
			}
		);

		// Parse to HTML first and sanitize to prevent XSS
		let html = sanitizeMarkdown(marked.parse(withRepoLinks));

		// Inject gutter comments after their corresponding h3 headers
		for (const [headerName, items] of Object.entries(gutterByHeader)) {
			// Build the gutter HTML for this header
			const gutterHtml = items.map(item =>
				`<div class="inline-gutter-comment"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg><span>${escapeHtml(item.content)}</span></div>`
			).join('');

			// Find the h3 with this header name (as a link or plain text)
			// Match both linked and unlinked versions
			const linkPattern = new RegExp(
				`(<h3>\\s*<a[^>]*>\\s*${escapeRegex(headerName)}\\s*</a>\\s*</h3>)`,
				'i'
			);
			const plainPattern = new RegExp(
				`(<h3>\\s*${escapeRegex(headerName)}\\s*</h3>)`,
				'i'
			);

			// Try linked version first, then plain
			if (linkPattern.test(html)) {
				html = html.replace(linkPattern, `$1\n<div class="header-gutter-group">${gutterHtml}</div>`);
			} else if (plainPattern.test(html)) {
				html = html.replace(plainPattern, `$1\n<div class="header-gutter-group">${gutterHtml}</div>`);
			}
		}

		return html;
	}

	// Helper to escape HTML special characters (SSR-safe)
	function escapeHtml(text) {
		if (!text) return '';
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// Helper to escape regex special characters
	function escapeRegex(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// Legacy function for backwards compatibility
	function renderMarkdown(text) {
		return renderMarkdownWithGutter(text, []);
	}

	// Toggle card expansion
	function toggleCard(id) {
		if (expandedCards.has(id)) {
			expandedCards.delete(id);
			expandedCards = new Set(expandedCards);
		} else {
			expandedCards.add(id);
			expandedCards = new Set(expandedCards);
		}
	}

	// Load more summaries
	async function loadMore() {
		if (loadingMore || !pagination.hasMore) return;

		loadingMore = true;
		try {
			const newOffset = pagination.offset + pagination.limit;
			const response = await fetch(`/api/timeline?limit=${pagination.limit}&offset=${newOffset}`);
			if (!response.ok) throw new Error('Failed to load more');

			const data = await response.json();
			summaries = [...summaries, ...data.summaries];
			pagination = data.pagination;
		} catch (error) {
			toast.error('Failed to load more summaries');
			console.error('Load more error:', error);
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>Development Timeline - AutumnsGrove</title>
	<meta name="description" content="Daily development activity and progress over time" />
</svelte:head>

<div class="timeline-page">
	<header class="timeline-header">
		<h1><Calendar size={28} /> Development Timeline</h1>
		<p>Daily summaries of Autumn's coding adventures, powered by AI</p>
	</header>

	{#if data.error}
		<div class="error-message">
			<p>Failed to load timeline: {data.error}</p>
		</div>
	{:else if summaries.length === 0}
		<div class="empty-state">
			<Cloud size={48} />
			<h2>No summaries yet</h2>
			<p>Daily summaries will appear here once the automated system starts generating them.</p>
		</div>
	{:else}
		<!-- Activity Overview Chart -->
		{#if !loadingActivity && contributionData.length > 0}
			<ActivityOverview data={contributionData} {locData} days={14} />
		{:else if loadingActivity}
			<div class="activity-loading">
				<Loader2 size={16} class="spinner" />
				<span>Loading activity...</span>
			</div>
		{/if}

		<div class="timeline-cards">
			{#each summaries as summary (summary.id)}
				{@const isRestDay = summary.commit_count === 0}
				{@const isExpanded = expandedCards.has(summary.id)}
				{@const gutterItems = summary.gutter_content || []}

				<article class="timeline-card" class:rest-day={isRestDay} class:today={isToday(summary.summary_date)}>
					<header class="card-header">
						<div class="date-info">
							<span class="date-full">{formatDate(summary.summary_date)}</span>
							<span class="date-short">{formatShortDate(summary.summary_date)}</span>
							{#if isToday(summary.summary_date)}
								<span class="today-badge">Today</span>
							{/if}
						</div>
						<div class="commit-badge" class:rest-badge={isRestDay}>
							{#if isRestDay}
								<Cloud size={14} />
								<span>Rest Day</span>
							{:else}
								<GitCommit size={14} />
								<span>{summary.commit_count} commit{summary.commit_count !== 1 ? 's' : ''}</span>
							{/if}
						</div>
					</header>

					<div class="card-content">
						{#if isRestDay}
							<p class="rest-message">{getRestDayMessage(summary.summary_date)}</p>
						{:else}
							<p class="brief-summary">{summary.brief_summary}</p>

							<div class="meta-info">
								<span class="repos">
									<FolderGit2 size={14} />
									{summary.repos_active?.join(', ') || 'Unknown'}
								</span>
								<span class="changes">
									<Plus size={14} class="plus-icon" />
									{summary.total_additions.toLocaleString()}
									<Minus size={14} class="minus-icon" />
									{summary.total_deletions.toLocaleString()}
								</span>
							</div>

							<!-- Visual charts for this day -->
							<div class="day-charts">
								<LOCBar
									additions={summary.total_additions}
									deletions={summary.total_deletions}
									maxWidth={120}
									height={6}
								/>
								{#if summary.repos_active?.length > 1}
									<RepoBreakdown
										repos={summary.repos_active.map(name => ({ name }))}
										maxWidth={120}
										showLegend={false}
									/>
								{/if}
							</div>

							{#if summary.detailed_timeline}
								<button
									class="expand-btn"
									onclick={() => toggleCard(summary.id)}
									aria-expanded={isExpanded}
								>
									{#if isExpanded}
										<ChevronUp size={16} />
										<span>Hide Details</span>
									{:else}
										<ChevronDown size={16} />
										<span>Show Details</span>
									{/if}
								</button>

								{#if isExpanded}
									<div class="detailed-section">
										<!-- Rendered markdown with inline gutter comments -->
										<div class="detailed-timeline markdown-content">
											{@html renderMarkdownWithGutter(summary.detailed_timeline, gutterItems)}
										</div>
									</div>
								{/if}
							{/if}
						{/if}
					</div>
				</article>
			{/each}
		</div>

		{#if pagination.hasMore}
			<div class="load-more-container">
				<button class="load-more-btn" onclick={loadMore} disabled={loadingMore}>
					{#if loadingMore}
						<Loader2 size={16} class="spinner" />
						<span>Loading...</span>
					{:else}
						<span>Load More</span>
					{/if}
				</button>
			</div>
		{/if}

		<footer class="timeline-footer">
			<p>
				Showing {summaries.length} of {pagination.total} days
			</p>
		</footer>
	{/if}
</div>

<style>
	.timeline-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
	}
	.timeline-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	.timeline-header h1 {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #2c5f2d;
		margin: 0;
		font-size: 1.75rem;
	}
	:global(.dark) .timeline-header h1 {
		color: var(--grove-500);
	}
	.timeline-header p {
		color: #666;
		margin: 0.5rem 0 0;
	}
	:global(.dark) .timeline-header p {
		color: var(--color-muted-foreground);
	}
	/* Activity Loading */
	.activity-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: #666;
		font-size: 0.85rem;
	}
	:global(.dark) .activity-loading {
		color: var(--color-muted-foreground);
	}
	.activity-loading :global(.spinner) {
		animation: spin 1s linear infinite;
	}
	/* Error and Empty States */
	.error-message {
		text-align: center;
		padding: 2rem;
		background: #fee;
		border-radius: 8px;
		color: var(--color-error);
	}
	:global(.dark) .error-message {
		background: var(--color-error-light);
		color: var(--color-error);
	}
	.empty-state {
		text-align: center;
		padding: 3rem;
		background: var(--cream-200);
		border-radius: 12px;
		color: #666;
	}
	:global(.dark) .empty-state {
		background: var(--cream-300);
		color: var(--color-muted-foreground);
	}
	.empty-state h2 {
		margin: 1rem 0 0.5rem;
		color: #2c5f2d;
	}
	:global(.dark) .empty-state h2 {
		color: var(--grove-500);
	}
	/* Timeline Cards */
	.timeline-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.timeline-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.timeline-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}
	:global(.dark) .timeline-card {
		background: var(--cream-300);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}
	:global(.dark) .timeline-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	}
	/* Rest day styling */
	.timeline-card.rest-day {
		background: #f8f9fa;
		opacity: 0.85;
	}
	:global(.dark) .timeline-card.rest-day {
		background: var(--cream-200);
	}
	/* Today styling */
	.timeline-card.today {
		border: 2px solid var(--grove-500);
	}
	/* Card Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--bark-400);
	}
	:global(.dark) .card-header {
		border-bottom-color: var(--color-border-strong);
	}
	.date-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.date-full {
		font-weight: 600;
		color: var(--color-foreground);
	}
	.date-short {
		display: none;
		font-weight: 600;
		color: var(--color-foreground);
	}
	.today-badge {
		background: var(--grove-500);
		color: white;
		font-size: 0.7rem;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-weight: 600;
		text-transform: uppercase;
	}
	.commit-badge {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: #e8f5e9;
		color: #2c5f2d;
		padding: 0.35rem 0.65rem;
		border-radius: 16px;
		font-size: 0.85rem;
		font-weight: 500;
	}
	:global(.dark) .commit-badge {
		background: var(--cream-200);
		color: var(--grove-500);
	}
	.commit-badge.rest-badge {
		background: var(--color-foreground);
		color: var(--bark-500);
	}
	:global(.dark) .commit-badge.rest-badge {
		background: var(--color-border-strong);
		color: var(--bark-500);
	}
	/* Card Content */
	.card-content {
		padding: 1rem;
	}
	.rest-message {
		font-style: italic;
		color: var(--bark-500);
		margin: 0;
		font-size: 0.95rem;
	}
	:global(.dark) .rest-message {
		color: #777;
	}
	.brief-summary {
		margin: 0 0 0.75rem;
		color: var(--color-foreground);
		line-height: 1.5;
	}
	.meta-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.75rem;
	}
	:global(.dark) .meta-info {
		color: var(--color-muted-foreground);
	}
	.repos, .changes {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.changes :global(.plus-icon) {
		color: var(--grove-500);
	}
	.changes :global(.minus-icon) {
		color: var(--color-error);
	}
	/* Day Charts */
	.day-charts {
		display: flex;
		gap: 1rem;
		margin: 0.5rem 0;
		padding: 0.5rem 0;
		border-top: 1px dashed var(--bark-400);
	}
	:global(.dark) .day-charts {
		border-top-color: var(--color-border-strong);
	}
	/* Expand Button */
	.expand-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: 1px solid var(--cream-100);
		border-radius: 6px;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		color: #666;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.expand-btn:hover {
		background: var(--cream-300);
		border-color: var(--color-muted-foreground);
	}
	:global(.dark) .expand-btn {
		border-color: var(--cream-100);
		color: var(--color-muted-foreground);
	}
	:global(.dark) .expand-btn:hover {
		background: var(--color-border-strong);
		border-color: var(--color-muted-foreground);
	}
	/* Detailed Section */
	.detailed-section {
		margin-top: 0.75rem;
	}
	/* Inline Gutter Comments - anchored below headers */
	.markdown-content :global(.header-gutter-group) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.35rem 0 0.75rem;
	}
	.markdown-content :global(.inline-gutter-comment) {
		display: inline-flex;
		align-items: flex-start;
		gap: 0.35rem;
		padding: 0.4rem 0.6rem;
		background: linear-gradient(135deg, #f0f7f0 0%, #e8f5e9 100%);
		border-left: 2px solid var(--grove-500);
		border-radius: 0 4px 4px 0;
		font-size: 0.78rem;
		color: var(--color-muted-foreground);
		line-height: 1.35;
		font-style: italic;
	}
	:global(.dark) .markdown-content :global(.inline-gutter-comment) {
		background: linear-gradient(135deg, var(--cream-200) 0%, var(--cream-200) 100%);
		border-left-color: var(--grove-500);
		color: var(--color-muted-foreground);
	}
	.markdown-content :global(.inline-gutter-comment svg) {
		flex-shrink: 0;
		color: var(--grove-500);
		opacity: 0.7;
		margin-top: 0.1rem;
	}
	/* Detailed Timeline - Markdown Content */
	.detailed-timeline {
		padding: 1rem;
		background: var(--cream-200);
		border-radius: 8px;
		font-size: 0.9rem;
		color: var(--color-muted-foreground);
		line-height: 1.6;
	}
	/* Markdown Styling */
	.markdown-content :global(h2) {
		font-size: 1.1rem;
		color: #2c5f2d;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}
	:global(.dark) .markdown-content :global(h2) {
		color: var(--grove-500);
		border-bottom-color: var(--color-border-strong);
	}
	.markdown-content :global(h3) {
		font-size: 1rem;
		color: var(--color-muted-foreground);
		margin: 1rem 0 0.5rem;
	}
	.markdown-content :global(h3 a) {
		color: #2c5f2d;
		text-decoration: none;
		border-bottom: 1px dashed #2c5f2d;
		transition: all 0.15s ease;
	}
	.markdown-content :global(h3 a:hover) {
		color: var(--grove-700);
		border-bottom-style: solid;
	}
	:global(.dark) .markdown-content :global(h3 a) {
		color: var(--grove-500);
		border-bottom-color: var(--grove-500);
	}
	:global(.dark) .markdown-content :global(h3 a:hover) {
		color: var(--grove-400);
	}
	.markdown-content :global(a) {
		color: #2c5f2d;
		text-decoration: underline;
	}
	:global(.dark) .markdown-content :global(a) {
		color: var(--grove-500);
	}
	.markdown-content :global(ul) {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}
	.markdown-content :global(li) {
		margin-bottom: 0.25rem;
	}
	.markdown-content :global(p) {
		margin: 0.5rem 0;
	}
	.markdown-content :global(code) {
		background: var(--color-border-strong);
		padding: 0.15rem 0.35rem;
		border-radius: 3px;
		font-size: 0.85em;
	}
	:global(.dark) .markdown-content :global(code) {
		background: var(--color-border-strong);
	}
	/* Load More */
	.load-more-container {
		text-align: center;
		margin-top: 2rem;
	}
	.load-more-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--grove-500);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.load-more-btn:hover:not(:disabled) {
		background: var(--grove-700);
	}
	.load-more-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	.load-more-btn :global(.spinner) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	/* Footer */
	.timeline-footer {
		text-align: center;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--bark-400);
		color: var(--bark-500);
		font-size: 0.9rem;
	}
	:global(.dark) .timeline-footer {
		border-top-color: var(--color-border-strong);
		color: #666;
	}
	/* Mobile Responsiveness */
	@media (max-width: 600px) {
		.date-full {
			display: none;
		}
		.date-short {
			display: block;
		}
		.card-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		.meta-info {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
