<script>
	import { ContentWithGutter } from '$lib/components';

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
		<header class="content-header">
			<h1>{data.page.title}</h1>
		</header>
	{/snippet}
</ContentWithGutter>
