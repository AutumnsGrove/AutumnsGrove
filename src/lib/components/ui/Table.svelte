<script lang="ts">
	import {
		Table as ShadcnTable,
		TableHeader,
		TableBody,
		TableRow,
		TableCell
	} from "$lib/components/ui/table";
	import type { Snippet } from "svelte";

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<ShadcnTable class={className}>
	{#if children}
		{@render children()}
	{/if}
</ShadcnTable>
