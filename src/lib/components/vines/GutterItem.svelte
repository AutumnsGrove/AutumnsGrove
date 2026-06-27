<script lang="ts">
	import Lightbox from "./Lightbox.svelte";
	import { sanitizeHTML } from "$lib/utils/sanitize";
	import type { GutterItem as GutterItemData } from "$lib/utils/gutter";

	interface Props {
		item: GutterItemData;
	}

	let { item }: Props = $props();

	let lightboxOpen = $state(false);
	let lightboxSrc = $state("");
	let lightboxAlt = $state("");
	let lightboxCaption = $state("");

	function openLightbox(src: string, alt: string, caption = "") {
		lightboxSrc = src;
		lightboxAlt = alt;
		lightboxCaption = caption;
		lightboxOpen = true;
	}

	function handleContentClick(event: Event) {
		const target = event.target as HTMLElement;
		if (target.tagName === "IMG") {
			const img = target as HTMLImageElement;
			openLightbox(img.src, img.alt);
		}
	}
</script>

<div class="gutter-item scroll-reveal" data-anchor={item.anchor || ""}>
	{#if item.type === "comment" || item.type === "markdown"}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="gutter-comment"
			onclick={handleContentClick}
			onkeydown={(e) => e.key === "Enter" && handleContentClick(e)}
			role="group"
			aria-label="Annotation"
		>
			{@html sanitizeHTML(item.content ?? "")}
		</div>
	{:else if item.type === "photo" || item.type === "image"}
		{@const imageSrc = item.src || item.url || item.file}
		<figure class="gutter-photo">
			<button
				class="image-button"
				onclick={() => openLightbox(imageSrc ?? "", item.caption || "Image", item.caption || "")}
			>
				<img src={imageSrc ?? ""} alt={item.caption || "Image"} loading="lazy" decoding="async" />
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
	caption={lightboxCaption}
	isOpen={lightboxOpen}
	onClose={() => (lightboxOpen = false)}
/>

<style>
	.gutter-item {
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.gutter-comment {
		padding: 0.875rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-primary);
		border-radius: 0 var(--radius) var(--radius) 0;
		color: var(--color-ink);
		transition: border-color var(--transition);
	}

	.gutter-comment:hover {
		border-left-color: var(--color-accent);
	}

	.gutter-comment :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.gutter-comment :global(p:last-child) {
		margin-bottom: 0;
	}

	.gutter-comment :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.gutter-comment :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
		display: block;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.gutter-comment :global(img:hover) {
		opacity: 0.9;
	}

	.gutter-photo {
		margin: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.5rem;
		transition: border-color var(--transition);
	}

	.gutter-photo:hover {
		border-color: var(--color-primary);
	}

	.image-button {
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		display: block;
		width: 100%;
	}

	.gutter-photo img {
		width: 100%;
		height: auto;
		border-radius: 4px;
		display: block;
	}

	.gutter-photo figcaption {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-muted);
		font-style: italic;
		text-align: center;
	}
</style>
