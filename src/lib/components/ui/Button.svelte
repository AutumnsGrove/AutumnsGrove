<script lang="ts">
	import { Button as ShadcnButton } from "$lib/components/ui/button";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
	type ButtonSize = "sm" | "md" | "lg";

	interface Props extends Omit<HTMLButtonAttributes, "class"> {
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = "primary",
		size = "md",
		disabled = false,
		class: className,
		children,
		...restProps
	}: Props = $props();

	// Map our simplified variants to shadcn variants
	const variantMap: Record<ButtonVariant, "default" | "secondary" | "destructive" | "ghost" | "link"> = {
		primary: "default",
		secondary: "secondary",
		danger: "destructive",
		ghost: "ghost",
		link: "link"
	};

	// Map our size variants to shadcn sizes
	const sizeMap: Record<ButtonSize, "sm" | "default" | "lg"> = {
		sm: "sm",
		md: "default",
		lg: "lg"
	};

	const shadcnVariant = $derived(variantMap[variant]);
	const shadcnSize = $derived(sizeMap[size]);
</script>

<ShadcnButton
	variant={shadcnVariant}
	size={shadcnSize}
	disabled={disabled}
	class={className}
	{...restProps}
>
	{@render children?.()}
</ShadcnButton>
