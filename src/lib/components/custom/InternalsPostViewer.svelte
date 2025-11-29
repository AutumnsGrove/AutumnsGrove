<script>
	import DOMPurify from 'dompurify';

	let {
		post = null,
		slug = '',
		caption = '',
		maxLines = 4,
		href = ''
	} = $props();

	let contentRef = $state(null);
	let isOverflowing = $state(false);

	// Determine the link URL
	let linkUrl = $derived(href || (post?.slug ? `/blog/${post.slug}` : slug ? `/blog/${slug}` : '#'));

	// Extract plain text preview from HTML content
	let previewText = $derived.by(() => {
		if (!post?.content) return '';

		// Strip HTML tags and get plain text
		const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
		if (tempDiv) {
			// Sanitize HTML before setting innerHTML to prevent XSS
			const sanitizedContent = DOMPurify.sanitize(post.content, {
				ALLOWED_TAGS: [
					'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
					'p', 'a', 'ul', 'ol', 'li', 'blockquote',
					'code', 'pre', 'strong', 'em', 'img',
					'table', 'thead', 'tbody', 'tr', 'th', 'td',
					'br', 'hr', 'div', 'span', 'sup', 'sub',
					'del', 'ins'
				],
				ALLOWED_ATTR: [
					'href', 'src', 'alt', 'title', 'class', 'id',
					'data-anchor', 'data-language', 'data-line-numbers'
				],
				ALLOW_DATA_ATTR: true
			});
			tempDiv.innerHTML = sanitizedContent;
			const text = tempDiv.textContent || tempDiv.innerText || '';
			// Get first few sentences/lines
			const lines = text.split(/\n+/).filter(line => line.trim());
			return lines.slice(0, maxLines).join('\n');
		}
		// Server-side fallback: simple HTML stripping
		const text = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		const words = text.split(' ');
		return words.slice(0, 60).join(' ') + (words.length > 60 ? '...' : '');
	});

	$effect(() => {
		if (contentRef) {
			isOverflowing = contentRef.scrollHeight > contentRef.clientHeight;
		}
	});
</script>

<a
	class="internals-post-viewer"
	href={linkUrl}
	aria-label="Read full post: {post?.title || 'Untitled'}"
>
	<header class="viewer-header">
		<h3 class="viewer-title">{post?.title || 'Untitled Post'}</h3>
		{#if post?.date}
			<time class="viewer-date" datetime={post.date}>
				{new Date(post.date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})}
			</time>
		{/if}
	</header>

	<div
		class="viewer-content"
		bind:this={contentRef}
	>
		{#if post?.content}
			<div class="preview-text">{previewText}</div>
		{:else}
			<p class="no-content">No preview available</p>
		{/if}
	</div>

	{#if isOverflowing || post?.content}
		<div class="viewer-fade"></div>
	{/if}

	<footer class="viewer-footer">
		<span class="read-more">
			Click to read more
			<svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14M12 5l7 7-7 7"/>
			</svg>
		</span>
		{#if post?.tags?.length > 0}
			<div class="viewer-tags">
				{#each post.tags.slice(0, 3) as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		{/if}
	</footer>

	{#if caption}
		<div class="viewer-caption">{caption}</div>
	{/if}
</a>

<style>
	.internals-post-viewer {
		position: relative;
		display: block;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.25rem;
		background: #fafafa;
		text-decoration: none;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	:global(.dark) .internals-post-viewer {
		border-color: #3a3a3a;
		background: #1a1a1a;
	}

	.internals-post-viewer:hover {
		border-color: var(--color-primary);
		box-shadow: 0 4px 12px rgba(44, 95, 45, 0.15);
		transform: translateY(-2px);
	}

	:global(.dark) .internals-post-viewer:hover {
		border-color: var(--color-primary-light);
		box-shadow: 0 4px 12px rgba(92, 184, 95, 0.2);
	}

	.internals-post-viewer:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	:global(.dark) .internals-post-viewer:focus {
		outline-color: var(--color-primary-light);
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.viewer-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1.3;
		transition: color 0.2s ease;
	}

	:global(.dark) .viewer-title {
		color: var(--color-primary-light);
	}

	.internals-post-viewer:hover .viewer-title {
		color: var(--color-primary-hover);
	}

	:global(.dark) .internals-post-viewer:hover .viewer-title {
		color: var(--color-primary-light-hover);
	}

	.viewer-date {
		flex-shrink: 0;
		font-size: 0.8rem;
		color: #888;
		white-space: nowrap;
	}

	:global(.dark) .viewer-date {
		color: #999;
	}

	.viewer-content {
		position: relative;
		max-height: 5.5rem;
		overflow: hidden;
		line-height: 1.6;
		color: #555;
		font-size: 0.95rem;
		transition: max-height 0.3s ease;
	}

	:global(.dark) .viewer-content {
		color: #bbb;
	}

	.viewer-content.expanded {
		max-height: 20rem;
		overflow-y: auto;
	}

	.preview-text {
		white-space: pre-wrap;
	}

	.no-content {
		color: #999;
		font-style: italic;
		margin: 0;
	}

	.viewer-fade {
		position: absolute;
		bottom: 4.5rem;
		left: 0;
		right: 0;
		height: 2rem;
		background: linear-gradient(transparent, #fafafa);
		pointer-events: none;
	}

	:global(.dark) .viewer-fade {
		background: linear-gradient(transparent, #1a1a1a);
	}

	.viewer-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e8e8e8;
	}

	:global(.dark) .viewer-footer {
		border-top-color: #333;
	}

	.read-more {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-primary);
		transition: color 0.2s ease;
	}

	:global(.dark) .read-more {
		color: var(--color-primary-light);
	}

	.arrow-icon {
		transition: transform 0.2s ease;
	}

	.internals-post-viewer:hover .arrow-icon {
		transform: translateX(3px);
	}

	.viewer-tags {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.tag {
		padding: 0.2rem 0.5rem;
		font-size: 0.7rem;
		background: #e8f5e9;
		color: var(--color-primary);
		border-radius: 4px;
		text-transform: lowercase;
	}

	:global(.dark) .tag {
		background: #1f3a1f;
		color: var(--color-primary-light);
	}

	.viewer-caption {
		margin-top: 1.25rem;
		padding-top: 0.75rem;
		font-size: 0.8rem;
		color: #777;
		font-style: italic;
		text-align: center;
		border-top: 1px dashed #ddd;
	}

	:global(.dark) .viewer-caption {
		color: #888;
		border-top-color: #444;
	}

	@media (max-width: 480px) {
		.internals-post-viewer {
			padding: 1rem;
		}

		.viewer-header {
			flex-direction: column;
			gap: 0.25rem;
		}

		.viewer-title {
			font-size: 1.1rem;
		}

		.viewer-footer {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.viewer-caption {
			margin-top: 1.5rem;
			padding-top: 0.875rem;
		}
	}
</style>
