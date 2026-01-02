<script>
	import { onMount } from 'svelte';
	import { ZoomableImage, Glass, GlassButton } from '$lib/components';
	import { getImageTitle, getImageDate, debounce } from '@autumnsgrove/groveengine/utils';
	import { Input, Button, Badge, Select } from '@autumnsgrove/groveengine/ui';

	let { data } = $props();

	// Filter state
	let searchQuery = $state('');
	let selectedTags = $state([]);
	let selectedCategory = $state('');
	let selectedYear = $state('');
	let filtersExpanded = $state(true);

	// Lightbox state
	let lightboxOpen = $state(false);
	let lightboxImage = $state({ src: '', alt: '' });
	let currentIndex = $state(0);

	// For lazy loading
	let visibleImages = $state([]);
	let loadedCount = $state(0);
	const BATCH_SIZE = 30;
	const AUTO_LOAD_LIMIT = 60;

	// Derived filtered images
	const filteredImages = $derived.by(() => {
		let result = [...data.images];

		// Search filter
		if (searchQuery) {
			const lowerQuery = searchQuery.toLowerCase();
			result = result.filter((img) => {
				const title = getImageTitle(img).toLowerCase();
				const slug = (img.parsed_slug || '').toLowerCase();
				const filename = (img.r2_key || img.key || '').toLowerCase();
				const description = (img.custom_description || '').toLowerCase();
				return (
					title.includes(lowerQuery) ||
					slug.includes(lowerQuery) ||
					filename.includes(lowerQuery) ||
					description.includes(lowerQuery)
				);
			});
		}

		// Year filter
		if (selectedYear) {
			result = result.filter((img) => {
				const imgDate = getImageDate(img);
				return imgDate && imgDate.startsWith(selectedYear);
			});
		}

		// Category filter
		if (selectedCategory) {
			result = result.filter((img) => img.parsed_category === selectedCategory);
		}

		// Tags filter (all selected tags must match)
		if (selectedTags.length > 0) {
			result = result.filter((img) => {
				if (!img.tags || img.tags.length === 0) return false;
				const imgTagSlugs = img.tags.map((t) => t.slug);
				return selectedTags.every((slug) => imgTagSlugs.includes(slug));
			});
		}

		return result;
	});

	// Check if any filters are active
	const hasFilters = $derived(
		searchQuery !== '' ||
			selectedTags.length > 0 ||
			selectedCategory !== '' ||
			selectedYear !== ''
	);

	// Prepare select options
	const yearOptions = $derived([
		{ value: '', label: 'All Years' },
		...data.filters.years.map((year) => ({ value: year, label: year }))
	]);

	const categoryOptions = $derived([
		{ value: '', label: 'All Categories' },
		...data.filters.categories.map((cat) => ({ value: cat, label: cat }))
	]);

	// Initialize with first batch
	onMount(() => {
		loadMoreImages();
		// Set up intersection observer for infinite scroll (only for first 60)
		setupInfiniteScroll();
	});

	function loadMoreImages() {
		const nextBatch = filteredImages.slice(loadedCount, loadedCount + BATCH_SIZE);
		visibleImages = [...visibleImages, ...nextBatch];
		loadedCount += nextBatch.length;
	}

	function setupInfiniteScroll() {
		const sentinel = document.getElementById('load-sentinel');
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Only auto-load first 60 images
				if (entries[0].isIntersecting && loadedCount < AUTO_LOAD_LIMIT && loadedCount < filteredImages.length) {
					loadMoreImages();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinel);
	}

	function resetPagination() {
		visibleImages = [];
		loadedCount = 0;
		loadMoreImages();
	}

	function toggleTag(tagSlug) {
		if (selectedTags.includes(tagSlug)) {
			selectedTags = selectedTags.filter((t) => t !== tagSlug);
		} else {
			selectedTags = [...selectedTags, tagSlug];
		}
		resetPagination();
	}

	function resetFilters() {
		searchQuery = '';
		selectedTags = [];
		selectedCategory = '';
		selectedYear = '';
		resetPagination();
	}

	const handleSearchInput = debounce((e) => {
		searchQuery = e.target.value;
		resetPagination();
	}, 300);

	// Watch for filter changes (year, category)
	$effect(() => {
		// Reset pagination when filters change
		if (selectedYear || selectedCategory) {
			resetPagination();
		}
	});

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

	function toggleFiltersPanel() {
		filtersExpanded = !filtersExpanded;
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
		<p class="image-count">{filteredImages.length} photos</p>
	</header>

	<!-- Filter Panel -->
	<div class="filter-panel" class:expanded={filtersExpanded}>
		<Glass variant="card" intensity="medium" border shadow>
			<button class="filter-toggle" onclick={toggleFiltersPanel} aria-expanded={filtersExpanded}>
				<span>Filters</span>
				<svg
					class="chevron"
					class:rotated={filtersExpanded}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			</button>

			{#if filtersExpanded}
				<div class="filter-controls">
					<!-- Search input -->
					<div class="filter-group">
						<Input
							type="search"
							placeholder="Search photos..."
							oninput={handleSearchInput}
							class="search-input"
						/>
					</div>

					<!-- Year and Category selects -->
					<div class="filter-row">
						<div class="filter-group">
							<Select options={yearOptions} bind:value={selectedYear} class="select-filter" />
						</div>

						<div class="filter-group">
							<Select
								options={categoryOptions}
								bind:value={selectedCategory}
								class="select-filter"
							/>
						</div>
					</div>

					<!-- Tag badges -->
					{#if data.filters.tags.length > 0}
						<div class="filter-group">
							<div class="tag-filters">
								{#each data.filters.tags as tag}
									<button
										class="tag-badge"
										class:active={selectedTags.includes(tag.slug)}
										style="--tag-color: {tag.color || '#8b9467'}"
										onclick={() => toggleTag(tag.slug)}
										aria-pressed={selectedTags.includes(tag.slug)}
									>
										{tag.name}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Clear filters button -->
					{#if hasFilters}
						<div class="filter-actions">
							<Button variant="ghost" size="sm" onclick={resetFilters}>Clear Filters</Button>
						</div>
					{/if}
				</div>
			{/if}
		</Glass>
	</div>

	<!-- Gallery Content -->
	{#if filteredImages.length === 0}
		<div class="empty-state">
			{#if hasFilters}
				<p>No photos match your filters</p>
				<Button variant="secondary" size="md" onclick={resetFilters}>Clear Filters</Button>
			{:else}
				<p>No images in the gallery yet.</p>
			{/if}
		</div>
	{:else}
		<div class="mood-board">
			{#each visibleImages as image, index}
				<button
					class="mood-item {getItemClass(index)}"
					onclick={() => openLightbox(image, index)}
					aria-label="View {getImageTitle(image)}"
				>
					<img src={image.url} alt={getImageTitle(image)} loading="lazy" decoding="async" />

					<!-- Overlay with metadata -->
					<div class="image-overlay">
						<div class="overlay-content">
							<h3 class="image-title">{getImageTitle(image)}</h3>
							{#if image.tags && image.tags.length > 0}
								<div class="image-tags">
									{#each image.tags.slice(0, 3) as tag}
										<span class="overlay-tag" style="--tag-color: {tag.color || '#8b9467'}"
											>{tag.name}</span
										>
									{/each}
									{#if image.tags.length > 3}
										<span class="overlay-tag more">+{image.tags.length - 3}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Infinite scroll sentinel (only active for first 60 images) -->
		{#if loadedCount < AUTO_LOAD_LIMIT && loadedCount < filteredImages.length}
			<div id="load-sentinel" class="load-sentinel">
				<div class="loading-spinner"></div>
				<span>Loading more...</span>
			</div>
		{/if}

		<!-- Manual load more button (after 60 images) -->
		{#if loadedCount >= AUTO_LOAD_LIMIT && loadedCount < filteredImages.length}
			<div class="load-more-section">
				<Button variant="secondary" size="lg" onclick={loadMoreImages}>
					Load More ({filteredImages.length - loadedCount} remaining)
				</Button>
			</div>
		{/if}

		<!-- End message -->
		{#if loadedCount >= filteredImages.length && filteredImages.length > 0}
			<div class="gallery-end">
				<p>You've reached the end ✨</p>
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
		<GlassButton variant="ghost" onclick={closeLightbox} aria-label="Close" class="lightbox-close">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</GlassButton>

		<!-- Navigation buttons -->
		{#if currentIndex > 0}
			<GlassButton variant="ghost" onclick={goToPrevious} aria-label="Previous image" class="lightbox-nav prev">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</GlassButton>
		{/if}

		{#if currentIndex < visibleImages.length - 1}
			<GlassButton variant="ghost" onclick={goToNext} aria-label="Next image" class="lightbox-nav next">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</GlassButton>
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

		<Glass variant="overlay" intensity="medium" class="lightbox-counter">
			{currentIndex + 1} / {visibleImages.length}
		</Glass>
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
		padding: 2rem 1rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.gallery-header h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-border-strong);
	}

	:global(.dark) .gallery-header h1 {
		color: var(--color-foreground);
	}

	.image-count {
		color: #666;
		margin: 0;
		font-size: 1rem;
	}

	:global(.dark) .image-count {
		color: #b8b8b8;
	}

	/* Filter Panel */
	.filter-panel {
		max-width: 1800px;
		margin: 0 auto 2rem;
		padding: 0 1rem;
	}

	.filter-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: var(--cream-200);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-foreground);
		transition: background 0.2s ease;
	}

	:global(.dark) .filter-toggle {
		background: var(--cream-300);
		border-color: var(--cream-100);
		color: var(--color-foreground);
	}

	.filter-toggle:hover {
		background: var(--color-border);
	}

	:global(.dark) .filter-toggle:hover {
		background: rgba(139, 148, 103, 0.1);
	}

	.filter-toggle .chevron {
		width: 20px;
		height: 20px;
		transition: transform 0.3s ease;
	}

	.filter-toggle .chevron.rotated {
		transform: rotate(180deg);
	}

	.filter-controls {
		margin-top: 1rem;
		padding: 1.5rem;
		background: var(--cream-200);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	:global(.dark) .filter-controls {
		background: var(--cream-300);
		border-color: var(--cream-100);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.tag-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-badge {
		padding: 0.5rem 1rem;
		background: rgba(var(--tag-color, 139, 148, 103), 0.1);
		border: 1px solid rgba(var(--tag-color, 139, 148, 103), 0.3);
		border-radius: 20px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-foreground);
	}

	:global(.dark) .tag-badge {
		background: rgba(139, 148, 103, 0.15);
		border-color: rgba(139, 148, 103, 0.3);
	}

	.tag-badge:hover {
		background: rgba(var(--tag-color, 139, 148, 103), 0.2);
		border-color: rgba(var(--tag-color, 139, 148, 103), 0.5);
		transform: translateY(-1px);
	}

	.tag-badge.active {
		background: var(--tag-color, #8b9467);
		color: white;
		border-color: var(--tag-color, #8b9467);
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
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
		background: var(--color-foreground);
		border: none;
		padding: 0;
		border-radius: 4px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	:global(.dark) .mood-item {
		background: var(--cream-300);
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

	/* Image Overlay */
	.image-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
		padding: 1.5rem 1rem 1rem;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}

	.mood-item:hover .image-overlay {
		opacity: 1;
	}

	.overlay-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.image-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: white;
		line-height: 1.3;
	}

	.image-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.overlay-tag {
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 0.75rem;
		color: white;
		backdrop-filter: blur(4px);
	}

	.overlay-tag.more {
		background: rgba(255, 255, 255, 0.15);
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

	/* Load more section */
	.load-more-section {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.gallery-end {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}

	:global(.dark) .gallery-end {
		color: #b8b8b8;
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

		.filter-row {
			grid-template-columns: 1fr;
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

		.filter-panel {
			margin-bottom: 1.5rem;
		}

		.filter-controls {
			padding: 1rem;
		}

		.image-title {
			font-size: 0.85rem;
		}

		.image-overlay {
			padding: 1rem 0.75rem 0.75rem;
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
		border: 2px solid var(--color-border);
		border-top-color: #2c5f2d;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	:global(.dark) .loading-spinner {
		border-color: var(--cream-100);
		border-top-color: var(--grove-500);
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
