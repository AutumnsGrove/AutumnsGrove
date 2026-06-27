<script>
	import PlusCircle from '@lucide/svelte/icons/plus-circle';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let { data } = $props();

	async function deletePost(slug) {
		if (!confirm(`Delete "${slug}"?`)) return;

		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		const res = await fetch(`/api/posts/${slug}`, {
			method: 'DELETE',
			headers: { 'x-csrf-token': csrfToken || '' },
		});

		if (res.ok) {
			window.location.reload();
		} else {
			alert('Failed to delete post');
		}
	}
</script>

<svelte:head>
	<title>Posts - Admin</title>
</svelte:head>

<div class="admin-list-page" style="padding: 2rem; max-width: 800px;">
	<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
		<h1>Posts</h1>
		<a href="/admin/blog/new" class="admin-btn-primary">
			<PlusCircle size={16} /> New Post
		</a>
	</div>

	{#if data.posts.length === 0}
		<div class="admin-empty">
			<p>No posts yet. Create your first one.</p>
		</div>
	{:else}
		<div class="admin-list-items">
			{#each data.posts as post}
				<div class="admin-list-item">
					<div class="admin-item-info">
						<a href="/admin/blog/{post.slug}" class="admin-item-title">{post.title}</a>
						<div class="admin-item-meta">
							<span class="admin-status {post.status}">{post.status}</span>
							{#if post.date}
								<span class="admin-date">{post.date}</span>
							{/if}
						</div>
					</div>
					<div class="admin-item-actions">
						<a href="/blog/{post.slug}" class="admin-action-btn" title="View" target="_blank" rel="noopener">
							<ExternalLink size={16} />
						</a>
						<a href="/admin/blog/{post.slug}" class="admin-action-btn" title="Edit">
							<Pencil size={16} />
						</a>
						<button class="admin-action-btn danger" title="Delete" onclick={() => deletePost(post.slug)}>
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
