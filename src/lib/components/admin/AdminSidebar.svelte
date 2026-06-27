<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import FileText from '@lucide/svelte/icons/file-text';
	import PlusCircle from '@lucide/svelte/icons/plus-circle';
	import Settings from '@lucide/svelte/icons/settings';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose = () => {} }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/blog', label: 'Posts', icon: FileText },
		{ href: '/admin/blog/new', label: 'New Post', icon: PlusCircle },
		{ href: '/admin/settings', label: 'Settings', icon: Settings },
	];

	function isActive(href: string): boolean {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}
</script>

{#if open}
	<button class="backdrop" onclick={onClose} aria-label="Close menu" tabindex="-1"></button>
{/if}

<aside class="sidebar" class:open>
	<div class="sidebar-header">
		<a href="/" class="back-to-site"><ArrowLeft size={14} /> Site</a>
		<button class="close-btn" onclick={onClose} aria-label="Close"><X size={18} /></button>
	</div>

	<nav class="sidebar-nav">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={isActive(item.href)}
				onclick={onClose}
			>
				<item.icon size={18} />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="sidebar-footer">
		<ThemeToggle />
	</div>
</aside>

<style>
	.sidebar {
		width: 220px;
		min-height: 100vh;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		padding: 1.25rem 0;
		flex-shrink: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem 1rem;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 0.75rem;
	}

	.back-to-site {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		color: var(--color-muted);
		transition: color var(--transition);
	}

	.back-to-site:hover {
		color: var(--color-primary);
	}

	.close-btn {
		display: none;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		padding: 0.25rem;
	}

	.sidebar-nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0 0.75rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius);
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--color-muted);
		text-decoration: none;
		transition: color var(--transition), background var(--transition);
	}

	.nav-item:hover {
		color: var(--color-ink);
		background: var(--color-surface-hover);
	}

	.nav-item.active {
		color: var(--color-primary);
		background: var(--color-surface-hover);
		font-weight: 600;
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.75rem;
	}

	.backdrop {
		display: none;
	}

	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 50;
			transform: translateX(-100%);
			transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.close-btn {
			display: flex;
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 40;
			background: oklch(0.1 0 0 / 0.5);
			backdrop-filter: blur(4px);
			border: none;
			padding: 0;
			cursor: default;
		}
	}
</style>
