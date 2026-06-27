<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
</script>

<button onclick={toggleTheme} class="theme-toggle" aria-label="Toggle dark mode">
	{#if $theme === 'light'}
		<Moon size={18} />
	{:else}
		<Sun size={18} />
	{/if}
</button>

<style>
	.theme-toggle {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-muted);
		cursor: pointer;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color var(--transition), border-color var(--transition);
	}

	.theme-toggle:hover {
		color: var(--color-ink);
		border-color: var(--color-muted);
	}
</style>
