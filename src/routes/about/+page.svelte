<script>
	import ContentWithGutter from '$lib/components/ContentWithGutter.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page.title} - AutumnsGrove</title>
	<meta name="description" content={data.page.description || data.page.title} />
</svelte:head>

<ContentWithGutter
	content={data.page.content}
	gutterContent={data.page.gutterContent || []}
	headers={data.page.headers || []}
>
	{#snippet children()}
		<!-- Temporary Warning Notice -->
		<div class="site-warning">
			<strong>Note:</strong> This site has known navigation issues. If you came from the GitHub Dashboard,
			you may need to refresh this page. When returning to Home, refresh there as well.
		</div>

		<header class="content-header">
			<h1>{data.page.title}</h1>
		</header>
	{/snippet}
</ContentWithGutter>

<style>
	.site-warning {
		background: #fff3cd;
		border: 1px solid #ffc107;
		color: #856404;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	:global(.dark) .site-warning {
		background: #3d3200;
		border-color: #ffc107;
		color: #ffd54f;
	}
</style>
