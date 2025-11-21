<script>
	import { slide } from 'svelte/transition';

	let { title = '', expanded = $bindable(false), children } = $props();

	function toggle() {
		expanded = !expanded;
	}
</script>

<div class="collapsible-section">
	<button
		class="collapsible-toggle"
		onclick={toggle}
		aria-expanded={expanded}
	>
		<span class="collapsible-title">{title}</span>
		<span class="toggle-icon">{expanded ? '▼' : '▶'}</span>
	</button>

	{#if expanded}
		<div class="collapsible-content" transition:slide={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.collapsible-section {
		margin-bottom: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	:global(.dark) .collapsible-section {
		border-color: #3a3a3a;
	}

	.collapsible-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #f5f5f5;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		transition: background-color 0.2s;
	}

	:global(.dark) .collapsible-toggle {
		background: #2a2a2a;
		color: #e0e0e0;
	}

	.collapsible-toggle:hover {
		background: #e8e8e8;
	}

	:global(.dark) .collapsible-toggle:hover {
		background: #333;
	}

	.collapsible-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-icon {
		font-size: 0.75rem;
		transition: transform 0.2s;
	}

	.collapsible-content {
		padding: 1rem;
		background: #fafafa;
	}

	:global(.dark) .collapsible-content {
		background: #1f1f1f;
	}
</style>
