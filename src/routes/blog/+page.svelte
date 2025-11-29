<script>
	import { goto } from '$app/navigation';
	import { Card, Badge } from '$lib/components/ui';

	let { data } = $props();

	function handleCardClick(event, slug) {
		// Don't navigate if clicking on a tag link or badge
		if (event.target.closest('a')) {
			return;
		}
		goto(`/blog/${slug}`);
	}

	function handleCardKeydown(event, slug) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			goto(`/blog/${slug}`);
		}
	}
</script>

<svelte:head>
	<title>Blog - AutumnsGrove</title>
	<meta name="description" content="Read my latest blog posts and articles." />
</svelte:head>

<div class="blog-header">
	<h1>Blog</h1>
	<p>Thoughts, ideas, and explorations.</p>
	{#if data.user}
		<div class="admin-actions">
			<span class="logged-in-indicator" title="Logged in as {data.user.email}">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			</span>
			<a href="/admin" class="admin-link" aria-label="Admin Panel">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
					<circle cx="12" cy="12" r="3"></circle>
				</svg>
			</a>
		</div>
	{/if}
</div>

{#if data.posts.length === 0}
	<div class="no-posts">
		<p>No posts yet. Check back soon!</p>
	</div>
{:else}
	<div class="posts-grid">
		{#each data.posts as post (post.slug)}
			<Card
				hoverable
				onclick={(e) => handleCardClick(e, post.slug)}
				onkeydown={(e) => handleCardKeydown(e, post.slug)}
				role="button"
				tabindex="0"
			>
				<h2 class="text-xl font-semibold mb-4 text-green-800 dark:text-green-500 transition-colors">{post.title}</h2>
				<div class="post-meta">
					<time datetime={post.date} class="text-sm text-gray-600 dark:text-gray-400 transition-colors">
						{new Date(post.date).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
					{#if post.tags.length > 0}
						<div class="tags">
							{#each post.tags as tag (tag)}
								<a href="/blog/search?tag={encodeURIComponent(tag)}" aria-label="Filter posts by tag: {tag}">
									<Badge variant="tag">{tag}</Badge>
								</a>
							{/each}
						</div>
					{/if}
				</div>
				{#if post.description}
					<p class="description">{post.description}</p>
				{/if}
			</Card>
		{/each}
	</div>
{/if}

<style>
	.blog-header {
		text-align: center;
		margin-top: 1rem;
		margin-bottom: 4rem;
	}

	.blog-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
		transition: color 0.3s ease;
	}

	:global(.dark) .blog-header h1 {
		color: #5cb85f;
	}

	.blog-header p {
		color: #666;
		font-size: 1.1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .blog-header p {
		color: var(--color-text-muted-dark);
	}

	.admin-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1rem;
	}

	.logged-in-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #28a745;
		padding: 0.25rem;
	}

	:global(.dark) .logged-in-indicator {
		color: #5cb85f;
	}

	.admin-link {
		color: #666;
		text-decoration: none;
		border-radius: 4px;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		transition: background-color 0.2s ease;
	}

	.admin-link:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .admin-link {
		color: #999;
	}

	:global(.dark) .admin-link:hover {
		background: rgba(255, 255, 255, 0.05);
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

	.post-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
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
		.blog-header {
			margin-bottom: 3rem;
		}

		.blog-header h1 {
			font-size: 2rem;
		}
	}
</style>
