<script>
	import { goto } from '$app/navigation';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import Save from '@lucide/svelte/icons/save';

	let title = $state('');
	let slug = $state('');
	let description = $state('');
	let tags = $state('');
	let markdownContent = $state('');
	let saving = $state(false);
	let error = $state('');

	function generateSlug() {
		slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}

	async function save() {
		if (!title || !slug || !markdownContent) {
			error = 'Title, slug, and content are required.';
			return;
		}

		saving = true;
		error = '';

		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

		try {
			const res = await fetch('/api/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': csrfToken || '',
				},
				body: JSON.stringify({
					title,
					slug,
					description,
					tags: tags.split(',').map(t => t.trim()).filter(Boolean),
					markdown_content: markdownContent,
					status: 'published',
				}),
			});

			if (res.ok) {
				const data = await res.json();
				goto(`/admin/blog/${data.slug}`);
			} else {
				const data = await res.json().catch(() => ({}));
				error = data.message || 'Failed to create post.';
			}
		} catch {
			error = 'Network error.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>New Post - Admin</title>
</svelte:head>

<div class="editor-page" style="padding: 2rem; max-width: 1000px;">
	<h1>New Post</h1>

	{#if error}
		<div class="error-msg">{error}</div>
	{/if}

	<div class="admin-field-row">
		<div class="admin-field">
			<label class="admin-field-label" for="title">Title</label>
			<input class="admin-input" id="title" bind:value={title} oninput={generateSlug} placeholder="Post title" />
		</div>
		<div class="admin-field">
			<label class="admin-field-label" for="slug">Slug</label>
			<input class="admin-input" id="slug" bind:value={slug} placeholder="post-slug" style="font-family: monospace;" />
		</div>
	</div>

	<div class="admin-field" style="margin-bottom: 1rem;">
		<label class="admin-field-label" for="description">Description</label>
		<input class="admin-input" id="description" bind:value={description} placeholder="Brief description" />
	</div>

	<div class="admin-field" style="margin-bottom: 1rem;">
		<label class="admin-field-label" for="tags">Tags (comma-separated)</label>
		<input class="admin-input" id="tags" bind:value={tags} placeholder="svelte, web, thoughts" />
	</div>

	<div class="admin-field" style="margin-bottom: 1.5rem;">
		<span class="admin-field-label">Content</span>
		<MarkdownEditor bind:value={markdownContent} />
	</div>

	<button class="admin-btn-primary" onclick={save} disabled={saving}>
		<Save size={16} />
		{saving ? 'Saving...' : 'Publish'}
	</button>
</div>

<style>
	h1 {
		margin-bottom: 1.5rem;
	}

	.error-msg {
		padding: 0.75rem 1rem;
		background: oklch(0.95 0.03 25);
		color: oklch(0.45 0.15 25);
		border-radius: var(--radius);
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}
</style>
