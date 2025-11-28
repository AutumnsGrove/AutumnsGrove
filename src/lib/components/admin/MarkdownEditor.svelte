<script>
  import { marked } from "marked";
  import { onMount } from "svelte";
  import "$lib/styles/content.css";

  // Props
  let {
    content = $bindable(""),
    onSave = () => {},
    saving = false,
    readonly = false,
    draftKey = null, // Unique key for localStorage draft storage
    onDraftRestored = () => {}, // Callback when draft is restored
    // Optional metadata for full preview mode
    previewTitle = "",
    previewDate = "",
    previewTags = [],
  } = $props();

  // Local state
  let textareaRef = $state(null);
  let previewRef = $state(null);
  let showPreview = $state(true);
  let lineNumbers = $state([]);
  let cursorLine = $state(1);
  let cursorCol = $state(1);

  // Image upload state
  let isDragging = $state(false);
  let isUploading = $state(false);
  let uploadProgress = $state("");
  let uploadError = $state(null);

  // Auto-save draft state
  let lastSavedContent = $state("");
  let draftSaveTimer = $state(null);
  let hasDraft = $state(false);
  let draftRestorePrompt = $state(false);
  let storedDraft = $state(null);
  const AUTO_SAVE_DELAY = 2000; // 2 seconds

  // Full preview mode state
  let showFullPreview = $state(false);

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

  // Drag and drop image upload
  function handleDragEnter(e) {
    e.preventDefault();
    if (readonly) return;

    // Check if dragging files
    if (e.dataTransfer?.types?.includes("Files")) {
      isDragging = true;
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (readonly) return;

    if (e.dataTransfer?.types?.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      isDragging = true;
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    // Only set to false if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      isDragging = false;
    }
  }

  async function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    if (readonly) return;

    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      uploadError = "No image files detected";
      setTimeout(() => (uploadError = null), 3000);
      return;
    }

    // Upload each image
    for (const file of imageFiles) {
      await uploadImage(file);
    }
  }

  async function uploadImage(file) {
    isUploading = true;
    uploadProgress = `Uploading ${file.name}...`;
    uploadError = null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog");

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      // Insert markdown image at cursor
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const imageMarkdown = `![${altText}](${result.url})\n`;
      insertAtCursor(imageMarkdown);

      uploadProgress = "";
    } catch (err) {
      uploadError = err.message;
      setTimeout(() => (uploadError = null), 5000);
    } finally {
      isUploading = false;
      uploadProgress = "";
    }
  }

  // Handle paste for images
  function handlePaste(e) {
    if (readonly) return;

    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        // Generate a filename for pasted images
        const timestamp = Date.now();
        const extension = file.type.split("/")[1] || "png";
        const renamedFile = new File([file], `pasted-${timestamp}.${extension}`, {
          type: file.type,
        });
        uploadImage(renamedFile);
      }
    }
  }

  // Auto-save draft to localStorage
  $effect(() => {
    if (!draftKey || readonly) return;

    // Clear previous timer
    if (draftSaveTimer) {
      clearTimeout(draftSaveTimer);
    }

    // Don't save if content hasn't changed from last saved version
    if (content === lastSavedContent) return;

    // Schedule a draft save
    draftSaveTimer = setTimeout(() => {
      saveDraft();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (draftSaveTimer) {
        clearTimeout(draftSaveTimer);
      }
    };
  });

  function saveDraft() {
    if (!draftKey || readonly) return;

    try {
      const draft = {
        content,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`draft:${draftKey}`, JSON.stringify(draft));
      lastSavedContent = content;
      hasDraft = true;
    } catch (e) {
      console.warn("Failed to save draft:", e);
    }
  }

  function loadDraft() {
    if (!draftKey) return null;

    try {
      const stored = localStorage.getItem(`draft:${draftKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
    return null;
  }

  export function clearDraft() {
    if (!draftKey) return;

    try {
      localStorage.removeItem(`draft:${draftKey}`);
      hasDraft = false;
      storedDraft = null;
      draftRestorePrompt = false;
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  }

  export function getDraftStatus() {
    return { hasDraft, storedDraft };
  }

  function restoreDraft() {
    if (storedDraft) {
      content = storedDraft.content;
      lastSavedContent = storedDraft.content;
      onDraftRestored(storedDraft);
    }
    draftRestorePrompt = false;
  }

  function discardDraft() {
    clearDraft();
    lastSavedContent = content;
  }

  onMount(() => {
    updateCursorPosition();

    // Check for existing draft on mount
    if (draftKey) {
      const draft = loadDraft();
      if (draft && draft.content !== content) {
        storedDraft = draft;
        draftRestorePrompt = true;
      } else {
        lastSavedContent = content;
      }
    }
  });
</script>

<div
  class="editor-container"
  class:dragging={isDragging}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <!-- Drag overlay -->
  {#if isDragging}
    <div class="drag-overlay">
      <div class="drag-overlay-content">
        <span class="drag-icon">+</span>
        <span class="drag-text">Drop image to upload</span>
      </div>
    </div>
  {/if}

  <!-- Upload status -->
  {#if isUploading || uploadError}
    <div class="upload-status" class:error={uploadError}>
      {#if isUploading}
        <span class="upload-spinner"></span>
        <span>{uploadProgress}</span>
      {:else if uploadError}
        <span class="upload-error-icon">!</span>
        <span>{uploadError}</span>
      {/if}
    </div>
  {/if}

  <!-- Draft restore prompt -->
  {#if draftRestorePrompt && storedDraft}
    <div class="draft-prompt">
      <div class="draft-prompt-content">
        <span class="draft-icon">~</span>
        <div class="draft-message">
          <strong>Unsaved draft found</strong>
          <span class="draft-time">
            Saved {new Date(storedDraft.savedAt).toLocaleString()}
          </span>
        </div>
        <div class="draft-actions">
          <button type="button" class="draft-btn restore" onclick={restoreDraft}>
            Restore
          </button>
          <button type="button" class="draft-btn discard" onclick={discardDraft}>
            Discard
          </button>
        </div>
      </div>
    </div>
  {/if}

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
      <button
        type="button"
        class="toolbar-btn full-preview-btn"
        onclick={() => (showFullPreview = true)}
        title="Open Full Preview (site styling)"
      >
        Full Preview
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
          onpaste={handlePaste}
          placeholder="Start writing your post... (Drag & drop or paste images)"
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
      {:else if draftKey && content !== lastSavedContent}
        <span class="status-draft">Draft saved</span>
      {:else}
        <span class="status-item">Markdown</span>
      {/if}
    </div>
  </div>
</div>

<!-- Full Preview Modal -->
{#if showFullPreview}
  <div class="full-preview-modal" role="dialog" aria-modal="true">
    <div class="full-preview-backdrop" onclick={() => (showFullPreview = false)}></div>
    <div class="full-preview-container">
      <header class="full-preview-header">
        <h2>Full Preview</h2>
        <div class="full-preview-actions">
          <button
            type="button"
            class="full-preview-close"
            onclick={() => (showFullPreview = false)}
          >
            Close
          </button>
        </div>
      </header>
      <div class="full-preview-scroll">
        <article class="full-preview-article">
          <!-- Post Header -->
          {#if previewTitle || previewDate || previewTags.length > 0}
            <header class="content-header">
              {#if previewTitle}
                <h1>{previewTitle}</h1>
              {/if}
              {#if previewDate || previewTags.length > 0}
                <div class="post-meta">
                  {#if previewDate}
                    <time datetime={previewDate}>
                      {new Date(previewDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  {/if}
                  {#if previewTags.length > 0}
                    <div class="tags">
                      {#each previewTags as tag}
                        <span class="tag">{tag}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </header>
          {/if}

          <!-- Rendered Content -->
          <div class="content-body">
            {#if previewHtml}
              {@html previewHtml}
            {:else}
              <p class="preview-placeholder">Start writing to see your content here...</p>
            {/if}
          </div>
        </article>
      </div>
    </div>
  </div>
{/if}

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
    position: relative;
  }

  .editor-container.dragging {
    border-color: #8bc48b;
    box-shadow: 0 0 0 2px rgba(139, 196, 139, 0.3);
  }

  /* Drag overlay */
  .drag-overlay {
    position: absolute;
    inset: 0;
    background: rgba(30, 30, 30, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border: 3px dashed #8bc48b;
    border-radius: 8px;
  }

  .drag-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #8bc48b;
  }

  .drag-icon {
    font-size: 3rem;
    font-weight: 300;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #8bc48b;
    border-radius: 50%;
  }

  .drag-text {
    font-size: 1.1rem;
    font-weight: 500;
  }

  /* Upload status */
  .upload-status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(45, 74, 45, 0.95);
    border: 1px solid #4a7c4a;
    border-radius: 6px;
    color: #a8dca8;
    font-size: 0.9rem;
    z-index: 99;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .upload-status.error {
    background: rgba(80, 40, 40, 0.95);
    border-color: #a85050;
    color: #ffb0b0;
  }

  .upload-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #4a7c4a;
    border-top-color: #a8dca8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .upload-error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #a85050;
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: bold;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Draft prompt */
  .draft-prompt {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(45, 60, 45, 0.98);
    border-bottom: 1px solid #4a7c4a;
    z-index: 98;
    padding: 0.5rem 0.75rem;
  }

  .draft-prompt-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }

  .draft-icon {
    font-size: 1.25rem;
    color: #8bc48b;
    font-weight: bold;
  }

  .draft-message {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    color: #d4d4d4;
    flex: 1;
  }

  .draft-message strong {
    color: #a8dca8;
  }

  .draft-time {
    font-size: 0.75rem;
    color: #7a9a7a;
  }

  .draft-actions {
    display: flex;
    gap: 0.5rem;
  }

  .draft-btn {
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .draft-btn.restore {
    background: #4a7c4a;
    border: 1px solid #5a9a5a;
    color: #c8f0c8;
  }

  .draft-btn.restore:hover {
    background: #5a9a5a;
  }

  .draft-btn.discard {
    background: transparent;
    border: 1px solid #5a5a5a;
    color: #9d9d9d;
  }

  .draft-btn.discard:hover {
    background: #3a3a3a;
    color: #d4d4d4;
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

  .status-draft {
    color: #7a9a7a;
    font-style: italic;
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

  /* Full Preview Button */
  .full-preview-btn {
    background: #2d3a4d;
    color: #7ab3ff;
    border-color: #3d4a5d;
  }

  .full-preview-btn:hover {
    background: #3d4a5d;
    color: #9ac5ff;
  }

  /* Full Preview Modal */
  .full-preview-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .full-preview-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
  }

  .full-preview-container {
    position: relative;
    width: 90%;
    max-width: 900px;
    height: 90vh;
    background: var(--color-bg, #ffffff);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  :global(.dark) .full-preview-container {
    background: var(--color-bg-dark, #0d1117);
  }

  .full-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: var(--color-bg-secondary, #f5f5f5);
    border-bottom: 1px solid var(--color-border, #e0e0e0);
    flex-shrink: 0;
  }

  :global(.dark) .full-preview-header {
    background: var(--color-bg-secondary-dark, #1a1a1a);
    border-color: var(--color-border-dark, #333);
  }

  .full-preview-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text, #333);
  }

  :global(.dark) .full-preview-header h2 {
    color: var(--color-text-dark, #e0e0e0);
  }

  .full-preview-close {
    padding: 0.5rem 1rem;
    background: var(--color-primary, #2c5f2d);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .full-preview-close:hover {
    background: var(--color-primary-hover, #4a9d4f);
  }

  .full-preview-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  .full-preview-article {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Post meta styling in full preview */
  .full-preview-article .post-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .full-preview-article time {
    color: #888;
    font-size: 1rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .full-preview-article time {
    color: var(--color-text-subtle-dark, #666);
  }

  .full-preview-article .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .full-preview-article .tag {
    padding: 0.25rem 0.75rem;
    background: var(--tag-bg, #2c5f2d);
    color: white;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
</style>
