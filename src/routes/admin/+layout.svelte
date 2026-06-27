<script lang="ts">
	import '../../app.css';
	import '$lib/styles/admin.css';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import { theme } from '$lib/stores/theme';
	import Menu from '@lucide/svelte/icons/menu';

	let { children } = $props();
	let sidebarOpen = $state(false);
</script>

<div class="admin-shell" data-theme={$theme}>
	<button class="mobile-menu-btn" onclick={() => sidebarOpen = true} aria-label="Open menu">
		<Menu size={22} />
	</button>

	<AdminSidebar open={sidebarOpen} onClose={() => sidebarOpen = false} />

	<div class="admin-content">
		{@render children()}
	</div>
</div>

<style>
	.admin-shell {
		display: flex;
		min-height: 100vh;
		background: var(--color-bg);
	}

	.admin-content {
		flex: 1;
		min-width: 0;
	}

	.mobile-menu-btn {
		display: none;
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		z-index: 35;
		width: 48px;
		height: 48px;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		color: #fff;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.2);
	}

	@media (max-width: 768px) {
		.mobile-menu-btn {
			display: flex;
		}
	}
</style>
