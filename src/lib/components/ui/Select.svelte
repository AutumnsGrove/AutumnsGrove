<script lang="ts">
	import {
		Select as ShadcnSelect,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from "$lib/components/ui/select";
	import type { Snippet } from "svelte";

	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string | undefined;
		options: Option[];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		value = $bindable(undefined),
		options,
		placeholder = "Select an option",
		disabled = false,
		class: className
	}: Props = $props();

	const selectedLabel = $derived(
		value ? options.find(opt => opt.value === value)?.label ?? placeholder : placeholder
	);
</script>

<ShadcnSelect bind:value {disabled}>
	<SelectTrigger class={className}>
		{selectedLabel}
	</SelectTrigger>
	<SelectContent>
		{#each options as option (option.value)}
			<SelectItem value={option.value} disabled={option.disabled ?? false}>
				{option.label}
			</SelectItem>
		{/each}
	</SelectContent>
</ShadcnSelect>
