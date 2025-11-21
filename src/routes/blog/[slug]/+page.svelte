<script>
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import MobileTOC from '$lib/components/MobileTOC.svelte';
	import LeftGutter from '$lib/components/LeftGutter.svelte';
	import GutterItem from '$lib/components/GutterItem.svelte';
	import { onMount } from 'svelte';
	import '$lib/styles/content.css';

	export let data;

	// References to mobile gutter containers for each anchor
	let mobileGutterRefs = {};

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
	onMount(() => {
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

	// Check if we have content for gutters
	$: hasLeftGutter = data.post.gutterContent && data.post.gutterContent.length > 0;
	$: hasRightGutter = data.post.headers && data.post.headers.length > 0;
	$: hasGutters = hasLeftGutter || hasRightGutter;
</script>

<svelte:head>
	<title>{data.post.title} - AutumnsGrove</title>
	<meta name="description" content={data.post.description || data.post.title} />
</svelte:head>

<div class="content-layout" class:has-gutters={hasGutters}>
	<!-- Left Gutter - Comments/Photos -->
	{#if hasLeftGutter}
		<div class="left-gutter-container desktop-only">
			<LeftGutter items={data.post.gutterContent} headers={data.post.headers || []} />
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
						{#each data.post.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
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
		{#if hasLeftGutter && data.post.headers}
			{#each data.post.headers as header}
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
			{@html data.post.content}
		</div>
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
		color: #999;
	}

	/* Tags use global styles from +layout.svelte */
</style>
