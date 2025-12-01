# Live Document Modes - Technical Specification

> **Status:** Ready for Implementation
> **Estimated Effort:** 6-8 hours across multiple sessions
> **Dependencies:** MarkdownEditor.svelte (completed), Svelte 5 runes

---

## Overview

Transform the markdown editor into a fluid, multi-mode writing experience with three distinct editing modes that work together seamlessly.

---

## Architecture

### State Management

```javascript
// Core state (add to MarkdownEditor.svelte)
let viewMode = $state('split'); // 'split' | 'edit-only' | 'preview-only' | 'live-doc'
let zenPreviewMode = $state(false); // Toggle preview while in Zen mode
```

### Mode Definitions

| Mode | Keyboard | Description |
|------|----------|-------------|
| Split | Default | Side-by-side editor and preview |
| Preview Only | Cmd+Shift+P | Full-width rendered preview |
| Live Document | Cmd+Shift+L | Click-to-edit blocks (Notion-style) |
| Zen | Cmd+Shift+Enter | Existing immersive mode |
| Zen + Preview | P (in Zen) | Preview toggle while in Zen |

---

## Phase 1: Preview Toggle (1-2 hours)

### Files to Modify
- `src/lib/components/admin/MarkdownEditor.svelte`

### Implementation

```svelte
<!-- Add to state declarations (around line 50) -->
let viewMode = $state('split');

<!-- Add keyboard handler (in handleKeydown function) -->
// Cmd+Shift+P: Toggle preview mode
if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
  e.preventDefault();
  viewMode = viewMode === 'preview-only' ? 'split' : 'preview-only';
}

<!-- Modify the editor/preview container -->
<div class="editor-content" class:preview-only={viewMode === 'preview-only'}>
  {#if viewMode !== 'preview-only'}
    <div class="editor-pane">
      <!-- existing textarea -->
    </div>
  {/if}

  <div class="preview-pane" class:full-width={viewMode === 'preview-only'}>
    <!-- existing preview -->
    {#if viewMode === 'preview-only'}
      <button class="edit-mode-btn" onclick={() => viewMode = 'split'}>
        Edit Mode
      </button>
    {/if}
  </div>
</div>
```

### CSS Additions

```css
.editor-content.preview-only .preview-pane {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
}

.edit-mode-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.5rem;
  background: var(--grove-green);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s, opacity 0.2s;
}

.edit-mode-btn:hover {
  transform: scale(1.05);
}
```

### Testing Checklist
- [ ] Cmd+Shift+P toggles between split and preview-only
- [ ] Preview is full-width and centered (max 800px)
- [ ] Edit button appears in bottom-right
- [ ] Click Edit button returns to split view
- [ ] Works with existing Zen mode

---

## Phase 2: Zen Preview Toggle (30 minutes)

### Implementation

```javascript
// Add to handleKeydown, inside zenMode check
if (zenMode && e.key === 'p' && !e.metaKey && !e.ctrlKey) {
  e.preventDefault();
  zenPreviewMode = !zenPreviewMode;
}

// Modify Escape handler
if (e.key === 'Escape') {
  if (zenPreviewMode) {
    zenPreviewMode = false;
  } else {
    zenMode = false;
  }
}
```

### UI Indicator

```svelte
{#if zenMode && zenPreviewMode}
  <div class="zen-mode-indicator">
    Preview Mode (P to edit, Esc to exit Zen)
  </div>
{/if}
```

### Testing Checklist
- [ ] P key toggles preview while in Zen mode
- [ ] Indicator shows current mode
- [ ] Esc exits preview first, then Zen
- [ ] Maintains Zen aesthetic (dark, minimal)

---

## Phase 3: Live Document Mode (3-4 hours)

### Block Parser Utility

Create `src/lib/utils/markdown-blocks.js`:

