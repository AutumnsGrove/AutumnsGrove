<script>
	import { tick } from 'svelte';
	import GutterItem from './GutterItem.svelte';

	let { items = [], headers = [] } = $props();

	let gutterElement = $state();
	let itemPositions = $state({});
	let anchorGroupElements = $state({});

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return items.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a matching anchor (show at top)
	function getOrphanItems() {
		const anchorIds = headers.map(h => `## ${h.text}`);
		return items.filter(item => !anchorIds.includes(item.anchor));
	}

	// Calculate positions based on header locations, with collision detection
	async function updatePositions() {
		if (!gutterElement) return;

		await tick(); // Wait for DOM to update

		const gutterTop = gutterElement.offsetTop;
		const minGap = 16; // Minimum gap between items in pixels

		let lastBottom = 0; // Track the bottom edge of the last positioned item

		// Get headers that have gutter items, in document order
		const headersWithItems = headers.filter(h =>
			getItemsForAnchor(`## ${h.text}`).length > 0
		);

		headersWithItems.forEach(header => {
			const headerEl = document.getElementById(header.id);
			const groupEl = anchorGroupElements[header.id];

			if (headerEl && groupEl) {
				// Desired position (aligned with header)
				let desiredTop = headerEl.offsetTop - gutterTop;

				// Get the height of this gutter group
				const groupHeight = groupEl.offsetHeight;

				// Check for collision with previous item
				if (desiredTop < lastBottom + minGap) {
					// Push down to avoid overlap
					desiredTop = lastBottom + minGap;
				}

				itemPositions[header.id] = desiredTop;

				// Update lastBottom for next iteration
				lastBottom = desiredTop + groupHeight;
			}
		});
	}

	$effect(() => {
		// Update on resize
		window.addEventListener('resize', updatePositions);
		return () => {
			window.removeEventListener('resize', updatePositions);
		};
	});

	// Handle initial positioning and re-calculate when items or headers change
	$effect(() => {
		// Explicitly reference dependencies to track changes
		items;
		headers;
		// Delay slightly to allow DOM updates
		const timeout = setTimeout(updatePositions, 150);
		return () => clearTimeout(timeout);
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
					bind:this={anchorGroupElements[header.id]}
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
