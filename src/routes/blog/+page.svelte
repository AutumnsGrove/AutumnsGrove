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
		<p class="page-desc animate-in animate-in-delay-1">Code, creativity, and building things that matter.</p>
	</header>

	<hr class="divider animate-in animate-in-delay-1" />

	{#if data.posts.length === 0}
		<p class="empty animate-in animate-in-delay-2">No posts yet. Check back soon.</p>
	{:else}
		<ul class="post-list">
			{#each data.posts as post, i}
				<li class="post-item scroll-reveal">
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
						<h2 class="post-title" style="view-transition-name: post-title-{post.slug}">{post.title}</h2>
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
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		margin: 0;
	}

	.page-desc {
		color: var(--color-muted);
		font-style: italic;
		margin-top: 0.5rem;
		font-size: 1.05rem;
	}

	.blog-page .divider {
		margin-bottom: 2rem;
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
		gap: 0;
	}

	.post-item {
		border-bottom: 1px solid var(--color-border);
	}

	.post-item:last-child {
		border-bottom: none;
	}

	.post-link {
		display: block;
		padding: 1.5rem 0;
		text-decoration: none;
		color: var(--color-ink);
		transition: color var(--transition), padding-left var(--transition);
	}

	.post-link:hover {
		color: var(--color-primary);
		padding-left: 0.75rem;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	time {
		font-size: 0.78rem;
		color: var(--color-muted);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.post-title {
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.25;
		transition: font-size 200ms var(--ease-out-expo);
	}

	.post-link:hover .post-title {
		font-size: 1.45rem;
	}

	.post-desc {
		font-size: 0.9rem;
		color: var(--color-muted);
		margin-top: 0.4rem;
		max-width: 60ch;
		line-height: 1.5;
	}
</style>
