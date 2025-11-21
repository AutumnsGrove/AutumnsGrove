<script>
	/**
	 * ImageGallery - Multi-image gallery with navigation
	 * Similar to The Verge's implementation
	 *
	 * @prop {Array} images - Array of image objects with url, alt, and optional caption
	 * @example
	 * <ImageGallery images={[
	 *   { url: 'https://...', alt: 'Description', caption: 'Photo caption' }
	 * ]} />
	 */
	let { images = [] } = $props();

	let currentIndex = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let galleryElement;

	// Navigation functions
	function goToNext() {
		if (currentIndex < images.length - 1) {
			currentIndex++;
		}
	}

	function goToPrevious() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}

	function goToIndex(index) {
		if (index >= 0 && index < images.length) {
			currentIndex = index;
		}
	}

	// Keyboard navigation
	function handleKeydown(event) {
		if (event.key === 'ArrowRight') {
			goToNext();
		} else if (event.key === 'ArrowLeft') {
			goToPrevious();
		}
	}

	// Touch/swipe support
	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchMove(event) {
		touchEndX = event.touches[0].clientX;
	}

	function handleTouchEnd() {
		const swipeThreshold = 50;
		const diff = touchStartX - touchEndX;

		if (Math.abs(diff) > swipeThreshold) {
			if (diff > 0) {
				goToNext();
			} else {
				goToPrevious();
			}
		}
		touchStartX = 0;
		touchEndX = 0;
	}

	// Get current image
	$effect(() => {
		// Reset index if images array changes and current index is out of bounds
		if (currentIndex >= images.length && images.length > 0) {
			currentIndex = images.length - 1;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if images && images.length > 0}
	<div
		class="gallery-container"
		bind:this={galleryElement}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="region"
		aria-label="Image gallery"
		tabindex="0"
	>
		<!-- Main image display -->
		<div class="gallery-image-wrapper">
			<img
				src={images[currentIndex].url}
				alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
				class="gallery-image"
			/>

			<!-- Navigation arrows -->
			{#if images.length > 1}
				<button
					class="nav-button nav-prev"
					onclick={goToPrevious}
					disabled={currentIndex === 0}
					aria-label="Previous image"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>

				<button
					class="nav-button nav-next"
					onclick={goToNext}
					disabled={currentIndex === images.length - 1}
					aria-label="Next image"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Info panel (progress, counter, caption) -->
		{#if images.length > 1 || images[currentIndex].caption}
			<div class="gallery-info">
				{#if images.length > 1}
					<!-- Progress dots -->
					<div class="gallery-progress">
						<div class="progress-dots">
							{#each images as _, index}
								<button
									class="progress-dot"
									class:active={index === currentIndex}
									onclick={() => goToIndex(index)}
									aria-label={`Go to image ${index + 1}`}
								></button>
							{/each}
						</div>
					</div>

					<!-- Counter -->
					<div class="gallery-counter">
						{currentIndex + 1}/{images.length}
					</div>
				{/if}

				<!-- Caption -->
				{#if images[currentIndex].caption}
					<div class="gallery-caption">
						{images[currentIndex].caption}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.gallery-container {
		position: relative;
		width: 100%;
		margin: 1.5rem 0;
		outline: none;
	}

	.gallery-container:focus {
		outline: 2px solid #5865f2;
		outline-offset: 4px;
		border-radius: 8px;
	}

	.gallery-image-wrapper {
		position: relative;
		width: 100%;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
	}

	.gallery-image {
		width: 100%;
		height: auto;
		display: block;
		max-height: 70vh;
		object-fit: contain;
	}

	/* Navigation buttons */
	.nav-button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #5865f2;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: all 0.2s ease;
		z-index: 10;
		opacity: 0.9;
	}

	.nav-button:hover:not(:disabled) {
		background: #4752c4;
		transform: translateY(-50%) scale(1.05);
		opacity: 1;
	}

	.nav-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.nav-button svg {
		width: 24px;
		height: 24px;
	}

	.nav-prev {
		left: 16px;
	}

	.nav-next {
		right: 16px;
	}

	/* Info panel - unified background for progress, counter, caption */
	.gallery-info {
		background: #f9fafb;
		border-radius: 0 0 8px 8px;
	}

	:global(.dark) .gallery-info {
		background: #1f2937;
	}

	/* Progress indicators */
	.gallery-progress {
		display: flex;
		justify-content: center;
		padding: 12px 0 8px;
	}

	.progress-dots {
		display: flex;
		gap: 6px;
	}

	.progress-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #d1d5db;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.progress-dot:hover {
		background: #9ca3af;
	}

	.progress-dot.active {
		background: #5865f2;
		width: 24px;
		border-radius: 4px;
	}

	:global(.dark) .progress-dot {
		background: #4b5563;
	}

	:global(.dark) .progress-dot:hover {
		background: #6b7280;
	}

	:global(.dark) .progress-dot.active {
		background: #5865f2;
	}

	/* Counter */
	.gallery-counter {
		text-align: center;
		font-size: 0.875rem;
		color: #6b7280;
		padding-bottom: 8px;
	}

	:global(.dark) .gallery-counter {
		color: #9ca3af;
	}

	/* Caption */
	.gallery-caption {
		padding: 12px 16px;
		font-size: 0.9rem;
		color: #374151;
		line-height: 1.5;
	}

	:global(.dark) .gallery-caption {
		color: #d1d5db;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.nav-button {
			width: 40px;
			height: 40px;
		}

		.nav-button svg {
			width: 20px;
			height: 20px;
		}

		.nav-prev {
			left: 8px;
		}

		.nav-next {
			right: 8px;
		}

		.gallery-caption {
			font-size: 0.85rem;
			padding: 10px 12px;
		}
	}
</style>
