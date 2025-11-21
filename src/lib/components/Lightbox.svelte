<script>
	/**
	 * Lightbox - Full-screen image viewer
	 * Click to expand images to full size
	 */
	let { src = '', alt = '', isOpen = false, onClose = () => {} } = $props();

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="lightbox-backdrop"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-label="Image viewer"
	>
		<button class="close-button" onclick={onClose} aria-label="Close">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
		<img {src} {alt} class="lightbox-image" />
	</div>
{/if}

<style>
	.lightbox-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		cursor: pointer;
		padding: 2rem;
	}

	.lightbox-image {
		max-width: 90vw;
		max-height: 90vh;
		object-fit: contain;
		cursor: default;
		border-radius: 4px;
	}

	.close-button {
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
	}

	.close-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.close-button svg {
		width: 24px;
		height: 24px;
	}
</style>
