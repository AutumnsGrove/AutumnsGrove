<script>
	import { onMount } from 'svelte';
	import { renderMermaidDiagrams } from '$lib/utils/markdown.js';
	
	export let data;

	onMount(async () => {
		// Render Mermaid diagrams after component mounts
		await renderMermaidDiagrams();
	});
</script>

<svelte:head>
	<title>{data.recipe.title} - AutumnsGrove</title>
	<meta name="description" content={data.recipe.description || data.recipe.title} />
</svelte:head>

<article class="recipe">
	<header class="recipe-header">
		<a href="/recipes" class="back-link">&larr; Back to Recipes</a>
		<h1>{data.recipe.title}</h1>
		<div class="recipe-meta">
			<time datetime={data.recipe.date}>
				{new Date(data.recipe.date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</time>
			{#if data.recipe.tags.length > 0}
				<div class="tags">
					{#each data.recipe.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<div class="recipe-content">
		{@html data.recipe.content}
	</div>
</article>

<style>
	.recipe {
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

	.recipe-header {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 2px solid #e0e0e0;
		transition: border-color 0.3s ease;
	}

	:global(.dark) .recipe-header {
		border-bottom: 2px solid #333;
	}

	.recipe-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin: 0 0 1rem 0;
		line-height: 1.2;
		transition: color 0.3s ease;
	}

	:global(.dark) .recipe-header h1 {
		color: #5cb85f;
	}

	.recipe-meta {
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
		background: #e8d5f2;
		color: #6a3d9a;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.9rem;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) .tag {
		background: #4a2d5e;
		color: #d4b5e8;
	}

	.recipe-content {
		line-height: 1.8;
		color: #333;
		transition: color 0.3s ease;
	}

	:global(.dark) .recipe-content {
		color: #e0e0e0;
	}

	:global(.recipe-content h2) {
		color: #2c5f2d;
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		font-size: 1.75rem;
		transition: color 0.3s ease;
	}

	:global(.dark .recipe-content h2) {
		color: #5cb85f;
	}

	:global(.recipe-content h3) {
		color: #2c5f2d;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		font-size: 1.4rem;
		transition: color 0.3s ease;
	}

	:global(.dark .recipe-content h3) {
		color: #5cb85f;
	}

	:global(.recipe-content p) {
		margin-bottom: 1.5rem;
	}

	:global(.recipe-content a) {
		color: #2c5f2d;
		text-decoration: underline;
		transition: color 0.3s ease;
	}

	:global(.dark .recipe-content a) {
		color: #5cb85f;
	}

	:global(.recipe-content a:hover) {
		color: #4a9d4f;
	}

	:global(.dark .recipe-content a:hover) {
		color: #7cd97f;
	}

	:global(.recipe-content code) {
		background: #f5f5f5;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark .recipe-content code) {
		background: #2a2a2a;
		color: #e0e0e0;
	}

	:global(.recipe-content pre) {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		margin-bottom: 1.5rem;
		transition: background-color 0.3s ease;
	}

	:global(.dark .recipe-content pre) {
		background: #2a2a2a;
	}

	:global(.recipe-content pre code) {
		background: none;
		padding: 0;
	}

	:global(.recipe-content ul, .recipe-content ol) {
		margin-bottom: 1.5rem;
		padding-left: 2rem;
	}

	:global(.recipe-content li) {
		margin-bottom: 0.5rem;
	}

	:global(.recipe-content blockquote) {
		border-left: 4px solid #2c5f2d;
		padding-left: 1rem;
		margin: 1.5rem 0;
		color: #666;
		font-style: italic;
		transition: border-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark .recipe-content blockquote) {
		border-left: 4px solid #5cb85f;
		color: #aaa;
	}

	:global(.recipe-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	/* Mermaid diagram styling */
	:global(.mermaid-container) {
		margin: 2rem 0;
		text-align: center;
		background: #f9f9f9;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark .mermaid-container) {
		background: #2a2a2a;
		border: 1px solid #444;
	}

	:global(.mermaid-container svg) {
		max-width: 100%;
		height: auto;
	}

	:global(.mermaid-container .error) {
		color: #d32f2f;
		background: #ffebee;
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid #ffcdd2;
	}

	:global(.dark .mermaid-container .error) {
		color: #ff6b6b;
		background: #2d1b1b;
		border: 1px solid #4a2c2c;
	}

	@media (max-width: 768px) {
		.recipe-header h1 {
			font-size: 2rem;
		}

		:global(.recipe-content h2) {
			font-size: 1.5rem;
		}

		:global(.recipe-content h3) {
			font-size: 1.25rem;
		}
	}
</style>