<script>
	import ContentWithGutter from '$lib/components/custom/ContentWithGutter.svelte';
	import { Button, Badge } from '$lib/components/ui';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.post.title} - AutumnsGrove</title>
	<meta name="description" content={data.post.description || data.post.title} />
</svelte:head>

<ContentWithGutter
	content={data.post.content}
	gutterContent={data.post.gutterContent || []}
	headers={data.post.headers || []}
>
	{#snippet children()}
		<header class="content-header">
			<Button variant="link" href="/blog" class="!p-0 mb-8">&larr; Back to Blog</Button>
			<h1>{data.post.title}</h1>
			<div class="post-meta">
				<time datetime={data.post.date} class="text-gray-600 dark:text-gray-400 transition-colors">
					{new Date(data.post.date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
				{#if data.post.tags.length > 0}
					<div class="tags">
						{#each data.post.tags as tag (tag)}
							<a href="/blog/search?tag={encodeURIComponent(tag)}">
								<Badge variant="tag">{tag}</Badge>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</header>
	{/snippet}
</ContentWithGutter>

<style>
	/* Override content-header h1 to add margin for post meta */
	.content-header h1 {
		margin: 0 0 1rem 0;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
</style>
