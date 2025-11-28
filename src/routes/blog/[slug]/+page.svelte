<script>
	import ContentWithGutter from '$lib/components/ContentWithGutter.svelte';

	let { data } = $props();

	// Font family mapping - same as in +layout.svelte
	const fontMap = {
		alagard: "'Alagard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		cozette: "'Cozette', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		opendyslexic: "'OpenDyslexic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		lexend: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		cormorant: "'Cormorant', Georgia, 'Times New Roman', serif",
		quicksand: "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
	};

	// Get the font stack for this post (null if default)
	const postFont = $derived(
		data.post.font && data.post.font !== 'default'
			? fontMap[data.post.font]
			: null
	);
</script>

<svelte:head>
	<title>{data.post.title} - AutumnsGrove</title>
	<meta name="description" content={data.post.description || data.post.title} />
</svelte:head>

<div class="post-wrapper" class:has-custom-font={postFont} style:--post-font={postFont}>
	<ContentWithGutter
		content={data.post.content}
		gutterContent={data.post.gutterContent || []}
		headers={data.post.headers || []}
	>
		{#snippet children()}
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
								<a href="/blog/search?tag={encodeURIComponent(tag)}" class="tag">{tag}</a>
							{/each}
						</div>
					{/if}
				</div>
			</header>
		{/snippet}
	</ContentWithGutter>
</div>

<style>
	/* Post wrapper for custom font application */
	.post-wrapper {
		/* No special styling needed unless custom font */
	}

	/* Apply custom font to body content and headings (not meta like date/tags) */
	.post-wrapper.has-custom-font :global(.content-body) {
		font-family: var(--post-font, var(--font-family-main));
	}

	.post-wrapper.has-custom-font :global(.content-body h1),
	.post-wrapper.has-custom-font :global(.content-body h2),
	.post-wrapper.has-custom-font :global(.content-body h3),
	.post-wrapper.has-custom-font :global(.content-body h4),
	.post-wrapper.has-custom-font :global(.content-body h5),
	.post-wrapper.has-custom-font :global(.content-body h6) {
		font-family: var(--post-font, var(--font-family-main));
	}

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
</style>