```javascript
/**
 * Parse markdown into editable blocks
 * Each block represents a discrete editable unit
 */
export function parseMarkdownToBlocks(markdown) {
  const blocks = [];
  let currentBlock = { type: 'paragraph', raw: '', id: generateId() };

  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: 'code',
          lang: codeBlockLang,
          raw: codeBlockContent.join('\n'),
          id: generateId()
        });
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        if (currentBlock.raw.trim()) {
          blocks.push(currentBlock);
        }
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        currentBlock = { type: 'paragraph', raw: '', id: generateId() };
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Heading detection
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock.raw.trim()) {
        blocks.push(currentBlock);
      }
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        raw: line,
        text: headingMatch[2],
        id: generateId()
      });
      currentBlock = { type: 'paragraph', raw: '', id: generateId() };
      continue;
    }

    // List item detection
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      if (currentBlock.type !== 'list') {
        if (currentBlock.raw.trim()) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'list', items: [], raw: '', id: generateId() };
      }
      currentBlock.items.push({
        indent: listMatch[1].length,
        marker: listMatch[2],
        text: listMatch[3]
      });
      currentBlock.raw += line + '\n';
      continue;
    }

    // Blockquote detection
    if (line.startsWith('>')) {
      if (currentBlock.type !== 'blockquote') {
        if (currentBlock.raw.trim()) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'blockquote', raw: '', id: generateId() };
      }
      currentBlock.raw += line + '\n';
      continue;
    }

    // Empty line - end current block
    if (!line.trim()) {
      if (currentBlock.raw.trim()) {
        blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', raw: '', id: generateId() };
      }
      continue;
    }

    // Default: add to current paragraph
    if (currentBlock.type !== 'paragraph') {
      blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', raw: '', id: generateId() };
    }
    currentBlock.raw += (currentBlock.raw ? '\n' : '') + line;
  }

  // Push final block
  if (currentBlock.raw.trim()) {
    blocks.push(currentBlock);
  }

  return blocks;
}

export function blocksToMarkdown(blocks) {
  return blocks.map(block => {
    if (block.type === 'code') {
      return '```' + (block.lang || '') + '\n' + block.raw + '\n```';
    }
    return block.raw;
  }).join('\n\n');
}

function generateId() {
  return 'block-' + Math.random().toString(36).substr(2, 9);
}
```

### Live Document Component

Create inline in MarkdownEditor or as separate component:

```svelte
{#if viewMode === 'live-doc'}
  <div class="live-document">
    {#each blocks as block (block.id)}
      <div
        class="block {block.type}"
        class:editing={editingBlockId === block.id}
        onclick={() => startEditingBlock(block.id)}
        role="button"
        tabindex="0"
      >
        {#if editingBlockId === block.id}
          <textarea
            bind:value={block.raw}
            onblur={() => finishEditingBlock(block)}
            onkeydown={(e) => handleBlockKeydown(e, block)}
            use:autofocus
            class="block-editor"
          ></textarea>
        {:else}
          <div class="block-content">
            {@html renderBlock(block)}
          </div>
          <div class="block-hover-indicator"></div>
        {/if}
      </div>
    {/each}

    <!-- Add new block at end -->
    <div class="add-block" onclick={addNewBlock}>
      <span>+ Add block or type /</span>
    </div>
  </div>
{/if}
```

### Block Editing Logic

```javascript
let blocks = $derived(parseMarkdownToBlocks(content));
let editingBlockId = $state(null);

function startEditingBlock(blockId) {
  editingBlockId = blockId;
}

function finishEditingBlock(block) {
  editingBlockId = null;
  // Update the main content from blocks
  content = blocksToMarkdown(blocks);
}

function handleBlockKeydown(e, block) {
  // Escape to stop editing
  if (e.key === 'Escape') {
    finishEditingBlock(block);
  }

  // Enter in heading creates new paragraph below
  if (e.key === 'Enter' && block.type === 'heading' && !e.shiftKey) {
    e.preventDefault();
    finishEditingBlock(block);
    // Insert new block after current
    const index = blocks.findIndex(b => b.id === block.id);
    blocks.splice(index + 1, 0, {
      type: 'paragraph',
      raw: '',
      id: generateId()
    });
    // Start editing new block
    editingBlockId = blocks[index + 1].id;
  }
}

function renderBlock(block) {
  if (block.type === 'heading') {
    return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
  }
  return marked.parse(block.raw);
}
```

