<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} - Autumns Grove</title>
	<meta name="description" content="About Autumns Grove — who I am, what I build, why I write." />
</svelte:head>

<div class="about container section">
	<header class="page-header animate-in">
		<p class="kicker">Hello</p>
		<h1>{data.title}</h1>
	</header>

	{#if data.content}
		<div class="prose animate-in animate-in-delay-1">
			{@html data.content}
		</div>
	{:else}
		<div class="prose animate-in animate-in-delay-1">
			<p>This page hasn't been written yet. Check back soon.</p>
		</div>
	{/if}
</div>

<style>
	.about {
		max-width: 720px;
	}

	.page-header {
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		margin: 0;
	}
</style>
