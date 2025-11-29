<script>
	import { onMount } from 'svelte';
	import ZoomableImage from '$lib/components/gallery/ZoomableImage.svelte';

	let { data } = $props();

	// Lightbox state
	let lightboxOpen = $state(false);
	let lightboxImage = $state({ src: '', alt: '' });
	let currentIndex = $state(0);

	// For lazy loading
	let visibleImages = $state([]);
	let loadedCount = $state(0);
	const BATCH_SIZE = 30;

	// Initialize with first batch
	onMount(() => {
		loadMoreImages();
		// Set up intersection observer for infinite scroll
		setupInfiniteScroll();
	});

	function loadMoreImages() {
		const nextBatch = data.images.slice(loadedCount, loadedCount + BATCH_SIZE);
		visibleImages = [...visibleImages, ...nextBatch];
		loadedCount += nextBatch.length;
	}

	function setupInfiniteScroll() {
		const sentinel = document.getElementById('load-sentinel');
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && loadedCount < data.images.length) {
					loadMoreImages();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinel);
	}

	function openLightbox(image, index) {
		lightboxImage = { src: image.url, alt: image.key };
		currentIndex = index;
		lightboxOpen = true;
	}

	function closeLightbox() {
		lightboxOpen = false;
	}

	function goToPrevious() {
		if (currentIndex > 0) {
			currentIndex--;
			const image = visibleImages[currentIndex];
			lightboxImage = { src: image.url, alt: image.key };
		}
	}

	function goToNext() {
		if (currentIndex < visibleImages.length - 1) {
			currentIndex++;
			const image = visibleImages[currentIndex];
			lightboxImage = { src: image.url, alt: image.key };
		}
	}

	function handleKeydown(event) {
		if (!lightboxOpen) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToPrevious();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToNext();
		}
	}

	// Generate random sizes for mood board effect
	function getItemClass(index) {
		// Create a deterministic but varied pattern
		const patterns = [
			'', '', '', // Regular size (most common)
			'wide', 'wide', // Span 2 columns
			'tall', 'tall', // Span 2 rows
			'large' // Span 2x2
		];
		// Use image index for consistent sizing
		const hash = (index * 7 + 3) % patterns.length;
		return patterns[hash];
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Gallery | The Grove</title>
	<meta name="description" content="Photo gallery showcasing moments and memories" />
</svelte:head>

<div class="gallery-page">
	<header class="gallery-header">
		<h1>Gallery</h1>
		<p class="image-count">{data.images.length} photos</p>
	</header>

	{#if visibleImages.length === 0}
		<div class="empty-state">
			<p>No images in the gallery yet.</p>
		</div>
	{:else}
		<div class="mood-board">
			{#each visibleImages as image, index}
				<button
					class="mood-item {getItemClass(index)}"
					onclick={() => openLightbox(image, index)}
					aria-label="View {image.key}"
				>
					<img
						src={image.url}
						alt={image.key}
						loading="lazy"
						decoding="async"
					/>
				</button>
			{/each}
		</div>

		{#if loadedCount < data.images.length}
			<div id="load-sentinel" class="load-sentinel">
				<div class="loading-spinner"></div>
				<span>Loading more...</span>
			</div>
		{/if}
	{/if}
</div>

<!-- Enhanced Lightbox with Navigation -->
{#if lightboxOpen}
	<div
		class="gallery-lightbox"
		onclick={(e) => e.target === e.currentTarget && closeLightbox()}
		role="dialog"
		aria-modal="true"
		aria-label="Image viewer"
	>
		<button class="lightbox-close" onclick={closeLightbox} aria-label="Close">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>

		<!-- Navigation buttons -->
		{#if currentIndex > 0}
			<button class="lightbox-nav prev" onclick={goToPrevious} aria-label="Previous image">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
		{/if}

		{#if currentIndex < visibleImages.length - 1}
			<button class="lightbox-nav next" onclick={goToNext} aria-label="Next image">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</button>
		{/if}

		<div class="lightbox-content">
			{#key lightboxImage.src}
				<ZoomableImage
					src={lightboxImage.src}
					alt={lightboxImage.alt}
					isActive={lightboxOpen}
					class="lightbox-image"
				/>
			{/key}
		</div>

		<div class="lightbox-counter">
			{currentIndex + 1} / {visibleImages.length}
		</div>
	</div>
{/if}

<style>
	.gallery-page {
		/* Full width - override default max-width constraints */
		width: 100vw;
		margin-left: calc(-50vw + 50%);
		padding: 0 1rem;
	}

	.gallery-header {
		text-align: center;
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.gallery-header h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	:global(.dark) .gallery-header h1 {
		color: #f0f0f0;
	}

	.image-count {
		color: #666;
		margin: 0;
		font-size: 1rem;
	}

	:global(.dark) .image-count {
		color: #b8b8b8;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
	}

	:global(.dark) .empty-state {
		color: #b8b8b8;
	}

	/* Mood Board Grid - Desktop */
	.mood-board {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-auto-rows: 200px;
		gap: 8px;
		padding: 0 1rem 2rem;
		max-width: 1800px;
		margin: 0 auto;
	}

	.mood-item {
		position: relative;
		overflow: hidden;
		cursor: pointer;
		background: #f0f0f0;
		border: none;
		padding: 0;
		border-radius: 4px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	:global(.dark) .mood-item {
		background: #2a2a2a;
	}

	.mood-item:hover {
		transform: scale(1.02);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		z-index: 1;
	}

	:global(.dark) .mood-item:hover {
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
	}

	.mood-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.mood-item:hover img {
		transform: scale(1.05);
	}

	/* Special sizes for mood board variety */
	.mood-item.wide {
		grid-column: span 2;
	}

	.mood-item.tall {
		grid-row: span 2;
	}

	.mood-item.large {
		grid-column: span 2;
		grid-row: span 2;
	}

	/* Tablet view - 3 columns */
	@media (max-width: 1024px) {
		.mood-board {
			grid-template-columns: repeat(3, 1fr);
			grid-auto-rows: 180px;
			gap: 6px;
		}

		.gallery-header h1 {
			font-size: 2rem;
		}

		/* Adjust large items for smaller grid */
		.mood-item.large {
			grid-column: span 2;
			grid-row: span 2;
		}
	}

	/* Mobile view - 2 columns */
	@media (max-width: 640px) {
		.gallery-page {
			padding: 0 0.5rem;
		}

		.gallery-header {
			padding: 1.5rem 1rem;
		}

		.gallery-header h1 {
			font-size: 1.75rem;
		}

		.mood-board {
			grid-template-columns: repeat(2, 1fr);
			grid-auto-rows: 150px;
			gap: 4px;
			padding: 0 0.5rem 1.5rem;
		}

		.mood-item {
			border-radius: 2px;
		}

		/* On mobile, limit special sizes */
		.mood-item.wide {
			grid-column: span 2;
		}

		.mood-item.tall {
			grid-row: span 2;
		}

		.mood-item.large {
			grid-column: span 2;
			grid-row: span 1;
		}
	}

	/* Load sentinel / infinite scroll */
	.load-sentinel {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: #666;
	}

	:global(.dark) .load-sentinel {
		color: #b8b8b8;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #e0e0e0;
		border-top-color: #2c5f2d;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	:global(.dark) .loading-spinner {
		border-color: #444;
		border-top-color: #5cb85f;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Lightbox Styles */
	.gallery-lightbox {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		cursor: pointer;
	}

	.lightbox-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: background 0.2s;
		z-index: 10001;
	}

	.lightbox-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.lightbox-close svg {
		width: 24px;
		height: 24px;
	}

	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: background 0.2s, transform 0.2s;
		z-index: 10001;
	}

	.lightbox-nav:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-50%) scale(1.1);
	}

	.lightbox-nav.prev {
		left: 1rem;
	}

	.lightbox-nav.next {
		right: 1rem;
	}

	.lightbox-nav svg {
		width: 28px;
		height: 28px;
	}

	.lightbox-content {
		max-width: 90vw;
		max-height: 85vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.lightbox-content .lightbox-image) {
		max-width: 90vw;
		max-height: 85vh;
		object-fit: contain;
		border-radius: 4px;
	}

	.lightbox-counter {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		background: rgba(0, 0, 0, 0.4);
		padding: 0.5rem 1rem;
		border-radius: 20px;
	}

	/* Mobile lightbox adjustments */
	@media (max-width: 640px) {
		.lightbox-close {
			top: 0.5rem;
			right: 0.5rem;
			width: 40px;
			height: 40px;
		}

		.lightbox-close svg {
			width: 20px;
			height: 20px;
		}

		.lightbox-nav {
			width: 44px;
			height: 44px;
		}

		.lightbox-nav.prev {
			left: 0.5rem;
		}

		.lightbox-nav.next {
			right: 0.5rem;
		}

		.lightbox-nav svg {
			width: 24px;
			height: 24px;
		}

		.lightbox-counter {
			bottom: 1rem;
			font-size: 0.85rem;
		}
	}
</style>
