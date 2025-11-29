<script lang="ts">
	import {
		Dialog as ShadcnDialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from "$lib/components/ui/dialog";
	import type { Snippet } from "svelte";

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		header,
		footer,
		children
	}: Props = $props();
</script>

<ShadcnDialog bind:open>
	<DialogContent>
		{#if header || title || description}
			<DialogHeader>
				{#if header}
					{@render header()}
				{:else}
					{#if title}
						<DialogTitle>{title}</DialogTitle>
					{/if}
					{#if description}
						<DialogDescription>{description}</DialogDescription>
					{/if}
				{/if}
			</DialogHeader>
		{/if}

		{#if children}
			<div class="py-4">
				{@render children()}
			</div>
		{/if}

		{#if footer}
			<DialogFooter>
				{@render footer()}
			</DialogFooter>
		{/if}
	</DialogContent>
</ShadcnDialog>
