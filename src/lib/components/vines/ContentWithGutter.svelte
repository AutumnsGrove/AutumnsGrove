<script lang="ts">
	import { untrack } from "svelte";
	import TableOfContents from "./TableOfContents.svelte";
	import MobileTOC from "./MobileTOC.svelte";
	import GutterItem from "./GutterItem.svelte";
	import {
		getAnchorKey,
		getUniqueAnchors,
		getItemsForAnchor,
		getOrphanItems,
		findAnchorElement,
		type GutterItem as GutterItemType,
		type Header,
	} from "$lib/utils/gutter";

	let {
		content = "",
		gutterContent = [] as GutterItemType[],
		headers = [] as Header[],
		showTableOfContents = true,
		children,
	} = $props();

	let contentBodyElement = $state<HTMLElement | undefined>();

	let hasGutter = $derived(gutterContent && gutterContent.length > 0);
	let hasRightGutter = $derived(showTableOfContents && headers && headers.length > 0);

	let gutterRefs = $state<Record<string, HTMLElement>>({});
	let uniqueAnchors = $derived(getUniqueAnchors(gutterContent));
	let orphanItems = $derived(getOrphanItems(gutterContent, headers));

	function getKey(anchor: string) {
		return getAnchorKey(anchor, headers);
	}

	function getItems(anchor: string) {
		return getItemsForAnchor(gutterContent, anchor);
	}

	function getItemKey(item: GutterItemType, index: number): string {
		return [item.type || "unknown", item.file || item.src || item.url || "", item.anchor || "", index].join("-");
	}

	function handleCopyClick(event: Event) {
		const target = event.target as HTMLElement;
		const button = target.closest(".code-block-copy") as HTMLElement | null;
		if (!button) return;

		const codeText = button.getAttribute("data-code");
		if (!codeText) return;

		const textarea = document.createElement("textarea");
		textarea.innerHTML = codeText;
		const decodedText = textarea.value;

		navigator.clipboard.writeText(decodedText).then(() => {
			const copyText = button.querySelector(".copy-text");
			const originalText = copyText?.textContent || "Copy";
			if (copyText) copyText.textContent = "Copied!";
			button.classList.add("copied");
			setTimeout(() => {
				if (copyText) copyText.textContent = originalText;
				button.classList.remove("copied");
			}, 2000);
		}).catch(() => {});
	}

	// Assign IDs to headers + insert floated gutter items into content flow
	$effect(() => {
		const contentEl = contentBodyElement;
		if (!contentEl) return;

		uniqueAnchors;
		headers;
		content;

		const movedElements: Array<{ element: HTMLElement; originalParent: HTMLElement | null; originalNextSibling: Node | null }> = [];

		untrack(() => {
			// Assign IDs to headers
			if (headers && headers.length > 0) {
				const headerElements = contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
				headerElements.forEach((el: Element) => {
					const text = (el as HTMLElement).textContent?.trim() || "";
					const matchingHeader = headers.find((h: Header) => h.text === text);
					if (matchingHeader) (el as HTMLElement).id = matchingHeader.id;
				});
			}

			// Insert gutter items into content flow at their anchor points
			for (const anchor of uniqueAnchors) {
				const anchorKey = getKey(anchor);
				const gutterEl = gutterRefs[anchorKey];
				if (!gutterEl || gutterEl.children.length === 0) continue;

				const originalParent = gutterEl.parentElement;
				const originalNextSibling = gutterEl.nextSibling;

				const targetEl = findAnchorElement(anchor, contentEl as HTMLElement, headers);

				if (targetEl) {
					const isHeading = /^H[1-6]$/.test(targetEl.tagName);
					targetEl.insertAdjacentElement(isHeading ? "afterend" : "beforebegin", gutterEl);
					movedElements.push({ element: gutterEl, originalParent, originalNextSibling });
				}
			}
		});

		return () => {
			for (const { element, originalParent, originalNextSibling } of movedElements) {
				if (originalParent && element.parentElement !== originalParent) {
					if (originalNextSibling) {
						originalParent.insertBefore(element, originalNextSibling);
					} else {
						originalParent.appendChild(element);
					}
				}
			}
		};
	});
</script>

<div class="content-layout" class:has-right-gutter={hasRightGutter}>
	<article class="content-article">
		{#if children}
			{@render children()}
		{/if}

		<!-- Orphan items (no anchor) float at the top of content -->
		{#if hasGutter && orphanItems.length > 0}
			<div class="vine-float">
				{#each orphanItems as item, index (getItemKey(item, index))}
					<GutterItem {item} />
				{/each}
			</div>
		{/if}

		<!-- Anchored gutter items — inserted into content flow via DOM manipulation -->
		{#if hasGutter}
			{#each uniqueAnchors as anchor (anchor)}
				{@const anchorKey = getKey(anchor)}
				{@const anchorItems = getItems(anchor)}
				{#if anchorItems.length > 0}
					<div class="vine-float" bind:this={gutterRefs[anchorKey]}>
						{#each anchorItems as item, index (getItemKey(item, index))}
							<GutterItem {item} />
						{/each}
					</div>
				{/if}
			{/each}
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="prose content-body" bind:this={contentBodyElement} onclick={handleCopyClick}>
			{@html content}
		</div>
	</article>

	{#if hasRightGutter}
		<div class="right-gutter-container desktop-only">
			<TableOfContents {headers} />
		</div>
	{/if}
</div>

{#if hasRightGutter}
	<MobileTOC {headers} />
{/if}

<style>
	.content-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.content-layout.has-right-gutter {
		grid-template-columns: 1fr 220px;
	}

	.content-article {
		min-width: 0;
	}

	.right-gutter-container {
		min-width: 0;
	}

	.desktop-only {
		display: block;
	}

	/* Vine floats — gutter items that float left within content */
	.vine-float {
		float: left;
		clear: left;
		width: 280px;
		margin: 0.25rem 1.5rem 1rem -2rem;
	}

	@media (max-width: 1024px) {
		.content-layout.has-right-gutter {
			grid-template-columns: 1fr;
		}

		.desktop-only {
			display: none;
		}

		/* On smaller screens, don't float — stack normally */
		.vine-float {
			float: none;
			width: 100%;
			margin: 1rem 0;
		}
	}
</style>
