<script>
  import { marked } from "marked";
  import { onMount } from "svelte";

  // Props
  let {
    content = $bindable(""),
    onSave = () => {},
    saving = false,
    readonly = false,
  } = $props();

  // Local state
  let textareaRef = $state(null);
  let previewRef = $state(null);
  let showPreview = $state(true);
  let lineNumbers = $state([]);
  let cursorLine = $state(1);
  let cursorCol = $state(1);

  // Computed values
  let wordCount = $derived(
    content.trim() ? content.trim().split(/\s+/).length : 0
  );
  let charCount = $derived(content.length);
  let lineCount = $derived(content.split("\n").length);
  let previewHtml = $derived(content ? marked.parse(content) : "");

  // Extract available anchors from content (headings and custom anchors)
  export let availableAnchors = $derived.by(() => {
    const anchors = [];
    // Extract headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      anchors.push(match[0].trim());
    }
    // Extract custom anchors
    const anchorRegex = /<!--\s*anchor:([\w-]+)\s*-->/g;
    while ((match = anchorRegex.exec(content)) !== null) {
      anchors.push(`anchor:${match[1]}`);
    }
    return anchors;
  });

  // Public function to insert an anchor at cursor position
  export function insertAnchor(name) {
    insertAtCursor(`<!-- anchor:${name} -->\n`);
  }

  // Update line numbers when content changes
  $effect(() => {
    const lines = content.split("\n").length;
    lineNumbers = Array.from({ length: lines }, (_, i) => i + 1);
  });

  // Handle cursor position tracking
  function updateCursorPosition() {
    if (!textareaRef) return;

    const pos = textareaRef.selectionStart;
    const textBefore = content.substring(0, pos);
    const lines = textBefore.split("\n");
    cursorLine = lines.length;
    cursorCol = lines[lines.length - 1].length + 1;
  }

  // Handle tab key for indentation
  function handleKeydown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;

      // Insert 2 spaces
      content = content.substring(0, start) + "  " + content.substring(end);

      // Move cursor
      setTimeout(() => {
        textareaRef.selectionStart = textareaRef.selectionEnd = start + 2;
      }, 0);
    }

    // Cmd/Ctrl + S to save
    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    }

    // Cmd/Ctrl + B for bold
    if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      wrapSelection("**", "**");
    }

    // Cmd/Ctrl + I for italic
    if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      wrapSelection("_", "_");
    }
  }

  // Wrap selected text with markers
  function wrapSelection(before, after) {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);

    content =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setTimeout(() => {
      textareaRef.selectionStart = start + before.length;
      textareaRef.selectionEnd = end + before.length;
      textareaRef.focus();
    }, 0);
  }

  // Insert text at cursor
  function insertAtCursor(text) {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    content = content.substring(0, start) + text + content.substring(start);

    setTimeout(() => {
      textareaRef.selectionStart = textareaRef.selectionEnd =
        start + text.length;
      textareaRef.focus();
    }, 0);
  }

  // Toolbar actions
  function insertHeading(level) {
    const prefix = "#".repeat(level) + " ";
    insertAtCursor(prefix);
  }

  function insertLink() {
    wrapSelection("[", "](url)");
  }

  function insertImage() {
    insertAtCursor("![alt text](image-url)");
  }

  function insertCodeBlock() {
    const start = textareaRef.selectionStart;
    const selectedText = content.substring(
      start,
      textareaRef.selectionEnd
    );
    const codeBlock = "```\n" + (selectedText || "code here") + "\n```";
    content =
      content.substring(0, start) +
      codeBlock +
      content.substring(textareaRef.selectionEnd);
  }

  function insertList() {
    insertAtCursor("- ");
  }

  function insertQuote() {
    insertAtCursor("> ");
  }

  // Sync scroll between editor and preview (optional)
  function handleScroll() {
    if (textareaRef && previewRef && showPreview) {
      const scrollRatio =
        textareaRef.scrollTop /
        (textareaRef.scrollHeight - textareaRef.clientHeight);
      previewRef.scrollTop =
        scrollRatio * (previewRef.scrollHeight - previewRef.clientHeight);
    }
  }

  onMount(() => {
    updateCursorPosition();
  });
