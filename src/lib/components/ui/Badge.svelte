<script lang="ts">
	import { Badge as ShadcnBadge } from "$lib/components/ui/badge";
	import type { Snippet } from "svelte";

	type BadgeVariant = "default" | "secondary" | "destructive" | "tag";

	interface Props {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = "default",
		class: className,
		children
	}: Props = $props();

	// Map tag variant to secondary styling
	const variantMap: Record<BadgeVariant, "default" | "secondary" | "destructive"> = {
		default: "default",
		secondary: "secondary",
		destructive: "destructive",
		tag: "secondary"
	};

	const shadcnVariant = $derived(variantMap[variant]);
</script>

<ShadcnBadge variant={shadcnVariant} class={className}>
	{@render children?.()}
</ShadcnBadge>
