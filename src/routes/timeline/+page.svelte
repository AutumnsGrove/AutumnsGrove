<script>
	import { marked } from 'marked';
	import { Calendar, GitCommit, Plus, Minus, FolderGit2, ChevronDown, ChevronUp, Cloud, Loader2, MessageCircle } from 'lucide-svelte';

	/** @type {{ summaries: any[], pagination: any, error?: string }} */
	let { data } = $props();

	let summaries = $state(data.summaries || []);
	let pagination = $state(data.pagination);
	let loadingMore = $state(false);
	let expandedCards = $state(new Set());

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

	// Render markdown to HTML with repo links
	function renderMarkdown(text) {
		if (!text) return '';

		// Convert ### RepoName headers to GitHub links
		const withRepoLinks = text.replace(
			/^### (.+)$/gm,
			(match, repoName) => {
				const cleanName = repoName.trim();
				return `### [${cleanName}](https://github.com/${GITHUB_USERNAME}/${cleanName})`;
			}
		);

		return marked.parse(withRepoLinks);
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
										<!-- Gutter comments (if any) -->
										{#if gutterItems.length > 0}
											<aside class="gutter-comments">
												{#each gutterItems as item}
													<div class="gutter-comment">
														<MessageCircle size={14} />
														<span>{item.content}</span>
													</div>
												{/each}
											</aside>
										{/if}

										<!-- Rendered markdown -->
										<div class="detailed-timeline markdown-content">
											{@html renderMarkdown(summary.detailed_timeline)}
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
		color: #5cb85f;
	}

	.timeline-header p {
		color: #666;
		margin: 0.5rem 0 0;
	}

	:global(.dark) .timeline-header p {
		color: var(--color-text-muted-dark, #999);
	}

	/* Error and Empty States */
	.error-message {
		text-align: center;
		padding: 2rem;
		background: #fee;
		border-radius: 8px;
		color: #c00;
	}

	:global(.dark) .error-message {
		background: #3a2020;
		color: #f88;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f9f9f9;
		border-radius: 12px;
		color: #666;
	}

	:global(.dark) .empty-state {
		background: #2a2a2a;
		color: #999;
	}

	.empty-state h2 {
		margin: 1rem 0 0.5rem;
		color: #2c5f2d;
	}

	:global(.dark) .empty-state h2 {
		color: #5cb85f;
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
		background: #2a2a2a;
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
		background: #252525;
	}

	/* Today styling */
	.timeline-card.today {
		border: 2px solid #5cb85f;
	}

	/* Card Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	:global(.dark) .card-header {
		border-bottom-color: #333;
	}

	.date-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.date-full {
		font-weight: 600;
		color: #333;
	}

	.date-short {
		display: none;
		font-weight: 600;
		color: #333;
	}

	:global(.dark) .date-full,
	:global(.dark) .date-short {
		color: #eee;
	}

	.today-badge {
		background: #5cb85f;
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
		background: #1b3a1b;
		color: #5cb85f;
	}

	.commit-badge.rest-badge {
		background: #f0f0f0;
		color: #888;
	}

	:global(.dark) .commit-badge.rest-badge {
		background: #333;
		color: #888;
	}

	/* Card Content */
	.card-content {
		padding: 1rem;
	}

	.rest-message {
		font-style: italic;
		color: #888;
		margin: 0;
		font-size: 0.95rem;
	}

	:global(.dark) .rest-message {
		color: #777;
	}

	.brief-summary {
		margin: 0 0 0.75rem;
		color: #333;
		line-height: 1.5;
	}

	:global(.dark) .brief-summary {
		color: #ddd;
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
		color: #999;
	}

	.repos, .changes {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.changes :global(.plus-icon) {
		color: #28a745;
	}

	.changes :global(.minus-icon) {
		color: #dc3545;
	}

	/* Expand Button */
	.expand-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		color: #666;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.expand-btn:hover {
		background: #f5f5f5;
		border-color: #ccc;
	}

	:global(.dark) .expand-btn {
		border-color: #444;
		color: #999;
	}

	:global(.dark) .expand-btn:hover {
		background: #333;
		border-color: #555;
	}

	/* Detailed Section with Gutter */
	.detailed-section {
		margin-top: 1rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.detailed-section {
			grid-template-columns: 180px 1fr;
		}
	}

	/* Gutter Comments */
	.gutter-comments {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@media (max-width: 767px) {
		.gutter-comments {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}

	.gutter-comment {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		background: #f0f7f0;
		border-left: 3px solid #5cb85f;
		border-radius: 0 6px 6px 0;
		font-size: 0.8rem;
		color: #555;
		line-height: 1.4;
	}

	:global(.dark) .gutter-comment {
		background: #1a2a1a;
		border-left-color: #5cb85f;
		color: #aaa;
	}

	.gutter-comment :global(svg) {
		flex-shrink: 0;
		color: #5cb85f;
		margin-top: 0.1rem;
	}

	/* Detailed Timeline - Markdown Content */
	.detailed-timeline {
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #444;
		line-height: 1.6;
	}

	:global(.dark) .detailed-timeline {
		background: #222;
		color: #ccc;
	}

	/* Markdown Styling */
	.markdown-content :global(h2) {
		font-size: 1.1rem;
		color: #2c5f2d;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	:global(.dark) .markdown-content :global(h2) {
		color: #5cb85f;
		border-bottom-color: #333;
	}

	.markdown-content :global(h3) {
		font-size: 1rem;
		color: #444;
		margin: 1rem 0 0.5rem;
	}

	:global(.dark) .markdown-content :global(h3) {
		color: #ddd;
	}

	.markdown-content :global(h3 a) {
		color: #2c5f2d;
		text-decoration: none;
		border-bottom: 1px dashed #2c5f2d;
		transition: all 0.15s ease;
	}

	.markdown-content :global(h3 a:hover) {
		color: #4cae4c;
		border-bottom-style: solid;
	}

	:global(.dark) .markdown-content :global(h3 a) {
		color: #5cb85f;
		border-bottom-color: #5cb85f;
	}

	:global(.dark) .markdown-content :global(h3 a:hover) {
		color: #7cd97f;
	}

	.markdown-content :global(a) {
		color: #2c5f2d;
		text-decoration: underline;
	}

	:global(.dark) .markdown-content :global(a) {
		color: #5cb85f;
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
		background: #e8e8e8;
		padding: 0.15rem 0.35rem;
		border-radius: 3px;
		font-size: 0.85em;
	}

	:global(.dark) .markdown-content :global(code) {
		background: #333;
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
		background: #5cb85f;
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
		background: #4cae4c;
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
		border-top: 1px solid #eee;
		color: #888;
		font-size: 0.9rem;
	}

	:global(.dark) .timeline-footer {
		border-top-color: #333;
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
