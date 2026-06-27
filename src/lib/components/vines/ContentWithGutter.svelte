<script lang="ts">
	import { untrack } from "svelte";
	import TableOfContents from "./TableOfContents.svelte";
	import MobileTOC from "./MobileTOC.svelte";
	import LeftGutter from "./LeftGutter.svelte";
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

	let hasLeftGutter = $derived(gutterContent && gutterContent.length > 0);
	let hasRightGutter = $derived(showTableOfContents && headers && headers.length > 0);

	// Mobile: inline gutter refs for DOM insertion
	let mobileGutterRefs = $state<Record<string, HTMLElement>>({});
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

	// Assign IDs to headers in content + position mobile inline gutters
	$effect(() => {
		const contentEl = contentBodyElement;
		if (!contentEl) return;

		uniqueAnchors;
		headers;
		content;

		const movedElements: Array<{ element: HTMLElement; originalParent: HTMLElement | null; originalNextSibling: Node | null }> = [];

		untrack(() => {
			if (headers && headers.length > 0) {
				const headerElements = contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
				headerElements.forEach((el: Element) => {
					const text = (el as HTMLElement).textContent?.trim() || "";
					const matchingHeader = headers.find((h: Header) => h.text === text);
					if (matchingHeader) (el as HTMLElement).id = matchingHeader.id;
				});
			}

			// Mobile inline gutter positioning
			for (const anchor of uniqueAnchors) {
				const anchorKey = getKey(anchor);
				const mobileGutterEl = mobileGutterRefs[anchorKey];
				if (!mobileGutterEl || mobileGutterEl.children.length === 0) continue;

				const originalParent = mobileGutterEl.parentElement;
				const originalNextSibling = mobileGutterEl.nextSibling;

				const targetEl = findAnchorElement(anchor, contentEl as HTMLElement, headers);

				if (targetEl) {
					const isHeading = /^H[1-6]$/.test(targetEl.tagName);
					targetEl.insertAdjacentElement(isHeading ? "afterend" : "beforebegin", mobileGutterEl);
					movedElements.push({ element: mobileGutterEl, originalParent, originalNextSibling });
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

<div
	class="content-layout"
	class:has-left-gutter={hasLeftGutter}
	class:has-right-gutter={hasRightGutter}
>
	<!-- Left Gutter — desktop only, positioned annotations -->
	{#if hasLeftGutter}
		<div class="left-gutter-container desktop-only">
			<LeftGutter items={gutterContent} {headers} contentElement={contentBodyElement} />
		</div>
	{/if}

	<!-- Main Content -->
	<article class="content-article">
		{#if children}
			{@render children()}
		{/if}

		<!-- Mobile inline gutter items (hidden on desktop, moved into position via DOM) -->
		{#if hasLeftGutter}
			{#if orphanItems.length > 0}
				<div class="mobile-gutter-content mobile-only">
					{#each orphanItems as item, index (getItemKey(item, index))}
						<GutterItem {item} />
					{/each}
				</div>
			{/if}

			{#each uniqueAnchors as anchor (anchor)}
				{@const anchorKey = getKey(anchor)}
				{@const anchorItems = getItems(anchor)}
				{#if anchorItems.length > 0}
					<div
						class="mobile-gutter-content mobile-gutter-inline mobile-only"
						bind:this={mobileGutterRefs[anchorKey]}
					>
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

	<!-- Right Gutter — Table of Contents -->
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

	/* Left gutter only */
	.content-layout.has-left-gutter:not(.has-right-gutter) {
		grid-template-columns: 280px 1fr;
	}

	/* Right gutter only */
	.content-layout.has-right-gutter:not(.has-left-gutter) {
		grid-template-columns: 1fr 220px;
	}

	/* Both gutters */
	.content-layout.has-left-gutter.has-right-gutter {
		grid-template-columns: 280px 1fr 220px;
		max-width: 1300px;
	}

	.content-article {
		min-width: 0;
	}

	.left-gutter-container,
	.right-gutter-container {
		min-width: 0;
	}

	.desktop-only {
		display: block;
	}

	.mobile-only {
		display: none;
	}

	.mobile-gutter-content {
		margin: 1.5rem 0;
	}

	@media (max-width: 1024px) {
		.content-layout.has-left-gutter:not(.has-right-gutter),
		.content-layout.has-right-gutter:not(.has-left-gutter),
		.content-layout.has-left-gutter.has-right-gutter {
			grid-template-columns: 1fr;
		}

		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}
	}
</style>
