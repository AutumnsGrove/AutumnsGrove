<script lang="ts">
	import { tick } from 'svelte';
	import { sanitizeMarkdown } from '$lib/utils/sanitize';
	import { processAnchorTags } from '$lib/utils/content';
	import { marked } from 'marked';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Columns2 from '@lucide/svelte/icons/columns-2';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
		onSave?: () => void;
	}

	let { value = $bindable(''), onchange, onSave }: Props = $props();

	let mode = $state<'write' | 'split' | 'preview'>('write');
	let textareaRef = $state<HTMLTextAreaElement>();

	// Process directives for visible preview
	function renderPreview(md: string): string {
		if (!md) return '';
		let html = sanitizeMarkdown(marked.parse(md));
		// Convert anchor directives to visible markers in preview
		html = html.replace(
			/<p>\s*::anchor\[([\w-]+)\]::\s*<\/p>/g,
			(_m, name) => `<div class="anchor-preview-marker"><span class="anchor-icon">⚓</span> anchor:${name}</div>`
		);
		html = html.replace(
			/::anchor\[([\w-]+)\]::/g,
			(_m, name) => `<span class="anchor-preview-inline"><span class="anchor-icon">⚓</span> ${name}</span>`
		);
		html = processAnchorTags(html);
		return html;
	}

	let preview = $derived(renderPreview(value || ''));

	let wordCount = $derived(
		value.trim() ? value.trim().split(/\s+/).length : 0
	);

	// :: Directive autocomplete
	let showDirectiveMenu = $state(false);
	let directiveQuery = $state('');
	let directiveTriggerPos = $state(0);
	let menuPos = $state({ top: 0, left: 0 });
	let selectedDirectiveIndex = $state(0);

	const directives = [
		{ name: 'anchor', syntax: '::anchor[name]::', description: 'Vine anchor point' },
		{ name: 'suppress', syntax: '::suppress::', description: 'Hide heading from TOC' },
	];

	let filteredDirectives = $derived(
		directives.filter(d => d.name.toLowerCase().includes(directiveQuery.toLowerCase()))
	);

	function checkDirectiveTrigger() {
		if (!textareaRef) return;
		const pos = textareaRef.selectionStart;
		const textBefore = value.substring(0, pos);

		const lastTrigger = textBefore.lastIndexOf('::');
		if (lastTrigger === -1) { showDirectiveMenu = false; return; }

		const afterTrigger = textBefore.substring(lastTrigger + 2);

		// If there's a closing :: already, don't show menu
		if (afterTrigger.includes('::')) { showDirectiveMenu = false; return; }
		// Only allow word characters in the query
		if (afterTrigger && !/^[\w-]*$/.test(afterTrigger)) { showDirectiveMenu = false; return; }

		directiveTriggerPos = lastTrigger;
		directiveQuery = afterTrigger;
		selectedDirectiveIndex = 0;

		// Position the menu near the cursor
		const lineHeight = 24;
		const lines = textBefore.split('\n');
		const currentLine = lines.length;
		const rect = textareaRef.getBoundingClientRect();
		const editorRect = textareaRef.closest('.editor')?.getBoundingClientRect() || rect;

		menuPos = {
			top: rect.top - editorRect.top + (currentLine * lineHeight) - textareaRef.scrollTop + 4,
			left: 16,
		};

		showDirectiveMenu = true;
	}

	async function selectDirective(directive: typeof directives[0]) {
		if (!textareaRef) return;

		const pos = textareaRef.selectionStart;
		const before = value.substring(0, directiveTriggerPos);
		const after = value.substring(pos);

		if (directive.name === 'anchor') {
			const name = prompt('Anchor name (e.g., my-note):');
			if (!name) { showDirectiveMenu = false; return; }
			const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
			value = before + `::anchor[${safeName}]::\n` + after;
			onchange?.(value);
		} else {
			value = before + directive.syntax + after;
			onchange?.(value);
		}

		showDirectiveMenu = false;
		await tick();
		textareaRef.focus();
	}

	// Extract available anchors for GutterManager
	export function getAvailableAnchors(): string[] {
		const anchors: string[] = [];
		const headingRegex = /^(#{1,6})\s+(.+)$/gm;
		let match;
		const content = value || '';
		while ((match = headingRegex.exec(content)) !== null) {
			anchors.push(match[0].trim());
		}
		const anchorRegex = /::anchor\[([\w-]+)\]::/g;
		while ((match = anchorRegex.exec(content)) !== null) {
			anchors.push(`anchor:${match[1]}`);
		}
		const commentRegex = /<!--\s*anchor:([\w-]+)\s*-->/g;
		while ((match = commentRegex.exec(content)) !== null) {
			anchors.push(`anchor:${match[1]}`);
		}
		return anchors;
	}

	export function insertAnchor(name: string) {
		insertAtCursor(`::anchor[${name}]::\n`);
	}

	function insertAtCursor(text: string) {
		if (!textareaRef) return;
		const start = textareaRef.selectionStart;
		value = value.substring(0, start) + text + value.substring(start);
		onchange?.(value);
		requestAnimationFrame(() => {
			if (textareaRef) {
				textareaRef.selectionStart = textareaRef.selectionEnd = start + text.length;
				textareaRef.focus();
			}
		});
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;
		onchange?.(value);
		checkDirectiveTrigger();
	}

	function handleKeydown(e: KeyboardEvent) {
		// Directive menu navigation
		if (showDirectiveMenu && filteredDirectives.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedDirectiveIndex = (selectedDirectiveIndex + 1) % filteredDirectives.length;
				return;
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedDirectiveIndex = (selectedDirectiveIndex - 1 + filteredDirectives.length) % filteredDirectives.length;
				return;
			}
			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
				selectDirective(filteredDirectives[selectedDirectiveIndex]);
				return;
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				showDirectiveMenu = false;
				return;
			}
		}

		if (e.key === 'Tab' && textareaRef) {
			e.preventDefault();
			const start = textareaRef.selectionStart;
			const end = textareaRef.selectionEnd;
			value = value.substring(0, start) + '\t' + value.substring(end);
			onchange?.(value);
			requestAnimationFrame(() => {
				if (textareaRef) {
					textareaRef.selectionStart = textareaRef.selectionEnd = start + 1;
				}
			});
		}

		if (e.metaKey || e.ctrlKey) {
			if (e.key === 's') {
				e.preventDefault();
				onSave?.();
			} else if (e.key === 'b') {
				e.preventDefault();
				wrapSelection('**');
			} else if (e.key === 'i') {
				e.preventDefault();
				wrapSelection('*');
			}
		}
	}

	function handleClick() {
		if (showDirectiveMenu) checkDirectiveTrigger();
	}

	function wrapSelection(wrapper: string) {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selected = value.substring(start, end);

		value = value.substring(0, start) + wrapper + selected + wrapper + value.substring(end);
		onchange?.(value);

		requestAnimationFrame(() => {
			if (textareaRef) {
				textareaRef.selectionStart = start + wrapper.length;
				textareaRef.selectionEnd = end + wrapper.length;
				textareaRef.focus();
			}
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
			<div class="textarea-wrapper">
				<textarea
					class="editor-textarea admin-input"
					bind:this={textareaRef}
					value={value}
					oninput={handleInput}
					onkeydown={handleKeydown}
					onclick={handleClick}
					placeholder="Write your post in markdown... Type :: for directives"
					spellcheck="true"
				></textarea>

				<!-- :: Directive autocomplete -->
				{#if showDirectiveMenu && filteredDirectives.length > 0}
					<div class="directive-menu" style="top: {menuPos.top}px; left: {menuPos.left}px">
						{#each filteredDirectives as dir, i (dir.name)}
							<button
								type="button"
								class="directive-option"
								class:selected={i === selectedDirectiveIndex}
								onclick={() => selectDirective(dir)}
							>
								<span class="directive-name">::{dir.name}</span>
								<span class="directive-desc">{dir.description}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
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

	.mode-buttons button:hover { color: var(--color-ink); }
	.mode-buttons button.active { color: var(--color-primary); background: var(--color-bg); }

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

	.textarea-wrapper {
		position: relative;
		flex: 1;
		display: flex;
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

	.editor-textarea:focus { box-shadow: none; }

	.editor-preview {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		border-left: 1px solid var(--color-border);
		background: var(--color-bg);
	}

	/* Anchor markers in preview */
	.editor-preview :global(.anchor-preview-marker) {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		margin: 0.75rem 0;
		background: var(--color-surface);
		border: 1px dashed var(--color-primary);
		border-radius: var(--radius);
		font-size: 0.78rem;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: var(--color-primary);
	}

	.editor-preview :global(.anchor-preview-inline) {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1rem 0.5rem;
		background: var(--color-surface);
		border: 1px dashed var(--color-primary);
		border-radius: 3px;
		font-size: 0.72rem;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: var(--color-primary);
	}

	.editor-preview :global(.anchor-icon) {
		font-size: 0.75rem;
	}

	/* :: Directive autocomplete menu */
	.directive-menu {
		position: absolute;
		z-index: 50;
		min-width: 240px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 8px 24px oklch(0.1 0 0 / 0.15);
		overflow: hidden;
	}

	.directive-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.55rem 0.75rem;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-ink);
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		font-size: 0.85rem;
		transition: background var(--transition);
	}

	.directive-option:last-child { border-bottom: none; }
	.directive-option:hover, .directive-option.selected { background: var(--color-surface); }

	.directive-name {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-weight: 600;
		color: var(--color-primary);
		font-size: 0.82rem;
	}

	.directive-desc {
		font-size: 0.75rem;
		color: var(--color-muted);
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