### CSS for Live Document Mode

```css
.live-document {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.block {
  position: relative;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
  cursor: text;
  transition: background 0.15s ease;
}

.block:hover:not(.editing) {
  background: var(--grove-green-subtle, rgba(44, 95, 45, 0.05));
}

.block:hover .block-hover-indicator {
  opacity: 1;
}

.block-hover-indicator {
  position: absolute;
  left: -1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: var(--grove-green);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.block.editing {
  background: var(--grove-green-subtle);
}

.block-editor {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  font-family: inherit;
  font-size: inherit;
  border: 2px solid var(--grove-green);
  border-radius: 4px;
  resize: vertical;
  background: var(--editor-bg);
  color: var(--editor-text);
}

.block-content h1, .block-content h2, .block-content h3 {
  margin: 0;
}

.add-block {
  padding: 1rem;
  margin-top: 1rem;
  color: var(--text-muted);
  cursor: pointer;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  text-align: center;
  transition: border-color 0.2s, color 0.2s;
}

.add-block:hover {
  border-color: var(--grove-green);
  color: var(--grove-green);
}
```

### Testing Checklist
- [ ] Cmd+Shift+L activates Live Document mode
- [ ] Blocks render correctly (headings, paragraphs, code, lists)
- [ ] Click on block enables editing
- [ ] Blur saves changes
- [ ] Changes sync back to main content
- [ ] Escape cancels editing
- [ ] Enter in heading creates new paragraph
- [ ] Slash commands work in blocks
- [ ] Preserves formatting when switching modes

---

## Phase 4: Integration & Polish (1 hour)

### Command Palette Integration

Add to command palette options:

```javascript
const modeCommands = [
  { name: 'Switch to Split View', action: () => viewMode = 'split', shortcut: 'Default' },
  { name: 'Toggle Preview Mode', action: () => viewMode = viewMode === 'preview-only' ? 'split' : 'preview-only', shortcut: '⌘⇧P' },
  { name: 'Live Document Mode', action: () => viewMode = 'live-doc', shortcut: '⌘⇧L' },
  { name: 'Zen Mode', action: () => zenMode = true, shortcut: '⌘⇧↵' },
];
```

### Status Bar Mode Indicator

```svelte
<div class="status-bar-mode">
  <button
    class:active={viewMode === 'split'}
    onclick={() => viewMode = 'split'}
  >Split</button>
  <button
    class:active={viewMode === 'preview-only'}
    onclick={() => viewMode = 'preview-only'}
  >Preview</button>
  <button
    class:active={viewMode === 'live-doc'}
    onclick={() => viewMode = 'live-doc'}
  >Live</button>
  <button
    class:active={zenMode}
    onclick={() => zenMode = true}
  >Zen</button>
</div>
```

### Keyboard Shortcuts Help

Add to help panel or command palette:

```
Mode Switching:
  ⌘⇧P         Toggle Preview
  ⌘⇧L         Live Document Mode
  ⌘⇧↵         Zen Mode
  P (in Zen)  Toggle Preview in Zen
  Esc         Exit current mode
```

---

## Dependencies

### Existing Code to Understand
1. `src/lib/components/admin/MarkdownEditor.svelte` - Main editor component
2. Zen mode implementation (around line 200+)
3. Command palette implementation
4. Status bar implementation

### External Dependencies
- None required (pure Svelte 5 implementation)

---

## Testing Strategy

1. **Unit Tests** for block parser:
   - Heading detection
   - Code block handling
   - List parsing
   - Blockquote handling
   - Edge cases (empty content, single line)

2. **Integration Tests**:
   - Mode switching preserves content
   - Keyboard shortcuts work
   - Block editing syncs correctly
   - Works with existing features (slash commands, campfire, etc.)

3. **Manual Testing**:
   - Complex markdown documents
   - Rapid mode switching
   - Edge cases (cursor position, selection)

---

## Future Enhancements (Out of Scope)

- Drag-and-drop block reordering
- Block type conversion (paragraph → heading)
- Multi-block selection
- Collaborative editing indicators
- Custom block types (callouts, embeds)

---

*Last updated: December 2025*
