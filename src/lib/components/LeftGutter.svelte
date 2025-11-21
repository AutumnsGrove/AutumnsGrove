<script>
	import GutterItem from './GutterItem.svelte';

	export let items = [];
	export let headers = [];

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return items.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a matching anchor (show at top)
	function getOrphanItems() {
		const anchorIds = headers.map(h => `## ${h.text}`);
		return items.filter(item => !anchorIds.includes(item.anchor));
	}
</script>

<aside class="left-gutter">
	{#if items.length > 0}
		<!-- Show orphan items at the top -->
		{#each getOrphanItems() as item}
			<GutterItem {item} />
		{/each}

		<!-- Show items grouped by anchor -->
		{#each headers as header}
			{@const anchorItems = getItemsForAnchor(`## ${header.text}`)}
			{#if anchorItems.length > 0}
				<div class="anchor-group" data-for-anchor={header.id}>
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
		position: sticky;
		top: 2rem;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		padding: 1rem;
	}

	.anchor-group {
		margin-bottom: 1rem;
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