</script>

<div class="editor-container">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => insertHeading(1)}
        title="Heading 1"
        disabled={readonly}
      >
        H1
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => insertHeading(2)}
        title="Heading 2"
        disabled={readonly}
      >
        H2
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => insertHeading(3)}
        title="Heading 3"
        disabled={readonly}
      >
        H3
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => wrapSelection("**", "**")}
        title="Bold (Cmd+B)"
        disabled={readonly}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => wrapSelection("_", "_")}
        title="Italic (Cmd+I)"
        disabled={readonly}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => wrapSelection("`", "`")}
        title="Inline Code"
        disabled={readonly}
      >
        {"</>"}
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn"
        onclick={insertLink}
        title="Link"
        disabled={readonly}
      >
        Link
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={insertImage}
        title="Image"
        disabled={readonly}
      >
        Img
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={insertCodeBlock}
        title="Code Block"
        disabled={readonly}
      >
        Code
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn"
        onclick={insertList}
        title="List"
        disabled={readonly}
      >
        List
      </button>
      <button
        type="button"
        class="toolbar-btn"
        onclick={insertQuote}
        title="Quote"
        disabled={readonly}
      >
        Quote
      </button>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-group">
      <button
        type="button"
        class="toolbar-btn toggle-btn"
        class:active={showPreview}
        onclick={() => (showPreview = !showPreview)}
        title="Toggle Preview"
      >
        {showPreview ? "Hide Preview" : "Show Preview"}
      </button>
    </div>
  </div>

  <!-- Editor Area -->
  <div class="editor-area" class:split={showPreview}>
    <!-- Editor Panel -->
    <div class="editor-panel">
      <div class="editor-wrapper">
        <div class="line-numbers" aria-hidden="true">
          {#each lineNumbers as num}
            <span class:current={num === cursorLine}>{num}</span>
          {/each}
        </div>
        <textarea
          bind:this={textareaRef}
          bind:value={content}
          oninput={updateCursorPosition}
          onclick={updateCursorPosition}
          onkeyup={updateCursorPosition}
          onkeydown={handleKeydown}
          onscroll={handleScroll}
          placeholder="Start writing your post..."
          spellcheck="true"
          disabled={readonly}
          class="editor-textarea"
        ></textarea>
      </div>
    </div>

    <!-- Preview Panel -->
    {#if showPreview}
      <div class="preview-panel">
        <div class="preview-header">
          <span class="preview-label">Preview</span>
        </div>
        <div class="preview-content" bind:this={previewRef}>
          {#if previewHtml}
            {@html previewHtml}
          {:else}
            <p class="preview-placeholder">
              Your rendered markdown will appear here...
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">
        Ln {cursorLine}, Col {cursorCol}
      </span>
      <span class="status-divider">|</span>
      <span class="status-item">{lineCount} lines</span>
      <span class="status-divider">|</span>
      <span class="status-item">{wordCount} words</span>
      <span class="status-divider">|</span>
      <span class="status-item">{charCount} chars</span>
    </div>
    <div class="status-right">
      {#if saving}
        <span class="status-saving">Saving...</span>
      {:else}
        <span class="status-item">Markdown</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 500px;
    background: #1e1e1e;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    overflow: hidden;
    font-family: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: #252526;
    border-bottom: 1px solid #3a3a3a;
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    gap: 0.125rem;
  }

  .toolbar-btn {
    padding: 0.35rem 0.6rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #9d9d9d;
    font-family: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: #3a3a3a;
    color: #d4d4d4;
  }

  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .toolbar-btn.toggle-btn {
    background: #2d4a2d;
    color: #8bc48b;
    border-color: #3d5a3d;
  }

  .toolbar-btn.toggle-btn:hover {
    background: #3d5a3d;
    color: #a8dca8;
  }

  .toolbar-btn.toggle-btn.active {
    background: #4a7c4a;
    color: #c8f0c8;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: #3a3a3a;
    margin: 0 0.5rem;
  }

  .toolbar-spacer {
    flex: 1;
  }

  /* Editor Area */
  .editor-area {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .editor-area.split .editor-panel {
    width: 50%;
    border-right: 1px solid #3a3a3a;
  }

  .editor-area:not(.split) .editor-panel {
    width: 100%;
  }

  .editor-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .editor-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* Line Numbers */
  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    background: #1a1a1a;
    border-right: 1px solid #2a2a2a;
    min-width: 3rem;
    text-align: right;
    user-select: none;
    overflow: hidden;
  }

  .line-numbers span {
    padding: 0 0.75rem;
    color: #5a5a5a;
    font-size: 0.85rem;
    line-height: 1.6;
    height: 1.6em;
  }

  .line-numbers span.current {
    color: #8bc48b;
    background: rgba(139, 196, 139, 0.1);
  }

  /* Editor Textarea */
  .editor-textarea {
    flex: 1;
    padding: 1rem;
    background: #1e1e1e;
    border: none;
    color: #d4d4d4;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.6;
    resize: none;
    outline: none;
    overflow-y: auto;
  }

  .editor-textarea::placeholder {
    color: #5a5a5a;
    font-style: italic;
  }

  .editor-textarea:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Preview Panel */
  .preview-panel {
    width: 50%;
    display: flex;
    flex-direction: column;
    background: #252526;
    min-height: 0;
  }

  .preview-header {
    padding: 0.5rem 1rem;
    background: #2d2d2d;
    border-bottom: 1px solid #3a3a3a;
  }

  .preview-label {
    color: #8bc48b;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    color: #d4d4d4;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .preview-placeholder {
    color: #5a5a5a;
    font-style: italic;
  }

  /* Preview content styles */
  .preview-content :global(h1),
  .preview-content :global(h2),
  .preview-content :global(h3),
  .preview-content :global(h4),
  .preview-content :global(h5),
  .preview-content :global(h6) {
    color: #8bc48b;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .preview-content :global(h1) {
    font-size: 1.75rem;
    border-bottom: 1px solid #3a3a3a;
    padding-bottom: 0.5rem;
  }

  .preview-content :global(h2) {
    font-size: 1.5rem;
  }

  .preview-content :global(h3) {
    font-size: 1.25rem;
  }

  .preview-content :global(p) {
    margin: 0.75rem 0;
  }

  .preview-content :global(a) {
    color: #6cb36c;
    text-decoration: underline;
  }

  .preview-content :global(code) {
    background: #1a1a1a;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.9em;
    color: #ce9178;
  }

  .preview-content :global(pre) {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    border: 1px solid #2a2a2a;
  }

  .preview-content :global(pre code) {
    background: none;
    padding: 0;
    color: #d4d4d4;
  }

  .preview-content :global(blockquote) {
    border-left: 3px solid #4a7c4a;
    margin: 1rem 0;
    padding-left: 1rem;
    color: #9d9d9d;
    font-style: italic;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .preview-content :global(li) {
    margin: 0.25rem 0;
  }

  .preview-content :global(hr) {
    border: none;
    border-top: 1px solid #3a3a3a;
    margin: 1.5rem 0;
  }

  .preview-content :global(img) {
    max-width: 100%;
    border-radius: 4px;
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.75rem;
    background: #2d4a2d;
    border-top: 1px solid #3d5a3d;
    font-size: 0.75rem;
    color: #a8dca8;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-item {
    opacity: 0.9;
  }

  .status-divider {
    opacity: 0.4;
  }

  .status-saving {
    color: #f0c674;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .editor-area.split {
      flex-direction: column;
    }

    .editor-area.split .editor-panel {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #3a3a3a;
      height: 50%;
    }

    .editor-area.split .preview-panel {
      width: 100%;
      height: 50%;
    }

    .toolbar {
      padding: 0.5rem;
    }

    .toolbar-btn {
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
    }
  }
</style>
