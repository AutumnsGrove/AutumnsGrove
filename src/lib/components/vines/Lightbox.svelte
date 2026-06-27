<script lang="ts">
	interface Props {
		src: string;
		alt: string;
		caption?: string;
		isOpen: boolean;
		onClose: () => void;
	}

	let { src, alt, caption = "", isOpen, onClose }: Props = $props();

	let dialogRef = $state<HTMLDialogElement>();

	$effect(() => {
		if (!dialogRef) return;
		if (isOpen && !dialogRef.open) {
			dialogRef.showModal();
		} else if (!isOpen && dialogRef.open) {
			dialogRef.close();
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogRef) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") onClose();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogRef}
	class="lightbox"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	onclose={onClose}
>
	<div class="lightbox-content">
		<img {src} {alt} />
		{#if caption}
			<p class="lightbox-caption">{caption}</p>
		{/if}
		<button class="lightbox-close" onclick={onClose} aria-label="Close">
			&times;
		</button>
	</div>
</dialog>

<style>
	.lightbox {
		border: none;
		background: none;
		max-width: 90vw;
		max-height: 90vh;
		padding: 0;
	}

	.lightbox::backdrop {
		background: oklch(0.1 0 0 / 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.lightbox-content {
		position: relative;
	}

	.lightbox-content img {
		max-width: 90vw;
		max-height: 85vh;
		object-fit: contain;
		border-radius: var(--radius);
	}

	.lightbox-caption {
		text-align: center;
		color: oklch(0.8 0 0);
		font-size: 0.85rem;
		margin-top: 0.75rem;
		font-style: italic;
	}

	.lightbox-close {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-ink);
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.lightbox-close:hover {
		background: var(--color-primary);
		color: var(--color-bg);
		border-color: var(--color-primary);
	}
</style>
