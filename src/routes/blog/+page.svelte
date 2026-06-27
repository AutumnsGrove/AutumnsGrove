<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>Blog - Autumns Grove</title>
	<meta name="description" content="Writing about code, creativity, and building things that matter." />
</svelte:head>

<div class="blog-page container section">
	<header class="page-header animate-in">
		<p class="kicker">Writing</p>
		<h1>Blog</h1>
	</header>

	{#if data.posts.length === 0}
		<p class="empty animate-in animate-in-delay-1">No posts yet. Check back soon.</p>
	{:else}
		<ul class="post-list animate-in animate-in-delay-1">
			{#each data.posts as post}
				<li class="post-item">
					<a href="/blog/{post.slug}" class="post-link">
						<div class="post-meta">
							<time datetime={post.date}>{post.date}</time>
							{#if post.tags.length > 0}
								<div class="tags">
									{#each post.tags as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							{/if}
						</div>
						<h2 class="post-title">{post.title}</h2>
						{#if post.description}
							<p class="post-desc">{post.description}</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		margin: 0;
	}

	.empty {
		color: var(--color-muted);
		font-style: italic;
	}

	.post-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.post-item {
		border-bottom: 1px solid var(--color-border);
	}

	.post-item:last-child {
		border-bottom: none;
	}

	.post-link {
		display: block;
		padding: 1.25rem 0;
		text-decoration: none;
		color: var(--color-ink);
		transition: color var(--transition);
	}

	.post-link:hover {
		color: var(--color-primary);
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.4rem;
	}

	time {
		font-size: 0.82rem;
		color: var(--color-muted);
		font-variant-numeric: tabular-nums;
	}

	.post-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		line-height: 1.3;
	}

	.post-desc {
		font-size: 0.9rem;
		color: var(--color-muted);
		margin-top: 0.35rem;
		max-width: 60ch;
	}
</style>
