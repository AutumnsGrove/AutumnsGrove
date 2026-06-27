<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		user?: { id: string; email: string; name?: string | null } | null;
	}

	let { user = null }: Props = $props();
	let mobileOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' },
	];

	function closeMobile() {
		mobileOpen = false;
	}
</script>

{#if mobileOpen}
	<button class="backdrop" class:visible={mobileOpen} onclick={closeMobile} aria-label="Close menu" tabindex="-1"></button>
{/if}

<nav class="nav">
	<div class="nav-inner container">
		<a href="/" class="nav-brand" onclick={closeMobile}>
			<span class="brand-icon">🍂</span>
			Autumns Grove
		</a>

		<button
			class="nav-mobile-toggle"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Toggle menu"
			aria-expanded={mobileOpen}
		>
			{#if mobileOpen}
				<X size={22} />
			{:else}
				<Menu size={22} />
			{/if}
		</button>

		<div class="nav-links" class:open={mobileOpen}>
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
					onclick={closeMobile}
				>
					{item.label}
				</a>
			{/each}
			<div class="nav-divider"></div>
			<ThemeToggle />
		</div>
	</div>
</nav>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		height: var(--nav-height);
		display: flex;
		align-items: center;
		transition: background-color var(--transition);
	}

	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.nav-brand {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.3rem;
		color: var(--color-ink);
		text-decoration: none;
		letter-spacing: -0.02em;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.nav-brand:hover {
		color: var(--color-primary);
	}

	.brand-icon {
		font-size: 1.15rem;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-link {
		font-size: 0.88rem;
		font-weight: 400;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		transition: color var(--transition);
	}

	.nav-link:hover {
		color: var(--color-ink);
	}

	.nav-link.active {
		color: var(--color-primary);
		font-weight: 600;
	}

	.nav-mobile-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--color-ink);
		cursor: pointer;
		padding: 0.25rem;
		z-index: 120;
	}

	.nav-divider {
		display: none;
	}

	.backdrop {
		display: none;
	}

	@media (max-width: 768px) {
		.nav-mobile-toggle {
			display: flex;
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 90;
			background: oklch(0.1 0 0 / 0.5);
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
			opacity: 0;
			transition: opacity 300ms ease-out;
			border: none;
			padding: 0;
			cursor: default;
		}

		.backdrop.visible {
			opacity: 1;
		}

		.nav-links {
			position: fixed;
			top: 0;
			right: 0;
			bottom: 0;
			width: 280px;
			z-index: 110;
			flex-direction: column;
			align-items: flex-start;
			background: var(--color-bg);
			border-left: 1px solid var(--color-border);
			padding: 5rem 2rem 2rem;
			gap: 1.5rem;
			transform: translateX(100%);
			transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
		}

		.nav-links.open {
			transform: translateX(0);
		}

		.nav-link {
			font-size: 1rem;
			text-transform: none;
			letter-spacing: 0;
		}

		.nav-divider {
			display: block;
			width: 100%;
			height: 1px;
			background: var(--color-border);
		}
	}
</style>
