<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { GlassCard, Badge, Glass } from '$lib/components';

	let {
		post = null,
		slug = '',
		caption = '',
		maxLines = 4,
		href = ''
	} = $props();

	let contentRef = $state(null);
	let isOverflowing = $state(false);
	let DOMPurify = $state(null);

	// Load DOMPurify only in browser
	onMount(async () => {
		if (browser) {
			const module = await import('isomorphic-dompurify');
			DOMPurify = module.default;
		}
	});

	// Determine the link URL
	let linkUrl = $derived(href || (post?.slug ? `/blog/${post.slug}` : slug ? `/blog/${slug}` : '#'));

	// Extract plain text preview from HTML content
	let previewText = $derived.by(() => {
		if (!post?.content) return '';

		// Strip HTML tags and get plain text
		const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
		if (tempDiv && DOMPurify) {
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
	href={linkUrl}
	aria-label="Read full post: {post?.title || 'Untitled'}"
	style="text-decoration: none; display: block;"
>
	<GlassCard variant="frosted" hoverable>
		{#snippet header()}
			<div class="viewer-header">
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
			</div>
		{/snippet}

		<div class="viewer-content-wrapper">
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
		</div>

		{#snippet footer()}
			<div class="viewer-footer">
				<span class="read-more">
					Click to read more
					<svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				</span>
				{#if post?.tags?.length > 0}
					<div class="viewer-tags">
						{#each post.tags.slice(0, 3) as tag (tag)}
							<Badge variant="secondary" size="sm">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</div>
		{/snippet}
	</GlassCard>

	{#if caption}
		<Glass variant="muted" intensity="light" class="viewer-caption-wrapper">
			<div class="viewer-caption">{caption}</div>
		</Glass>
	{/if}
</a>

<style>
	/* Header styling */
	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.viewer-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1.3;
		transition: color 0.2s ease;
	}

	a:hover .viewer-title {
		color: var(--color-primary-hover);
	}

	.viewer-date {
		flex-shrink: 0;
		font-size: 0.8rem;
		color: var(--color-text-secondary, #999);
		white-space: nowrap;
	}

	/* Content area with fade effect */
	.viewer-content-wrapper {
		position: relative;
	}

	.viewer-content {
		position: relative;
		max-height: 5.5rem;
		overflow: hidden;
		line-height: 1.6;
		color: var(--color-text, #d4d4d4);
		font-size: 0.95rem;
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
		bottom: 0;
		left: 0;
		right: 0;
		height: 2rem;
		background: linear-gradient(transparent, var(--color-surface, rgba(255, 255, 255, 0.05)));
		pointer-events: none;
	}

	/* Footer styling */
	.viewer-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
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

	.arrow-icon {
		transition: transform 0.2s ease;
	}

	a:hover .arrow-icon {
		transform: translateX(3px);
	}

	.viewer-tags {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	/* Caption wrapper */
	.viewer-caption-wrapper {
		margin-top: 0.75rem;
	}

	.viewer-caption {
		font-size: 0.8rem;
		color: var(--color-text-secondary, #999);
		font-style: italic;
		text-align: center;
		padding: 0.5rem 0;
	}

	@media (max-width: 480px) {
		.viewer-header {
			flex-direction: column;
			gap: 0.25rem;
		}

		.viewer-title {
			font-size: 1.1rem;
		}

		.viewer-footer {
			flex-direction: column;
			gap: 0.75rem;
			align-items: flex-start;
		}
	}
</style>
