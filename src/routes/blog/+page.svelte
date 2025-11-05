<script>
	export let data;
</script>

<svelte:head>
	<title>Blog - AutumnsGrove</title>
	<meta name="description" content="Read my latest blog posts and articles." />
</svelte:head>

<div class="blog-header">
	<h1>Blog</h1>
	<p>Thoughts, ideas, and explorations.</p>
</div>

{#if data.posts.length === 0}
	<div class="no-posts">
		<p>No posts yet. Check back soon!</p>
	</div>
{:else}
	<div class="posts-grid">
		{#each data.posts as post}
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
								{#each post.tags as tag}
									<span class="tag">{tag}</span>
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
	.blog-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.blog-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin-bottom: 0.5rem;
	}

	.blog-header p {
		color: #666;
		font-size: 1.1rem;
	}

	.no-posts {
		text-align: center;
		padding: 3rem;
		color: #999;
	}

	.posts-grid {
		display: grid;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.post-card {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		border: 1px solid #e0e0e0;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.post-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag {
		background: #f0f0f0;
		color: #555;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.description {
		color: #666;
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 768px) {
		.blog-header h1 {
			font-size: 2rem;
		}

		.post-card {
			padding: 1.5rem;
		}
	}
</style>
