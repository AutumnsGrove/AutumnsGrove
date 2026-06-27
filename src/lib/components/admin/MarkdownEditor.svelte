<script lang="ts">
	import { sanitizeMarkdown } from '$lib/utils/sanitize';
	import { marked } from 'marked';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Columns2 from '@lucide/svelte/icons/columns-2';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
	}

	let { value = $bindable(''), onchange }: Props = $props();

	let mode = $state<'write' | 'split' | 'preview'>('write');
	let preview = $derived(sanitizeMarkdown(marked.parse(value || '')));

	let wordCount = $derived(
		value.trim() ? value.trim().split(/\s+/).length : 0
	);

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		onchange?.(value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const target = e.target as HTMLTextAreaElement;
			const start = target.selectionStart;
			const end = target.selectionEnd;
			value = value.substring(0, start) + '\t' + value.substring(end);
			onchange?.(value);
			requestAnimationFrame(() => {
				target.selectionStart = target.selectionEnd = start + 1;
			});
		}

		if (e.metaKey || e.ctrlKey) {
			if (e.key === 'b') {
				e.preventDefault();
				wrapSelection('**');
			} else if (e.key === 'i') {
				e.preventDefault();
				wrapSelection('*');
			}
		}
	}

	function wrapSelection(wrapper: string) {
		const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selected = value.substring(start, end);

		value = value.substring(0, start) + wrapper + selected + wrapper + value.substring(end);
		onchange?.(value);

		requestAnimationFrame(() => {
			textarea.selectionStart = start + wrapper.length;
			textarea.selectionEnd = end + wrapper.length;
			textarea.focus();
		});
	}
</script>

<div class="editor">
	<div class="editor-toolbar">
		<div class="mode-buttons">
			<button class:active={mode === 'write'} onclick={() => mode = 'write'} title="Write">
				<Pencil size={14} /> Write
			</button>
			<button class:active={mode === 'split'} onclick={() => mode = 'split'} title="Split">
				<Columns2 size={14} /> Split
			</button>
			<button class:active={mode === 'preview'} onclick={() => mode = 'preview'} title="Preview">
				<Eye size={14} /> Preview
			</button>
		</div>
		<span class="word-count">{wordCount} words</span>
	</div>

	<div class="editor-body" class:split={mode === 'split'}>
		{#if mode !== 'preview'}
			<textarea
				class="editor-textarea admin-input"
				value={value}
				oninput={handleInput}
				onkeydown={handleKeydown}
				placeholder="Write your post in markdown..."
				spellcheck="true"
			></textarea>
		{/if}
		{#if mode !== 'write'}
			<div class="editor-preview prose">
				{@html preview}
			</div>
		{/if}
	</div>
</div>

<style>
	.editor {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.mode-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.mode-buttons button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.6rem;
		background: none;
		border: none;
		border-radius: var(--radius);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-muted);
		cursor: pointer;
		transition: color var(--transition), background var(--transition);
	}

	.mode-buttons button:hover {
		color: var(--color-ink);
	}

	.mode-buttons button.active {
		color: var(--color-primary);
		background: var(--color-bg);
	}

	.word-count {
		font-size: 0.72rem;
		color: var(--color-muted);
	}

	.editor-body {
		display: flex;
		min-height: 400px;
	}

	.editor-body.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.editor-textarea {
		flex: 1;
		border: none;
		border-radius: 0;
		resize: none;
		min-height: 400px;
		padding: 1rem;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 0.88rem;
		line-height: 1.6;
		tab-size: 4;
	}

	.editor-textarea:focus {
		box-shadow: none;
	}

	.editor-preview {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		border-left: 1px solid var(--color-border);
		background: var(--color-bg);
	}

	@media (max-width: 768px) {
		.editor-body.split {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr;
		}

		.editor-preview {
			border-left: none;
			border-top: 1px solid var(--color-border);
		}
	}
</style>
