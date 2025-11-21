<script>
	import Lightbox from './Lightbox.svelte';

	export let item = {};

	let lightboxOpen = false;
	let lightboxSrc = '';
	let lightboxAlt = '';

	function openLightbox(src, alt) {
		lightboxSrc = src;
		lightboxAlt = alt;
		lightboxOpen = true;
	}

	function closeLightbox() {
		lightboxOpen = false;
	}

	// Handle clicks on images within markdown content
	function handleContentClick(event) {
		if (event.target.tagName === 'IMG') {
			openLightbox(event.target.src, event.target.alt);
		}
	}
</script>

<div class="gutter-item" data-anchor={item.anchor || ''}>
	{#if item.type === 'comment' || item.type === 'markdown'}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="gutter-comment" on:click={handleContentClick}>
			{@html item.content}
		</div>
	{:else if item.type === 'photo' || item.type === 'image'}
		<figure class="gutter-photo">
			<button class="image-button" on:click={() => openLightbox(item.src, item.caption || 'Gutter image')}>
				<img src={item.src} alt={item.caption || 'Gutter image'} />
			</button>
			{#if item.caption}
				<figcaption>{item.caption}</figcaption>
			{/if}
		</figure>
	{/if}
</div>

<Lightbox
	src={lightboxSrc}
	alt={lightboxAlt}
	isOpen={lightboxOpen}
	onClose={closeLightbox}
/>

<style>
	.gutter-item {
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.gutter-comment {
		padding: 0.75rem;
		background: #f8f8f8;
		border-left: 3px solid #2c5f2d;
		border-radius: 0 6px 6px 0;
		color: #555;
		transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) .gutter-comment {
		background: #1e1e1e;
		border-left-color: #5cb85f;
		color: #bbb;
	}

	.gutter-comment :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.gutter-comment :global(p:last-child) {
		margin-bottom: 0;
	}

	.gutter-comment :global(a) {
		color: #2c5f2d;
		text-decoration: underline;
	}

	:global(.dark) .gutter-comment :global(a) {
		color: #5cb85f;
	}

	.gutter-photo {
		margin: 0;
	}

	.image-button {
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		display: block;
	}

	.image-button:hover img {
		opacity: 0.9;
	}

	.gutter-photo img {
		width: 100%;
		max-width: 160px;
		height: auto;
		border-radius: 6px;
		display: block;
		transition: opacity 0.2s;
	}

	/* Also constrain images in markdown comments */
	.gutter-comment :global(img) {
		max-width: 160px;
		height: auto;
		border-radius: 6px;
		display: block;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.gutter-comment :global(img:hover) {
		opacity: 0.9;
	}

	.gutter-photo figcaption {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #666;
		font-style: italic;
		text-align: center;
		transition: color 0.3s ease;
	}

	:global(.dark) .gutter-photo figcaption {
		color: #999;
	}
</style>
