<script>
	import { tick, untrack, onMount } from 'svelte';
	import TableOfContents from './TableOfContents.svelte';
	import MobileTOC from './MobileTOC.svelte';
	import GutterItem from './GutterItem.svelte';
	import {
		parseAnchor,
		getAnchorKey,
		getUniqueAnchors,
		getAnchorLabel,
		getItemsForAnchor,
		getOrphanItems,
		findAnchorElement
	} from '$lib/utils/gutter.js';
	import '$lib/styles/content.css';

	let {
		content = '',
		gutterContent = [],
		headers = [],
		showTableOfContents = true,
		children
	} = $props();

	// References to mobile gutter containers for each anchor
	let mobileGutterRefs = $state({});

	// Track content height for overflow detection
	let contentBodyElement = $state();
	let contentHeight = $state(0);
	let overflowingAnchorKeys = $state([]);

	// Gutter positioning state
	let gutterElement = $state();
	let itemPositions = $state({});
	let anchorGroupElements = $state({});

	// Compute unique anchors once as a derived value (performance optimization)
	let uniqueAnchors = $derived(getUniqueAnchors(gutterContent));
	let orphanItems = $derived(getOrphanItems(gutterContent, headers));

	// Check if we have content for gutters
	let hasLeftGutter = $derived(gutterContent && gutterContent.length > 0);
	let hasRightGutter = $derived(showTableOfContents && headers && headers.length > 0);
	let hasGutters = $derived(hasLeftGutter || hasRightGutter);
	let hasOverflow = $derived(overflowingAnchorKeys.length > 0);

	// Helper to get anchor key with headers context
	function getKey(anchor) {
		return getAnchorKey(anchor, headers);
	}

	// Get items for a specific anchor
	function getItems(anchor) {
		return getItemsForAnchor(gutterContent, anchor);
	}

	/**
	 * Calculate positions based on anchor locations, with collision detection
	 */
	async function updatePositions() {
		if (!gutterElement || !contentBodyElement) return;

		await tick(); // Wait for DOM to update

		const gutterTop = gutterElement.offsetTop;
		const minGap = 16; // Minimum gap between items in pixels
		const bottomPadding = 32; // Padding from bottom of content

		let lastBottom = 0; // Track the bottom edge of the last positioned item
		const newOverflowingAnchors = [];

		// Sort anchors by their position in the document
		const anchorPositions = uniqueAnchors.map(anchor => {
			const el = findAnchorElement(anchor, contentBodyElement, headers);
			return {
				anchor,
				key: getKey(anchor),
				element: el,
				top: el ? el.offsetTop : Infinity
			};
		}).sort((a, b) => a.top - b.top);

		anchorPositions.forEach(({ anchor, key, element }) => {
			const groupEl = anchorGroupElements[key];

			if (element && groupEl) {
				// Desired position (aligned with anchor element)
				let desiredTop = element.offsetTop - gutterTop;

				// Get the height of this gutter group
				const groupHeight = groupEl.offsetHeight;

				// Check for collision with previous item
				if (desiredTop < lastBottom + minGap) {
					// Push down to avoid overlap
					desiredTop = lastBottom + minGap;
				}

				// Check if this item would overflow past the content
				const effectiveContentHeight = contentHeight > 0 ? contentHeight : Infinity;
				if (desiredTop + groupHeight > effectiveContentHeight - bottomPadding) {
					// This item overflows - mark it and hide it in the gutter
					newOverflowingAnchors.push(key);
					itemPositions[key] = -9999; // Hide off-screen
				} else {
					itemPositions[key] = desiredTop;
					// Update lastBottom for next iteration
					lastBottom = desiredTop + groupHeight;
				}
			} else if (groupEl) {
				// Element not found - hide this group
				itemPositions[key] = -9999;
			}
		});

		// Update overflowing anchors
		overflowingAnchorKeys = newOverflowingAnchors;
	}

	// Setup resize listener on mount (clearer than $effect for one-time setup)
	onMount(() => {
		const handleResize = () => {
			requestAnimationFrame(updatePositions);
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Handle initial positioning and re-calculate when dependencies change
	$effect(() => {
		// Explicitly reference dependencies to track changes
		gutterContent;
		headers;
		contentHeight;
		uniqueAnchors;

		// Use requestAnimationFrame for smoother updates
		requestAnimationFrame(updatePositions);
	});

	// Add IDs to headers and position mobile gutter items
	$effect(() => {
		untrack(() => {
			if (!contentBodyElement) return;

			// First, add IDs to headers
			if (headers && headers.length > 0) {
				const headerElements = contentBodyElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
				headerElements.forEach((el) => {
					const text = el.textContent.trim();
					const matchingHeader = headers.find(h => h.text === text);
					if (matchingHeader) {
						el.id = matchingHeader.id;
					}
				});
			}

			// Position mobile gutter items for all anchor types
			for (const anchor of uniqueAnchors) {
				const anchorKey = getKey(anchor);
				const mobileGutterEl = mobileGutterRefs[anchorKey];
				if (!mobileGutterEl || mobileGutterEl.children.length === 0) continue;

				const targetEl = findAnchorElement(anchor, contentBodyElement, headers);

				if (targetEl) {
					targetEl.insertAdjacentElement('afterend', mobileGutterEl);
				}
			}
		});
	});

	// Track content height (only the content-body to avoid feedback loop with overflow section)
	$effect(() => {
		if (contentBodyElement) {
			const updateHeight = () => {
				// Get the bottom of content-body relative to the article
				const rect = contentBodyElement.getBoundingClientRect();
				const articleRect = contentBodyElement.closest('.content-article')?.getBoundingClientRect();
				if (articleRect) {
					contentHeight = rect.bottom - articleRect.top;
				} else {
					contentHeight = contentBodyElement.offsetTop + contentBodyElement.offsetHeight;
				}
			};
			updateHeight();

			// Create ResizeObserver to track height changes
			const observer = new ResizeObserver(updateHeight);
			observer.observe(contentBodyElement);

			return () => observer.disconnect();
		}
	});

	// Get items for overflowing anchors
	function getOverflowItems() {
		const items = [];
		for (const anchorKey of overflowingAnchorKeys) {
			// Find the original anchor string that matches this key
			const anchor = uniqueAnchors.find(a => getKey(a) === anchorKey);
			if (anchor) {
				const anchorItems = getItems(anchor);
				const label = getAnchorLabel(anchor);
				items.push({ anchorKey, label, items: anchorItems });
			}
		}
		return items;
	}
</script>

<div class="content-layout" class:has-gutters={hasGutters}>
	<!-- Left Gutter - Comments/Photos/Emojis -->
	{#if hasLeftGutter}
		<div class="left-gutter-container desktop-only">
			<aside class="left-gutter" bind:this={gutterElement}>
				<!-- Show orphan items at the top -->
				{#each orphanItems as item, index (index)}
					<div class="gutter-item-wrapper">
						<GutterItem {item} />
					</div>
				{/each}

				<!-- Show items positioned by anchor -->
				{#each uniqueAnchors as anchor (anchor)}
					{@const anchorKey = getKey(anchor)}
					{@const anchorItems = getItems(anchor)}
					{#if anchorItems.length > 0}
						<div
							class="anchor-group"
							data-for-anchor={anchorKey}
							style="top: {itemPositions[anchorKey] || 0}px"
							bind:this={anchorGroupElements[anchorKey]}
						>
							{#each anchorItems as item, index (index)}
								<GutterItem {item} />
							{/each}
						</div>
					{/if}
				{/each}
			</aside>
		</div>
	{/if}

	<!-- Main Content -->
	<article class="content-article">
		<!-- Custom header content via children/slot -->
		{#if children}
			{@render children()}
		{/if}

		<!-- Mobile gutter: orphan items at top (no matching anchor) -->
		{#if hasLeftGutter && orphanItems.length > 0}
			<div class="mobile-gutter-content">
				{#each orphanItems as item, index (index)}
					<GutterItem {item} />
				{/each}
			</div>
		{/if}

		<!-- Mobile gutter containers for each anchor (will be moved into position) -->
		{#if hasLeftGutter}
			{#each uniqueAnchors as anchor (anchor)}
				{@const anchorKey = getKey(anchor)}
				{@const anchorItems = getItems(anchor)}
				{#if anchorItems.length > 0}
					<div
						class="mobile-gutter-content mobile-gutter-inline"
						bind:this={mobileGutterRefs[anchorKey]}
					>
						{#each anchorItems as item, index (index)}
							<GutterItem {item} />
						{/each}
					</div>
				{/if}
			{/each}
		{/if}

		<div class="content-body" bind:this={contentBodyElement}>
			{@html content}
		</div>

		<!-- Overflow gutter items rendered inline -->
		{#if hasOverflow}
			<div class="overflow-gutter-section">
				<div class="overflow-divider"></div>
				{#each getOverflowItems() as group (group.anchorKey)}
					<div class="overflow-group">
						<h4 class="overflow-anchor-label">From: {group.label}</h4>
						{#each group.items as item, index (index)}
							<GutterItem {item} />
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</article>

	<!-- Right Gutter - Table of Contents -->
	{#if hasRightGutter}
		<div class="right-gutter-container desktop-only">
			<TableOfContents {headers} />
		</div>
	{/if}
</div>

<!-- Mobile TOC Button -->
{#if hasRightGutter}
	<MobileTOC {headers} />
{/if}

<style>
	/* Left gutter styles */
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

	/* Overflow gutter section */
	.overflow-gutter-section {
		margin-top: 3rem;
		padding-top: 2rem;
	}

	.overflow-divider {
		height: 1px;
		background: linear-gradient(to right, transparent, #e0e0e0, transparent);
		margin-bottom: 2rem;
	}

	:global(.dark) .overflow-divider {
		background: linear-gradient(to right, transparent, #3a3a3a, transparent);
	}

	.overflow-group {
		margin-bottom: 2rem;
	}

	.overflow-anchor-label {
		font-size: 0.85rem;
		color: #888;
		margin: 0 0 0.75rem 0;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	:global(.dark) .overflow-anchor-label {
		color: #666;
	}
</style>
