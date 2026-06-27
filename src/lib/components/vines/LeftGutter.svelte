<script lang="ts">
	import { tick } from "svelte";
	import GutterItem from "./GutterItem.svelte";
	import {
		parseAnchor,
		getAnchorKey,
		getUniqueAnchors,
		getItemsForAnchor,
		getOrphanItems,
		type GutterItem as GutterItemType,
		type Header,
	} from "$lib/utils/gutter";

	interface Props {
		items?: GutterItemType[];
		headers?: Header[];
		contentElement?: HTMLElement;
	}

	let { items = [], headers = [], contentElement }: Props = $props();

	let gutterElement = $state<HTMLElement>();
	let anchorGroupElements = $state<Record<string, HTMLElement>>({});
	let itemPositions = $state<Record<string, number>>({});

	let uniqueAnchors = $derived(getUniqueAnchors(items));
	let orphanItems = $derived(getOrphanItems(items, headers));

	function findAnchorElement(anchor: string): HTMLElement | null {
		const parsed = parseAnchor(anchor);
		if (!contentElement) return null;

		switch (parsed.type) {
			case "header": {
				const headerText = anchor.replace(/^#+\s*/, "");
				const header = headers.find((h) => h.text === headerText);
				if (header) return document.getElementById(header.id);
				return null;
			}
			case "paragraph": {
				const paragraphs = contentElement.querySelectorAll(":scope > p");
				if (typeof parsed.value !== "number") return null;
				const index = parsed.value - 1;
				if (index >= 0 && index < paragraphs.length) return paragraphs[index] as HTMLElement;
				return null;
			}
			case "tag": {
				return contentElement.querySelector<HTMLElement>(`[data-anchor="${parsed.value}"]`);
			}
			default:
				return null;
		}
	}

	function getDocumentOffset(el: HTMLElement): number {
		let top = 0;
		let current: HTMLElement | null = el;
		while (current) {
			top += current.offsetTop;
			current = current.offsetParent as HTMLElement | null;
		}
		return top;
	}

	async function updatePositions() {
		if (!gutterElement || !contentElement) return;

		await tick();

		const gutterDocTop = getDocumentOffset(gutterElement);
		const minGap = 16;
		let lastBottom = 0;

		const anchorPositions = uniqueAnchors
			.map((anchor) => {
				const el = findAnchorElement(anchor);
				return {
					anchor,
					key: getAnchorKey(anchor, headers),
					element: el,
					top: el ? getDocumentOffset(el) : Infinity,
				};
			})
			.sort((a, b) => a.top - b.top);

		const newPositions: Record<string, number> = {};

		for (const { key, element, top: anchorDocTop } of anchorPositions) {
			const groupEl = anchorGroupElements[key];
			if (!element || !groupEl) continue;

			let desiredTop = anchorDocTop - gutterDocTop;
			const groupHeight = groupEl.offsetHeight;

			if (desiredTop < lastBottom + minGap) {
				desiredTop = lastBottom + minGap;
			}

			newPositions[key] = desiredTop;
			lastBottom = desiredTop + groupHeight;
		}

		itemPositions = newPositions;
	}

	$effect(() => {
		const onResize = () => updatePositions();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	});

	$effect(() => {
		items;
		headers;
		contentElement;
		const timeout = setTimeout(updatePositions, 150);
		return () => clearTimeout(timeout);
	});
</script>

<aside class="left-gutter" bind:this={gutterElement}>
	{#if items.length > 0}
		{#each orphanItems as item, index (index)}
			<div class="gutter-orphan">
				<GutterItem {item} />
			</div>
		{/each}

		{#each uniqueAnchors as anchor (anchor)}
			{@const anchorKey = getAnchorKey(anchor, headers)}
			{@const anchorItems = getItemsForAnchor(items, anchor)}
			{#if anchorItems.length > 0}
				<div
					class="anchor-group"
					style="top: {itemPositions[anchorKey] ?? 0}px"
					bind:this={anchorGroupElements[anchorKey]}
				>
					{#each anchorItems as item, index (index)}
						<GutterItem {item} />
					{/each}
				</div>
			{/if}
		{/each}
	{/if}
</aside>

<style>
	.left-gutter {
		position: relative;
		min-height: 100%;
	}

	.gutter-orphan {
		margin-bottom: 1rem;
	}

	.anchor-group {
		position: absolute;
		left: 0;
		right: 0;
	}
</style>
