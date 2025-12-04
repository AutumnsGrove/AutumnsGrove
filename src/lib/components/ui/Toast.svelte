<script lang="ts">
	import { browser } from "$app/environment";
	import { Toaster } from "sonner";

	interface Props {
		position?:
			| "top-left"
			| "top-center"
			| "top-right"
			| "bottom-left"
			| "bottom-center"
			| "bottom-right";
		theme?: "light" | "dark" | "system";
	}

	let { position = "bottom-right", theme = "system" }: Props = $props();
</script>

{#if browser}
	<Toaster {position} {theme} />
{/if}
