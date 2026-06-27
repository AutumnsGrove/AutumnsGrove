<script>
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ContentWithGutter from '$lib/components/vines/ContentWithGutter.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} - Autumns Grove</title>
	<meta name="description" content={data.description} />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={data.description} />
	<meta property="og:type" content="article" />
</svelte:head>

<article class="post section">
	<ContentWithGutter
		content={data.content}
		gutterContent={data.gutterContent}
		headers={data.headers}
		showTableOfContents={data.headers.length > 0}
	>
		<header class="post-header animate-in">
			<a href="/blog" class="back-link"><ArrowLeft size={14} /> All posts</a>
			<h1>{data.title}</h1>
			<div class="post-meta">
				{#if data.date}
					<time datetime={data.date}>{data.date}</time>
				{/if}
				{#if data.tags.length > 0}
					<div class="tags">
						{#each data.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</header>
	</ContentWithGutter>
</article>

<style>
	.post {
		max-width: none;
	}

	.post-header {
		margin-bottom: 2.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-muted);
		margin-bottom: 1.5rem;
		transition: color var(--transition);
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.post-header h1 {
		margin: 0 0 0.75rem;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	time {
		font-size: 0.85rem;
		color: var(--color-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
