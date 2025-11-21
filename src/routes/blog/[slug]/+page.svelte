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

	// Track content height for overflow detection
	let contentArticle = $state();
	let contentHeight = $state(0);
	let overflowingHeaderIds = $state([]);

	// Group items by their anchor
	function getItemsForAnchor(anchor) {
		return data.post.gutterContent.filter(item => item.anchor === anchor);
	}

	// Get items that don't have a matching anchor (show at top)
	function getOrphanItems() {
		if (!data.post.gutterContent || !data.post.headers) return data.post.gutterContent || [];
		const anchorIds = data.post.headers.map(h => `## ${h.text}`);
		return data.post.gutterContent.filter(item => !anchorIds.includes(item.anchor));
	}

	// Add IDs to headers and position mobile gutter items
	$effect(() => {
		untrack(() => {
			if (data.post.headers && data.post.headers.length > 0) {
				const contentEl = document.querySelector('.content-body');
				if (contentEl) {
					const headerElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
					headerElements.forEach((el) => {
						const text = el.textContent.trim();
						const matchingHeader = data.post.headers.find(h => h.text === text);
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

	// Track content height
	$effect(() => {
		if (contentArticle) {
			const updateHeight = () => {
				contentHeight = contentArticle.offsetHeight;
			};
			updateHeight();

			// Create ResizeObserver to track height changes
			const observer = new ResizeObserver(updateHeight);
			observer.observe(contentArticle);

			return () => observer.disconnect();
		}
	});

	// Handle overflow changes from LeftGutter
	function handleOverflowChange(headerIds) {
		overflowingHeaderIds = headerIds;
	}

	// Get items for overflowing headers
	function getOverflowItems() {
		if (!data.post.headers) return [];
		const items = [];
		for (const headerId of overflowingHeaderIds) {
			const header = data.post.headers.find(h => h.id === headerId);
			if (header) {
				const headerItems = getItemsForAnchor(`## ${header.text}`);
				items.push({ header, items: headerItems });
			}
		}
		return items;
	}

	// Check if we have content for gutters
	let hasLeftGutter = $derived(data.post.gutterContent && data.post.gutterContent.length > 0);
	let hasRightGutter = $derived(data.post.headers && data.post.headers.length > 0);
	let hasGutters = $derived(hasLeftGutter || hasRightGutter);
	let hasOverflow = $derived(overflowingHeaderIds.length > 0);
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
	<article class="content-article" bind:this={contentArticle}>
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

		<!-- Mobile gutter containers for each header (will be moved into position) -->
		{#if hasLeftGutter && data.post.headers}
			{#each data.post.headers as header (header.id)}
				{@const anchorItems = getItemsForAnchor(`## ${header.text}`)}
				{#if anchorItems.length > 0}
					<div
						class="mobile-gutter-content mobile-gutter-inline"
						bind:this={mobileGutterRefs[header.id]}
					>
						{#each anchorItems as item, index (index)}
							<GutterItem {item} />
						{/each}
					</div>
				{/if}
			{/each}
		{/if}

		<div class="content-body">
			{@html data.post.content}
		</div>

		<!-- Overflow gutter items rendered inline -->
		{#if hasOverflow}
			<div class="overflow-gutter-section">
				<div class="overflow-divider"></div>
				{#each getOverflowItems() as group (group.header.id)}
					<div class="overflow-group">
						<h4 class="overflow-anchor-label">From: {group.header.text}</h4>
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
