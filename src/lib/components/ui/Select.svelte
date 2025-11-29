<script lang="ts">
	import {
		Select as ShadcnSelect,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
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
</script>

<ShadcnSelect bind:value {disabled}>
	<SelectTrigger class={className}>
		<SelectValue {placeholder} />
	</SelectTrigger>
	<SelectContent>
		{#each options as option (option.value)}
			<SelectItem value={option.value} disabled={option.disabled ?? false}>
				{option.label}
			</SelectItem>
		{/each}
	</SelectContent>
</ShadcnSelect>
