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

	// Track content height for overflow detection (measure content-body only to avoid feedback loop)
	let contentBodyElement = $state();
	let contentHeight = $state(0);
	let overflowingAnchorKeys = $state([]);

	/**
	 * Parse anchor string to determine anchor type and value
	 */
	function parseAnchor(anchor) {
		if (!anchor) {
			return { type: 'none', value: null };
		}

		// Check for paragraph anchor: "paragraph:N"
		const paragraphMatch = anchor.match(/^paragraph:(\d+)$/);
		if (paragraphMatch) {
			return { type: 'paragraph', value: parseInt(paragraphMatch[1], 10) };
		}

		// Check for tag anchor: "anchor:tagname"
		const tagMatch = anchor.match(/^anchor:(\w+)$/);
		if (tagMatch) {
			return { type: 'tag', value: tagMatch[1] };
		}

		// Check for header anchor: "## Header Text"
		const headerMatch = anchor.match(/^(#{1,6})\s+(.+)$/);
		if (headerMatch) {
			return { type: 'header', value: anchor };
		}

		// Unknown format - treat as header for backwards compatibility
		return { type: 'header', value: anchor };
	}

	/**
	 * Generate a unique key for an anchor
	 */
	function getAnchorKey(anchor) {
		const parsed = parseAnchor(anchor);
		switch (parsed.type) {
			case 'header':
				const headerText = anchor.replace(/^#+\s*/, '');
				const header = data.post.headers?.find(h => h.text === headerText);
				return header ? `header:${header.id}` : `header:${anchor}`;
			case 'paragraph':
				return `paragraph:${parsed.value}`;
			case 'tag':
				return `tag:${parsed.value}`;
			default:
				return `unknown:${anchor}`;
		}
	}

	/**
	 * Get all unique anchors from items (preserving order)
	 */
	function getUniqueAnchors() {
		if (!data.post.gutterContent) return [];
		const seen = new Set();
		const anchors = [];
		for (const item of data.post.gutterContent) {
			if (item.anchor && !seen.has(item.anchor)) {
				seen.add(item.anchor);
				anchors.push(item.anchor);
			}
		}
		return anchors;
	}

	/**
	 * Get display label for an anchor (used in overflow section)
	 */
	function getAnchorLabel(anchor) {
		const parsed = parseAnchor(anchor);
		switch (parsed.type) {
			case 'header':
				return anchor.replace(/^#+\s*/, '');
			case 'paragraph':
				return `Paragraph ${parsed.value}`;
			case 'tag':
				return `Tag: ${parsed.value}`;
			default:
				return anchor;
		}
	}

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return data.post.gutterContent.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a valid anchor (show at top)
	function getOrphanItems() {
		if (!data.post.gutterContent) return [];
		return data.post.gutterContent.filter(item => {
			if (!item.anchor) return true;
			const parsed = parseAnchor(item.anchor);
			if (parsed.type === 'header') {
				const headerText = item.anchor.replace(/^#+\s*/, '');
				return !data.post.headers?.find(h => h.text === headerText);
			}
			// Paragraph and tag anchors are valid if they have values
			return parsed.type === 'none';
		});
	}

	// Add IDs to headers and position mobile gutter items
	$effect(() => {
		untrack(() => {
			const contentEl = document.querySelector('.content-body');
			if (!contentEl) return;

			// First, add IDs to headers
			if (data.post.headers && data.post.headers.length > 0) {
				const headerElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
				headerElements.forEach((el) => {
					const text = el.textContent.trim();
					const matchingHeader = data.post.headers.find(h => h.text === text);
					if (matchingHeader) {
						el.id = matchingHeader.id;
					}
				});
			}

			// Position mobile gutter items for all anchor types
			for (const anchor of getUniqueAnchors()) {
				const anchorKey = getAnchorKey(anchor);
				const mobileGutterEl = mobileGutterRefs[anchorKey];
				if (!mobileGutterEl || mobileGutterEl.children.length === 0) continue;

				const parsed = parseAnchor(anchor);
				let targetEl = null;

				switch (parsed.type) {
					case 'header': {
						const headerText = anchor.replace(/^#+\s*/, '');
						const header = data.post.headers?.find(h => h.text === headerText);
						if (header) {
							targetEl = document.getElementById(header.id);
						}
						break;
					}
					case 'paragraph': {
						const paragraphs = contentEl.querySelectorAll('p');
						const index = parsed.value - 1;
						if (index >= 0 && index < paragraphs.length) {
							targetEl = paragraphs[index];
						}
						break;
					}
					case 'tag': {
						targetEl = contentEl.querySelector(`[data-anchor="${parsed.value}"]`);
						break;
					}
				}

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

	// Handle overflow changes from LeftGutter
	function handleOverflowChange(anchorKeys) {
		overflowingAnchorKeys = anchorKeys;
	}

	// Get items for overflowing anchors
	function getOverflowItems() {
		const items = [];
		for (const anchorKey of overflowingAnchorKeys) {
			// Find the original anchor string that matches this key
			const anchor = getUniqueAnchors().find(a => getAnchorKey(a) === anchorKey);
			if (anchor) {
				const anchorItems = getItemsForAnchor(anchor);
				const label = getAnchorLabel(anchor);
				items.push({ anchorKey, label, items: anchorItems });
			}
		}
		return items;
	}

	// Check if we have content for gutters
	let hasLeftGutter = $derived(data.post.gutterContent && data.post.gutterContent.length > 0);
	let hasRightGutter = $derived(data.post.headers && data.post.headers.length > 0);
	let hasGutters = $derived(hasLeftGutter || hasRightGutter);
	let hasOverflow = $derived(overflowingAnchorKeys.length > 0);
</script>

<svelte:head>
	<title>{data.post.title} - AutumnsGrove</title>
	<meta name="description" content={data.post.description || data.post.title} />
</svelte:head>

<div class="content-layout" class:has-gutters={hasGutters}>
	<!-- Left Gutter - Comments/Photos -->
	{#if hasLeftGutter}
		<div class="left-gutter-container desktop-only">
			<LeftGutter
				items={data.post.gutterContent}
				headers={data.post.headers || []}
				{contentHeight}
				onOverflowChange={handleOverflowChange}
			/>
		</div>
	{/if}

	<!-- Main Content -->
	<article class="content-article">
		<header class="content-header">
			<a href="/blog" class="back-link">&larr; Back to Blog</a>
			<h1>{data.post.title}</h1>
			<div class="post-meta">
				<time datetime={data.post.date}>
					{new Date(data.post.date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
				{#if data.post.tags.length > 0}
					<div class="tags">
						{#each data.post.tags as tag (tag)}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</header>

		<!-- Mobile gutter: orphan items at top (no matching anchor) -->
		{#if hasLeftGutter && getOrphanItems().length > 0}
			<div class="mobile-gutter-content">
				{#each getOrphanItems() as item, index (index)}
					<GutterItem {item} />
				{/each}
			</div>
		{/if}

		<!-- Mobile gutter containers for each anchor (will be moved into position) -->
		{#if hasLeftGutter}
			{#each getUniqueAnchors() as anchor (anchor)}
				{@const anchorKey = getAnchorKey(anchor)}
				{@const anchorItems = getItemsForAnchor(anchor)}
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
			{@html data.post.content}
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
			<TableOfContents headers={data.post.headers} />
		</div>
	{/if}
</div>

<!-- Mobile TOC Button -->
{#if hasRightGutter}
	<MobileTOC headers={data.post.headers} />
{/if}

<style>
	/* Shared styles are imported from $lib/styles/content.css */
	/* Blog post specific styles below */

	.back-link {
		display: inline-block;
		color: #2c5f2d;
		text-decoration: none;
		margin-bottom: 2rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	:global(.dark) .back-link {
		color: #5cb85f;
	}

	.back-link:hover {
		color: #4a9d4f;
	}

	:global(.dark) .back-link:hover {
		color: #7cd97f;
	}

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

	time {
		color: #888;
		font-size: 1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) time {
		color: var(--color-text-subtle-dark);
	}

	/* Tags use global styles from +layout.svelte */

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
