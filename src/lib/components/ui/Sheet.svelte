<script lang="ts">
	import {
		Sheet as ShadcnSheet,
		SheetTrigger,
		SheetClose,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
		SheetFooter
	} from "$lib/components/ui/sheet";
	import type { Snippet } from "svelte";

	interface Props {
		open?: boolean;
		side?: "left" | "right" | "top" | "bottom";
		title?: string;
		description?: string;
		trigger?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		side = "right",
		title,
		description,
		trigger,
		footer,
		children
	}: Props = $props();
</script>

<ShadcnSheet bind:open>
	{#if trigger}
		<SheetTrigger>
			{@render trigger()}
		</SheetTrigger>
	{/if}

	<SheetContent {side}>
		{#if title || description}
			<SheetHeader>
				{#if title}
					<SheetTitle>{title}</SheetTitle>
				{/if}
				{#if description}
					<SheetDescription>{description}</SheetDescription>
				{/if}
			</SheetHeader>
		{/if}

		{#if children}
			<div class="py-4">
				{@render children()}
			</div>
		{/if}

		{#if footer}
			<SheetFooter>
				{@render footer()}
			</SheetFooter>
		{/if}
	</SheetContent>
</ShadcnSheet>
