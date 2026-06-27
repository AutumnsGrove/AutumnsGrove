<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/state';

	let { data, children } = $props();

	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" />
	<link rel="alternate" type="application/rss+xml" title="Autumns Grove" href="/rss.xml" />
	{#if data.csrfToken}
		<meta name="csrf-token" content={data.csrfToken} />
	{/if}
</svelte:head>

{#if isAdmin}
	{@render children()}
{:else}
	<div class="app" data-theme={$theme}>
		<a href="#main-content" class="skip-to-content">Skip to content</a>
		<Nav user={data.user} />

		<main id="main-content">
			{@render children()}
		</main>

		<Footer user={data.user} />
	</div>
{/if}

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
	}
</style>
