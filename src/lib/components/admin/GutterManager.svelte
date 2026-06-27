<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';
	import Anchor from '@lucide/svelte/icons/anchor';

	interface GutterItem {
		type: string;
		anchor?: string;
		content?: string;
		src?: string;
		url?: string;
		file?: string;
		caption?: string;
	}

	interface Props {
		gutterItems?: GutterItem[];
		availableAnchors?: string[];
		onchange?: (items: GutterItem[]) => void;
	}

	let { gutterItems = $bindable([]), availableAnchors = [], onchange }: Props = $props();

	let showModal = $state(false);
	let editingIndex: number | null = $state(null);

	let itemType = $state('comment');
	let itemAnchor = $state('');
	let itemContent = $state('');
	let itemUrl = $state('');
	let itemCaption = $state('');

	function resetForm() {
		itemType = 'comment';
		itemAnchor = '';
		itemContent = '';
		itemUrl = '';
		itemCaption = '';
	}

	function openAdd() {
		resetForm();
		editingIndex = null;
		showModal = true;
	}

	function openEdit(index: number) {
		const item = gutterItems[index];
		itemType = item.type || 'comment';
		itemAnchor = item.anchor || '';
		itemContent = item.content || '';
		itemUrl = item.src || item.url || item.file || '';
		itemCaption = item.caption || '';
		editingIndex = index;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingIndex = null;
		resetForm();
	}

	function save() {
		const item: GutterItem = { type: itemType, anchor: itemAnchor || undefined };

		if (itemType === 'comment' || itemType === 'markdown') {
			item.content = itemContent;
		} else if (itemType === 'photo' || itemType === 'image') {
			item.src = itemUrl;
			if (itemCaption) item.caption = itemCaption;
		}

		if (editingIndex !== null) {
			gutterItems[editingIndex] = item;
			gutterItems = [...gutterItems];
		} else {
			gutterItems = [...gutterItems, item];
		}

		onchange?.(gutterItems);
		closeModal();
	}

	function deleteItem(index: number) {
		gutterItems = gutterItems.filter((_: GutterItem, i: number) => i !== index);
		onchange?.(gutterItems);
	}

	function moveItem(index: number, direction: number) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= gutterItems.length) return;
		const items = [...gutterItems];
		[items[index], items[newIndex]] = [items[newIndex], items[index]];
		gutterItems = items;
		onchange?.(gutterItems);
	}

	function getPreview(item: GutterItem): string {
		if (item.type === 'comment' || item.type === 'markdown') {
			return (item.content || '').slice(0, 80) + ((item.content?.length || 0) > 80 ? '...' : '');
		}
		if (item.type === 'photo' || item.type === 'image') {
			return item.caption || item.src || item.url || 'Image';
		}
		return item.type;
	}

	function getAnchorLabel(anchor: string): string {
		if (!anchor) return 'No anchor';
		if (anchor.startsWith('anchor:')) return `Tag: ${anchor.slice(7)}`;
		if (anchor.startsWith('paragraph:')) return `Paragraph ${anchor.slice(10)}`;
		return anchor.replace(/^#+\s*/, '');
	}

	function insertNewAnchor() {
		const name = prompt('Enter anchor name (e.g., my-note):');
		if (name) {
			const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
			itemAnchor = `anchor:${safeName}`;
		}
	}
</script>

<div class="gutter-manager">
	<div class="gm-header">
		<h3>Vines</h3>
		<button type="button" class="admin-btn-outline" onclick={openAdd}>
			<Plus size={14} /> Add Vine
		</button>
	</div>

	{#if gutterItems.length === 0}
		<div class="gm-empty">
			<p>No vines yet. Add annotations that float alongside your content.</p>
		</div>
	{:else}
		<div class="gm-list">
			{#each gutterItems as item, index (index)}
				<div class="gm-item">
					<div class="gm-item-info">
						<span class="gm-item-type">{item.type}</span>
						<span class="gm-item-anchor">{getAnchorLabel(item.anchor || '')}</span>
						<p class="gm-item-preview">{getPreview(item)}</p>
					</div>
					<div class="gm-item-actions">
						<button type="button" title="Move up" onclick={() => moveItem(index, -1)} disabled={index === 0}>
							<ChevronUp size={14} />
						</button>
						<button type="button" title="Move down" onclick={() => moveItem(index, 1)} disabled={index === gutterItems.length - 1}>
							<ChevronDown size={14} />
						</button>
						<button type="button" title="Edit" onclick={() => openEdit(index)}>
							<Pencil size={14} />
						</button>
						<button type="button" title="Delete" class="danger" onclick={() => deleteItem(index)}>
							<Trash2 size={14} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add/Edit Modal -->
{#if showModal}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="gm-backdrop" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="gm-modal" onclick={(e) => e.stopPropagation()}>
			<div class="gm-modal-header">
				<h3>{editingIndex !== null ? 'Edit' : 'Add'} Vine</h3>
				<button type="button" class="gm-close" onclick={closeModal}><X size={18} /></button>
			</div>

			<div class="gm-modal-body">
				<div class="admin-field">
					<label class="admin-field-label" for="vine-type">Type</label>
					<select class="admin-input" id="vine-type" bind:value={itemType}>
						<option value="comment">Comment</option>
						<option value="photo">Photo</option>
					</select>
				</div>

				<div class="admin-field">
					<label class="admin-field-label" for="vine-anchor">Anchor</label>
					<div class="anchor-row">
						<select class="admin-input" id="vine-anchor" bind:value={itemAnchor}>
							<option value="">No anchor (top of post)</option>
							{#each availableAnchors as anchor}
								<option value={anchor}>{getAnchorLabel(anchor)}</option>
							{/each}
						</select>
						<button type="button" class="admin-btn-outline" onclick={insertNewAnchor} title="Create new anchor tag">
							<Anchor size={14} />
						</button>
					</div>
				</div>

				{#if itemType === 'comment' || itemType === 'markdown'}
					<div class="admin-field">
						<label class="admin-field-label" for="vine-content">Content (markdown)</label>
						<textarea class="admin-input" id="vine-content" bind:value={itemContent} rows="6" placeholder="Write your annotation..."></textarea>
					</div>
				{:else if itemType === 'photo' || itemType === 'image'}
					<div class="admin-field">
						<label class="admin-field-label" for="vine-url">Image URL</label>
						<input class="admin-input" id="vine-url" bind:value={itemUrl} placeholder="https://cdn.autumnsgrove.com/..." />
					</div>
					{#if itemUrl}
						<img src={itemUrl} alt="Preview" class="gm-image-preview" />
					{/if}
					<div class="admin-field">
						<label class="admin-field-label" for="vine-caption">Caption (optional)</label>
						<input class="admin-input" id="vine-caption" bind:value={itemCaption} placeholder="Photo caption" />
					</div>
				{/if}
			</div>

			<div class="gm-modal-footer">
				<button type="button" class="admin-btn-outline" onclick={closeModal}>Cancel</button>
				<button type="button" class="admin-btn-primary" onclick={save}>
					{editingIndex !== null ? 'Save' : 'Add'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.gutter-manager {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.gm-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.gm-header h3 {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
	}

	.gm-empty {
		padding: 2rem;
		text-align: center;
		color: var(--color-muted);
		font-size: 0.85rem;
	}

	.gm-empty p { margin: 0; }

	.gm-list {
		display: flex;
		flex-direction: column;
	}

	.gm-item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.gm-item:last-child { border-bottom: none; }

	.gm-item-info {
		flex: 1;
		min-width: 0;
	}

	.gm-item-type {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary);
		background: var(--color-surface);
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		margin-right: 0.5rem;
	}

	.gm-item-anchor {
		font-size: 0.72rem;
		color: var(--color-muted);
	}

	.gm-item-preview {
		font-size: 0.82rem;
		color: var(--color-ink);
		margin: 0.25rem 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gm-item-actions {
		display: flex;
		gap: 0.15rem;
		flex-shrink: 0;
	}

	.gm-item-actions button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.3rem;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		border-radius: 3px;
		transition: color var(--transition), background var(--transition);
	}

	.gm-item-actions button:hover { color: var(--color-ink); background: var(--color-surface); }
	.gm-item-actions button.danger:hover { color: oklch(0.55 0.2 25); }
	.gm-item-actions button:disabled { opacity: 0.3; cursor: default; }

	/* Modal */
	.gm-backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: oklch(0.1 0 0 / 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.gm-modal {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 16px 48px oklch(0.1 0 0 / 0.25);
	}

	.gm-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.gm-modal-header h3 { margin: 0; font-size: 1rem; }

	.gm-close {
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		padding: 0.25rem;
	}

	.gm-close:hover { color: var(--color-ink); }

	.gm-modal-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.gm-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--color-border);
	}

	.anchor-row {
		display: flex;
		gap: 0.5rem;
	}

	.anchor-row select { flex: 1; }

	.gm-image-preview {
		max-width: 100%;
		max-height: 200px;
		object-fit: contain;
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}
</style>
