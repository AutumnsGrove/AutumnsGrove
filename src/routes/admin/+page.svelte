<script>
	import FileText from '@lucide/svelte/icons/file-text';
	import PlusCircle from '@lucide/svelte/icons/plus-circle';
	import Settings from '@lucide/svelte/icons/settings';
</script>

<svelte:head>
	<title>Admin - Autumns Grove</title>
</svelte:head>

<div class="dashboard">
	<h1>Dashboard</h1>

	<div class="quick-links">
		<a href="/admin/blog" class="quick-link">
			<FileText size={20} />
			<span>Manage Posts</span>
		</a>
		<a href="/admin/blog/new" class="quick-link">
			<PlusCircle size={20} />
			<span>New Post</span>
		</a>
		<a href="/admin/settings" class="quick-link">
			<Settings size={20} />
			<span>Settings</span>
		</a>
	</div>
</div>

<style>
	.dashboard {
		padding: 2rem;
		max-width: 700px;
	}

	h1 {
		margin-bottom: 2rem;
	}

	.quick-links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-ink);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: border-color var(--transition), color var(--transition);
	}

	.quick-link:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
</style>
