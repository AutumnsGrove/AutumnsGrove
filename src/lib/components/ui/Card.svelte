<script lang="ts">
	import {
		Card as ShadcnCard,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from "$lib/components/ui/card";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		title?: string;
		description?: string;
		hoverable?: boolean;
		class?: string;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	}

	let {
		title,
		description,
		hoverable = false,
		class: className,
		header,
		footer,
		children
	}: Props = $props();

	const cardClass = $derived(
		cn(
			hoverable && "hover:shadow-lg transition-shadow cursor-pointer",
			className
		)
	);
</script>

<ShadcnCard class={cardClass}>
	{#if header || title || description}
		<CardHeader>
			{#if header}
				{@render header()}
			{:else}
				{#if title}
					<CardTitle>{title}</CardTitle>
				{/if}
				{#if description}
					<CardDescription>{description}</CardDescription>
				{/if}
			{/if}
		</CardHeader>
	{/if}

	{#if children}
		<CardContent>
			{@render children()}
		</CardContent>
	{/if}

	{#if footer}
		<CardFooter>
			{@render footer()}
		</CardFooter>
	{/if}
</ShadcnCard>
