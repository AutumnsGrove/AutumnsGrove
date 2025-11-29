<script lang="ts">
	import { Skeleton as ShadcnSkeleton } from "$lib/components/ui/skeleton";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
	}

	let { class: className, ...restProps }: Props = $props();
</script>

<ShadcnSkeleton class={className} {...restProps} />
