<script lang="ts">
	import { Input as ShadcnInput } from "$lib/components/ui/input";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends Omit<HTMLInputAttributes, "class"> {
		label?: string;
		error?: string;
		value?: string | number;
		placeholder?: string;
		type?: "text" | "email" | "password" | "number";
		required?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		error,
		value = $bindable(""),
		placeholder,
		type = "text",
		required = false,
		disabled = false,
		class: className,
		...restProps
	}: Props = $props();

	const inputClass = $derived(
		cn(
			error && "border-destructive focus-visible:ring-destructive/20",
			className
		)
	);
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
			{label}
			{#if required}
				<span class="text-destructive">*</span>
			{/if}
		</label>
	{/if}

	<ShadcnInput
		bind:value
		{type}
		{placeholder}
		{required}
		{disabled}
		class={inputClass}
		{...restProps}
	/>

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
