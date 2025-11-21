<script>
	import { onMount } from 'svelte';
	import GutterItem from './GutterItem.svelte';

	export let items = [];
	export let headers = [];

	let gutterElement;
	let itemPositions = {};

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return items.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a matching anchor (show at top)
	function getOrphanItems() {
		const anchorIds = headers.map(h => `## ${h.text}`);
		return items.filter(item => !anchorIds.includes(item.anchor));
	}

	// Calculate positions based on header locations in the main content
	function updatePositions() {
		if (!gutterElement) return;

		const gutterRect = gutterElement.getBoundingClientRect();
		const gutterTop = gutterElement.offsetTop;

		headers.forEach(header => {
			const headerEl = document.getElementById(header.id);
			if (headerEl) {
				const headerRect = headerEl.getBoundingClientRect();
				const headerTop = headerEl.offsetTop;
				// Position relative to gutter's top
				itemPositions[header.id] = headerTop - gutterTop;
			}
		});

		itemPositions = { ...itemPositions }; // Trigger reactivity
	}

	onMount(() => {
		// Initial positioning after content renders
		setTimeout(updatePositions, 100);

		// Update on resize
		window.addEventListener('resize', updatePositions);
		return () => window.removeEventListener('resize', updatePositions);
	});
</script>

<aside class="left-gutter" bind:this={gutterElement}>
	{#if items.length > 0}
		<!-- Show orphan items at the top -->
		{#each getOrphanItems() as item}
			<div class="gutter-item-wrapper">
				<GutterItem {item} />
			</div>
		{/each}

		<!-- Show items positioned by anchor -->
		{#each headers as header}
			{@const anchorItems = getItemsForAnchor(`## ${header.text}`)}
			{#if anchorItems.length > 0}
				<div
					class="anchor-group"
					data-for-anchor={header.id}
					style="top: {itemPositions[header.id] || 0}px"
				>
					{#each anchorItems as item}
						<GutterItem {item} />
					{/each}
				</div>
			{/if}
		{/each}
	{/if}
</aside>

<style>
	.left-gutter {
		position: relative;
		padding: 1rem;
		min-height: 100%;
	}

	.gutter-item-wrapper {
		margin-bottom: 1rem;
	}

	.anchor-group {
		position: absolute;
		left: 1rem;
		right: 1rem;
	}

	/* Scrollbar styling */
	.left-gutter::-webkit-scrollbar {
		width: 4px;
	}

	.left-gutter::-webkit-scrollbar-track {
		background: transparent;
	}

	.left-gutter::-webkit-scrollbar-thumb {
		background: #ccc;
		border-radius: 2px;
	}

	:global(.dark) .left-gutter::-webkit-scrollbar-thumb {
		background: #444;
	}
</style>
