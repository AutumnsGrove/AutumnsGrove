<script lang="ts">
	import {
		Accordion as ShadcnAccordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent
	} from "$lib/components/ui/accordion";
	import type { Snippet } from "svelte";

	interface AccordionItemConfig {
		value: string;
		title: string;
		content?: string;
		disabled?: boolean;
	}

	interface Props {
		items: AccordionItemConfig[];
		type?: "single" | "multiple";
		collapsible?: boolean;
		class?: string;
		contentSnippet?: Snippet<[item: AccordionItemConfig]>;
	}

	let {
		items,
		type = "single",
		collapsible = false,
		class: className,
		contentSnippet
	}: Props = $props();

	const accordionType = $derived(type === "single" ? "single" : "multiple");
</script>

<ShadcnAccordion type={accordionType} {collapsible} class={className}>
	{#each items as item (item.value)}
		<AccordionItem value={item.value} disabled={item.disabled ?? false}>
			<AccordionTrigger>{item.title}</AccordionTrigger>
			<AccordionContent>
				{#if contentSnippet}
					{@render contentSnippet(item)}
				{:else if item.content}
					{item.content}
				{/if}
			</AccordionContent>
		</AccordionItem>
	{/each}
</ShadcnAccordion>
