<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Get initial values from URL params
	let searchQuery = $state($page.url.searchParams.get('q') || '');
	let selectedTag = $state($page.url.searchParams.get('tag') || '');

	// Debounced search query for performance
	let debouncedQuery = $state(searchQuery);
	let debounceTimer = $state(null);

	function debouncedSearchInput(event) {
		searchQuery = event.target.value;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Set new timer for debounced update
		debounceTimer = setTimeout(() => {
			debouncedQuery = searchQuery;
			updateUrl();
		}, 250);
	}

	// Pre-compute lowercase searchable fields for performance
	let postsWithLowercase = $derived.by(() => {
		return data.posts.map(post => ({
			...post,
			titleLower: post.title.toLowerCase(),
			descriptionLower: post.description.toLowerCase(),
			tagsLower: post.tags.map(tag => tag.toLowerCase())
		}));
	});

	// Filter posts based on search query and selected tag
	let filteredPosts = $derived.by(() => {
		let results = postsWithLowercase;

		// Filter by tag if selected
		if (selectedTag) {
			results = results.filter(post => post.tags.includes(selectedTag));
		}

		// Filter by search query (using debounced query)
		if (debouncedQuery.trim()) {
			const query = debouncedQuery.toLowerCase().trim();
			results = results.filter(post =>
				post.titleLower.includes(query) ||
				post.descriptionLower.includes(query) ||
				post.tagsLower.some(tag => tag.includes(query))
			);
		}

		return results;
	});

	// Update URL when filters change
	function updateUrl() {
		const params = new URLSearchParams();
		if (searchQuery.trim()) params.set('q', searchQuery.trim());
		if (selectedTag) params.set('tag', selectedTag);

		const newUrl = params.toString() ? `?${params.toString()}` : '/blog/search';
		goto(newUrl, { replaceState: true, keepFocus: true });
	}


	function selectTag(tag) {
		if (selectedTag === tag) {
			selectedTag = '';
		} else {
			selectedTag = tag;
		}
		updateUrl();
	}

	function clearFilters() {
		searchQuery = '';
		selectedTag = '';
		goto('/blog/search', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Search Blog - AutumnsGrove</title>
	<meta name="description" content="Search blog posts by keyword or filter by tags." />
</svelte:head>

<div class="search-header">
	<h1>Search Blog</h1>
	<p>Find posts by keyword or filter by tags.</p>
</div>

<div class="search-container">
	<div class="search-input-wrapper">
		<svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<path d="m21 21-4.3-4.3"></path>
		</svg>
		<input
			type="text"
			placeholder="Search posts..."
			value={searchQuery}
			oninput={debouncedSearchInput}
			class="search-input"
			required
		/>
		{#if searchQuery || selectedTag}
			<button class="clear-btn" onclick={clearFilters} aria-label="Clear search">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"></path>
					<path d="m6 6 12 12"></path>
				</svg>
			</button>
		{/if}
	</div>

	{#if data.allTags.length > 0}
		<div class="tags-filter">
			<span class="filter-label">Filter by tag:</span>
			<div class="tags">
				{#each data.allTags as tag (tag)}
					<button
						class="tag"
						class:active={selectedTag === tag}
						onclick={() => selectTag(tag)}
					>
						{tag}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<div class="results-info">
	{#if selectedTag || searchQuery}
		<p>
			Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
			{#if selectedTag}
				tagged with <strong>"{selectedTag}"</strong>
			{/if}
			{#if searchQuery}
				{#if selectedTag}and{/if} matching <strong>"{searchQuery}"</strong>
			{/if}
		</p>
	{:else}
		<p>Showing all {data.posts.length} posts</p>
	{/if}
</div>

{#if filteredPosts.length === 0}
	<div class="no-results">
		<p>No posts found matching your criteria.</p>
		<button class="reset-btn" onclick={clearFilters}>Clear filters</button>
	</div>
{:else}
	<div class="posts-grid">
		{#each filteredPosts as post (post.slug)}
			<article class="post-card">
				<a href="/blog/{post.slug}" class="post-link">
					<h2>{post.title}</h2>
					<div class="post-meta">
						<time datetime={post.date}>
							{new Date(post.date).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
						{#if post.tags.length > 0}
							<div class="tags">
								{#each post.tags as tag (tag)}
									<button
										class="tag"
										class:active={selectedTag === tag}
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); selectTag(tag); }}
										aria-label="Filter by tag: {tag}"
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					{#if post.description}
						<p class="description">{post.description}</p>
					{/if}
				</a>
			</article>
		{/each}
	</div>
{/if}

<style>
	.search-header {
		text-align: center;
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	.search-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
		transition: color 0.3s ease;
	}

	:global(.dark) .search-header h1 {
		color: #5cb85f;
	}

	.search-header p {
		color: #666;
		font-size: 1.1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .search-header p {
		color: var(--color-text-muted-dark);
	}

	.search-container {
		max-width: 800px;
		margin: 0 auto 2rem;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		color: #888;
		pointer-events: none;
		transition: color 0.3s ease;
	}

	:global(.dark) .search-icon {
		color: var(--color-text-subtle-dark);
	}

	.search-input {
		width: 100%;
		padding: 1rem 3rem;
		font-size: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		background: white;
		color: #333;
		transition: border-color 0.2s ease, background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) .search-input {
		background: #2a2a2a;
		border-color: #444;
		color: var(--color-text-dark);
	}

	.search-input:focus {
		outline: none;
		border-color: #2c5f2d;
	}

	:global(.dark) .search-input:focus {
		border-color: #5cb85f;
	}

	.search-input::placeholder {
		color: #999;
	}

	:global(.dark) .search-input::placeholder {
		color: #777;
	}

	.clear-btn {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #888;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s ease;
	}

	.clear-btn:hover {
		color: #666;
	}

	:global(.dark) .clear-btn {
		color: var(--color-text-subtle-dark);
	}

	:global(.dark) .clear-btn:hover {
		color: var(--color-text-dark);
	}

	.tags-filter {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.filter-label {
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	:global(.dark) .filter-label {
		color: var(--color-text-muted-dark);
	}

	.tags-filter .tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tags-filter .tag {
		cursor: pointer;
		user-select: none;
	}

	.tags-filter .tag.active {
		background: #2c5f2d;
	}

	:global(.dark) .tags-filter .tag.active {
		background: #5cb85f;
	}

	.results-info {
		max-width: 800px;
		margin: 0 auto 1.5rem;
	}

	.results-info p {
		color: #666;
		font-size: 0.95rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .results-info p {
		color: var(--color-text-muted-dark);
	}

	.results-info strong {
		color: #2c5f2d;
	}

	:global(.dark) .results-info strong {
		color: #5cb85f;
	}

	.no-results {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	:global(.dark) .no-results {
		color: var(--color-text-muted-dark);
	}

	.reset-btn {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: #2c5f2d;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.reset-btn:hover {
		background: #4a9d4f;
	}

	:global(.dark) .reset-btn {
		background: #5cb85f;
	}

	:global(.dark) .reset-btn:hover {
		background: #7cd97f;
	}

	.posts-grid {
		display: grid;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.post-card {
		background: white;
		border-radius: 12px;
		padding: 2.5rem;
		border: 1px solid #e0e0e0;
		transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) .post-card {
		background: #242424;
		border: 1px solid #333;
	}

	.post-card:hover {
		transform: translateY(-4px) scale(1.01);
		box-shadow: 0 8px 24px rgba(44, 95, 45, 0.12);
		border-color: #c5e1c6;
	}

	:global(.dark) .post-card:hover {
		box-shadow: 0 8px 24px rgba(92, 184, 95, 0.15);
		border-color: #3d5f3e;
	}

	.post-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.post-card h2 {
		margin: 0 0 1rem 0;
		color: #2c5f2d;
		font-size: 1.5rem;
		line-height: 1.4;
		letter-spacing: -0.01em;
		transition: color 0.3s ease;
	}

	:global(.dark) .post-card h2 {
		color: #5cb85f;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	time {
		color: #888;
		font-size: 0.9rem;
		transition: color 0.3s ease;
	}

	:global(.dark) time {
		color: var(--color-text-subtle-dark);
	}

	.post-card .tag.active {
		background: #2c5f2d;
	}

	:global(.dark) .post-card .tag.active {
		background: #5cb85f;
	}

	.description {
		color: #666;
		line-height: 1.6;
		margin: 0;
		transition: color 0.3s ease;
	}

	:global(.dark) .description {
		color: var(--color-text-muted-dark);
	}

	@media (max-width: 768px) {
		.search-header {
			margin-bottom: 1.5rem;
		}

		.search-header h1 {
			font-size: 2rem;
		}

		.post-card {
			padding: 1.75rem;
		}
	}
</style>
