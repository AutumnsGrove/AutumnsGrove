<script lang="ts">
	/**
	 * LeafDivider - A decorative section break
	 * The signature Grove aesthetic: lines with a leaf/nature icon in the center
	 */

	interface Props {
		/** Additional CSS classes */
		class?: string;
		/** Icon variant: 'leaf', 'dot', 'seed' */
		variant?: 'leaf' | 'dot' | 'seed';
	}

	let { class: className = '', variant = 'leaf' }: Props = $props();
</script>

<div class="leaf-divider {className}" role="separator" aria-hidden="true">
	{#if variant === 'leaf'}
		<!-- Stylized leaf shape -->
		<svg viewBox="0 0 20 20" fill="currentColor">
			<path
				d="M10 2C8 6 5 8 2 8c3 2 5 5 5 10 2-4 5-6 8-6-3-2-5-5-5-10z"
				fill-opacity="0.7"
			/>
		</svg>
	{:else if variant === 'dot'}
		<!-- Simple dot -->
		<svg viewBox="0 0 20 20" fill="currentColor">
			<circle cx="10" cy="10" r="4" />
		</svg>
	{:else if variant === 'seed'}
		<!-- Seed/acorn shape -->
		<svg viewBox="0 0 20 20" fill="currentColor">
			<ellipse cx="10" cy="12" rx="4" ry="5" fill-opacity="0.6" />
			<path d="M8 7 C8 5 10 3 10 3 C10 3 12 5 12 7 L10 8 Z" fill-opacity="0.8" />
		</svg>
	{/if}
</div>

<style>
	.leaf-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem 0;
	}

	.leaf-divider::before,
	.leaf-divider::after {
		content: '';
		width: 3rem;
		height: 1px;
		background-color: var(--color-divider);
	}

	.leaf-divider svg {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-accent-subtle);
		flex-shrink: 0;
	}
</style>
