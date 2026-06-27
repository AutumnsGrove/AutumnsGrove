<script>
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import GutterManager from '$lib/components/admin/GutterManager.svelte';
	import Save from '@lucide/svelte/icons/save';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();

	function parseGutter(raw) {
		try {
			if (!raw) return [];
			const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
			return JSON.parse(str);
		} catch { return []; }
	}

	// Intentionally capturing initial values — these are editable form fields
	let title = $state(structuredClone(data.post.title));
	let description = $state(structuredClone(data.post.description));
	let tags = $state(data.post.tags.join(', '));
	let markdownContent = $state(structuredClone(data.post.markdown_content || ''));
	let gutterItems = $state(parseGutter(data.post.gutter_content));
	let saving = $state(false);
	let error = $state('');
	let saved = $state(false);

	let editorRef = $state();

	let availableAnchors = $derived(editorRef?.getAvailableAnchors?.() ?? []);

	async function save() {
		if (!title || !markdownContent) {
			error = 'Title and content are required.';
			return;
		}

		saving = true;
		error = '';
		saved = false;

		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

		try {
			const res = await fetch(`/api/posts/${data.post.slug}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': csrfToken || '',
				},
				body: JSON.stringify({
					title,
					description,
					tags: tags.split(',').map(t => t.trim()).filter(Boolean),
					markdown_content: markdownContent,
					gutter_content: JSON.stringify(gutterItems),
					date: data.post.date,
				}),
			});

			if (res.ok) {
				saved = true;
				setTimeout(() => saved = false, 2000);
			} else {
				const d = await res.json().catch(() => ({}));
				error = d.message || 'Failed to save.';
			}
		} catch {
			error = 'Network error.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit: {data.post.title} - Admin</title>
</svelte:head>

<div class="editor-page">
	<a href="/admin/blog" class="back-link"><ArrowLeft size={14} /> All posts</a>
	<h1>Edit Post</h1>

	{#if error}
		<div class="error-msg">{error}</div>
	{/if}
	{#if saved}
		<div class="success-msg">Saved!</div>
	{/if}

	<div class="admin-field-row">
		<div class="admin-field">
			<label class="admin-field-label" for="title">Title</label>
			<input class="admin-input" id="title" bind:value={title} />
		</div>
		<div class="admin-field">
			<label class="admin-field-label" for="slug">Slug</label>
			<input class="admin-input" id="slug" value={data.post.slug} disabled style="font-family: monospace; opacity: 0.6;" />
		</div>
	</div>

	<div class="admin-field" style="margin-bottom: 1rem;">
		<label class="admin-field-label" for="description">Description</label>
		<input class="admin-input" id="description" bind:value={description} />
	</div>

	<div class="admin-field" style="margin-bottom: 1rem;">
		<label class="admin-field-label" for="tags">Tags</label>
		<input class="admin-input" id="tags" bind:value={tags} placeholder="comma-separated" />
	</div>

	<div class="editor-grid">
		<div class="admin-field">
			<span class="admin-field-label">Content</span>
			<MarkdownEditor bind:this={editorRef} bind:value={markdownContent} onSave={save} />
		</div>

		<div class="admin-field">
			<GutterManager bind:gutterItems availableAnchors={availableAnchors} />
		</div>
	</div>

	<div class="save-bar">
		<button class="admin-btn-primary" onclick={save} disabled={saving}>
			<Save size={16} />
			{saving ? 'Saving...' : 'Save'}
		</button>
	</div>
</div>

<style>
	.editor-page {
		padding: 2rem;
		max-width: 1200px;
	}

	h1 { margin-bottom: 1.5rem; }

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-muted);
		margin-bottom: 1rem;
	}

	.back-link:hover { color: var(--color-primary); }

	.error-msg {
		padding: 0.75rem 1rem;
		background: oklch(0.95 0.03 25);
		color: oklch(0.45 0.15 25);
		border-radius: var(--radius);
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}

	.success-msg {
		padding: 0.75rem 1rem;
		background: oklch(0.95 0.03 145);
		color: oklch(0.45 0.15 145);
		border-radius: var(--radius);
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}

	.editor-grid {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 1024px) {
		.editor-grid {
			grid-template-columns: 1fr;
		}
	}

	.save-bar {
		display: flex;
		gap: 0.5rem;
	}
</style>
