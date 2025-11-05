<script>
	export let data;
</script>

<svelte:head>
	<title>{data.post.title} - AutumnsGrove</title>
	<meta name="description" content={data.post.description || data.post.title} />
</svelte:head>

<article class="post">
	<header class="post-header">
		<a href="/blog" class="back-link">&larr; Back to Blog</a>
		<h1>{data.post.title}</h1>
		<div class="post-meta">
			<time datetime={data.post.date}>
				{new Date(data.post.date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</time>
			{#if data.post.tags.length > 0}
				<div class="tags">
					{#each data.post.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<div class="post-content">
		{@html data.post.content}
	</div>
</article>

<style>
	.post {
		max-width: 800px;
		margin: 0 auto;
	}

	.back-link {
		display: inline-block;
		color: #2c5f2d;
		text-decoration: none;
		margin-bottom: 2rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	:global(.dark) .back-link {
		color: #5cb85f;
	}

	.back-link:hover {
		color: #4a9d4f;
	}

	:global(.dark) .back-link:hover {
		color: #7cd97f;
	}

	.post-header {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 2px solid #e0e0e0;
		transition: border-color 0.3s ease;
	}

	:global(.dark) .post-header {
		border-bottom: 2px solid #333;
	}

	.post-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin: 0 0 1rem 0;
		line-height: 1.2;
		transition: color 0.3s ease;
	}

	:global(.dark) .post-header h1 {
		color: #5cb85f;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	time {
		color: #888;
		font-size: 1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) time {
		color: #999;
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
		font-size: 0.9rem;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) .tag {
		background: #333;
		color: #aaa;
	}

	.post-content {
		line-height: 1.8;
		color: #333;
		transition: color 0.3s ease;
	}

	:global(.dark) .post-content {
		color: #e0e0e0;
	}

	:global(.post-content h2) {
		color: #2c5f2d;
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		font-size: 1.75rem;
		transition: color 0.3s ease;
	}

	:global(.dark .post-content h2) {
		color: #5cb85f;
	}

	:global(.post-content h3) {
		color: #2c5f2d;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		font-size: 1.4rem;
		transition: color 0.3s ease;
	}

	:global(.dark .post-content h3) {
		color: #5cb85f;
	}

	:global(.post-content p) {
		margin-bottom: 1.5rem;
	}

	:global(.post-content a) {
		color: #2c5f2d;
		text-decoration: underline;
		transition: color 0.3s ease;
	}

	:global(.dark .post-content a) {
		color: #5cb85f;
	}

	:global(.post-content a:hover) {
		color: #4a9d4f;
	}

	:global(.dark .post-content a:hover) {
		color: #7cd97f;
	}

	:global(.post-content code) {
		background: #f5f5f5;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark .post-content code) {
		background: #2a2a2a;
		color: #e0e0e0;
	}

	:global(.post-content pre) {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		margin-bottom: 1.5rem;
		transition: background-color 0.3s ease;
	}

	:global(.dark .post-content pre) {
		background: #2a2a2a;
	}

	:global(.post-content pre code) {
		background: none;
		padding: 0;
	}

	:global(.post-content ul, .post-content ol) {
		margin-bottom: 1.5rem;
		padding-left: 2rem;
	}

	:global(.post-content li) {
		margin-bottom: 0.5rem;
	}

	:global(.post-content blockquote) {
		border-left: 4px solid #2c5f2d;
		padding-left: 1rem;
		margin: 1.5rem 0;
		color: #666;
		font-style: italic;
		transition: border-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark .post-content blockquote) {
		border-left: 4px solid #5cb85f;
		color: #aaa;
	}

	:global(.post-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	@media (max-width: 768px) {
		.post-header h1 {
			font-size: 2rem;
		}

		:global(.post-content h2) {
			font-size: 1.5rem;
		}

		:global(.post-content h3) {
			font-size: 1.25rem;
		}
	}
</style>
