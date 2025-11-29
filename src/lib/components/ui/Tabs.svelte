<script lang="ts">
	import {
		Tabs as ShadcnTabs,
		TabsContent,
		TabsList,
		TabsTrigger
	} from "$lib/components/ui/tabs";
	import type { Snippet } from "svelte";

	interface Tab {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string | undefined;
		tabs: Tab[];
		content?: Snippet<[tab: Tab]>;
		class?: string;
		children?: Snippet;
	}

	let {
		value = $bindable(tabs[0]?.value ?? ""),
		tabs,
		content,
		class: className,
		children
	}: Props = $props();
</script>

<ShadcnTabs bind:value class={className}>
	<TabsList>
		{#each tabs as tab (tab.value)}
			<TabsTrigger value={tab.value} disabled={tab.disabled ?? false}>
				{tab.label}
			</TabsTrigger>
		{/each}
	</TabsList>

	{#each tabs as tab (tab.value)}
		<TabsContent value={tab.value}>
			{#if content}
				{@render content(tab)}
			{:else if children}
				{@render children()}
			{/if}
		</TabsContent>
	{/each}
</ShadcnTabs>
