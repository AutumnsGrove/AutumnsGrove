<script>
	import { untrack } from 'svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import MobileTOC from '$lib/components/MobileTOC.svelte';
	import LeftGutter from '$lib/components/LeftGutter.svelte';
	import GutterItem from '$lib/components/GutterItem.svelte';
	import '$lib/styles/content.css';

	let { data } = $props();

	// References to mobile gutter containers for each anchor
	let mobileGutterRefs = $state({});

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return data.page.gutterContent.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a matching anchor (show at top)
	function getOrphanItems() {
		if (!data.page.gutterContent || !data.page.headers) return data.page.gutterContent || [];
		const anchorIds = data.page.headers.map(h => `## ${h.text}`);
		return data.page.gutterContent.filter(item => !anchorIds.includes(item.anchor));
	}

	// Add IDs to headers and position mobile gutter items
	$effect(() => {
		untrack(() => {
			if (data.page.headers && data.page.headers.length > 0) {
				const contentEl = document.querySelector('.content-body');
				if (contentEl) {
					const headerElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
					headerElements.forEach((el) => {
						const text = el.textContent.trim();
						const matchingHeader = data.page.headers.find(h => h.text === text);
						if (matchingHeader) {
							el.id = matchingHeader.id;

							// Move mobile gutter content after this header
							const mobileGutterEl = mobileGutterRefs[matchingHeader.id];
							if (mobileGutterEl && mobileGutterEl.children.length > 0) {
								// Insert after the header element
								el.insertAdjacentElement('afterend', mobileGutterEl);
							}
						}
					});
				}
			}
		});
	});

	// Check if we have content for gutters
	let hasLeftGutter = $derived(data.page.gutterContent && data.page.gutterContent.length > 0);
	let hasRightGutter = $derived(data.page.headers && data.page.headers.length > 0);
	let hasGutters = $derived(hasLeftGutter || hasRightGutter);
</script>

<svelte:head>
	<title>{data.page.title} - AutumnsGrove</title>
	<meta name="description" content={data.page.description || data.page.title} />
</svelte:head>

<div class="content-layout" class:has-gutters={hasGutters}>
	<!-- Left Gutter - Comments/Photos -->
	{#if hasLeftGutter}
		<div class="left-gutter-container desktop-only">
			<LeftGutter items={data.page.gutterContent} headers={data.page.headers || []} />
		</div>
	{/if}

	<!-- Main Content -->
	<article class="content-article">
		<!-- Temporary Warning Notice -->
		<div class="site-warning">
			<strong>Note:</strong> This site has known navigation issues. If you came from the GitHub Dashboard,
			you may need to refresh this page. When returning to Home, refresh there as well.
		</div>

		<header class="content-header">
			<h1>{data.page.title}</h1>
		</header>

		<!-- Mobile gutter: orphan items at top (no matching anchor) -->
		{#if hasLeftGutter && getOrphanItems().length > 0}
			<div class="mobile-gutter-content">
				{#each getOrphanItems() as item}
					<GutterItem {item} />
				{/each}
			</div>
		{/if}

		<!-- Mobile gutter containers for each header (will be moved into position) -->
		{#if hasLeftGutter && data.page.headers}
			{#each data.page.headers as header}
				{@const anchorItems = getItemsForAnchor(`## ${header.text}`)}
				{#if anchorItems.length > 0}
					<div
						class="mobile-gutter-content mobile-gutter-inline"
						bind:this={mobileGutterRefs[header.id]}
					>
						{#each anchorItems as item}
							<GutterItem {item} />
						{/each}
					</div>
				{/if}
			{/each}
		{/if}

		<div class="content-body">
			{@html data.page.content}
		</div>
	</article>

	<!-- Right Gutter - Table of Contents -->
	{#if hasRightGutter}
		<div class="right-gutter-container desktop-only">
			<TableOfContents headers={data.page.headers} />
		</div>
	{/if}
</div>

<!-- Mobile TOC Button -->
{#if hasRightGutter}
	<MobileTOC headers={data.page.headers} />
{/if}

<style>
	/* All shared styles are now imported from $lib/styles/content.css */
	/* This file only contains page-specific overrides if needed */

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
