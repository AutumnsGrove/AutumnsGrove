<script>
  import { goto } from "$app/navigation";
  import MarkdownEditor from "$lib/components/admin/MarkdownEditor.svelte";
  import GutterManager from "$lib/components/admin/GutterManager.svelte";

  let { data } = $props();

  // Form state - initialized from loaded data
  let title = $state(data.post.title || "");
  let slug = $state(data.post.slug || "");
  let date = $state(data.post.date || new Date().toISOString().split("T")[0]);
  let description = $state(data.post.description || "");
  let tagsInput = $state(
    Array.isArray(data.post.tags) ? data.post.tags.join(", ") : ""
  );
  let content = $state(data.post.markdown_content || "");
  let gutterItems = $state(data.post.gutter_content ? JSON.parse(data.post.gutter_content) : []);

  // Editor reference for anchor insertion
  let editorRef = $state(null);

  // UI state
  let saving = $state(false);
  let error = $state(null);
  let success = $state(null);
  let hasUnsavedChanges = $state(false);
  let showGutter = $state(true);

  // Track changes
  $effect(() => {
    // Simple dirty check - could be more sophisticated
    const hasChanges =
      title !== data.post.title ||
      description !== data.post.description ||
      content !== data.post.markdown_content;
    hasUnsavedChanges = hasChanges;
  });

  // Parse tags from comma-separated input
  function parseTags(input) {
    return input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  async function handleSave() {
    // Validation
    if (!title.trim()) {
      error = "Title is required";
      return;
    }
    if (!content.trim()) {
      error = "Content is required";
      return;
    }

    error = null;
    success = null;
    saving = true;

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          date,
          description: description.trim(),
          tags: parseTags(tagsInput),
          markdown_content: content,
          gutter_content: JSON.stringify(gutterItems),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update post");
      }

      // Clear draft on successful save
      editorRef?.clearDraft();

      success = "Post saved successfully!";
      hasUnsavedChanges = false;

      // Clear success message after a moment
      setTimeout(() => {
        success = null;
      }, 3000);
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    error = null;
    saving = true;

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete post");
      }

      // Redirect to blog admin
      goto("/admin/blog");
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  // Warn about unsaved changes
  function handleBeforeUnload(e) {
    if (hasUnsavedChanges) {
      e.preventDefault();
      return (e.returnValue = "You have unsaved changes. Are you sure you want to leave?");
    }
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="edit-post-page">
  <header class="page-header">
    <div class="header-content">
      <a href="/admin/blog" class="back-link">&larr; Back to Posts</a>
      <div class="title-row">
        <h1>Edit Post</h1>
        {#if data.source === "filesystem"}
          <span class="source-badge filesystem">From UserContent</span>
        {:else}
          <span class="source-badge d1">From Database</span>
        {/if}
        {#if hasUnsavedChanges}
          <span class="unsaved-badge">Unsaved changes</span>
        {/if}
      </div>
    </div>
    <div class="header-actions">
      <button
        class="delete-btn"
        onclick={handleDelete}
        disabled={saving}
        title="Delete this post"
      >
        Delete
      </button>
      <a
        href="/blog/{slug}"
        target="_blank"
        class="view-btn"
      >
        View Live
      </a>
      <button
        class="save-btn"
        onclick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </header>

  {#if error}
    <div class="error-banner">
      <span class="error-icon">!</span>
      <span>{error}</span>
      <button class="error-dismiss" onclick={() => (error = null)}>&times;</button>
    </div>
  {/if}

  {#if success}
    <div class="success-banner">
      <span class="success-icon">✓</span>
      <span>{success}</span>
    </div>
  {/if}

  <div class="editor-layout">
    <!-- Metadata Panel -->
    <aside class="metadata-panel">
      <h2 class="panel-title">Post Details</h2>

      <div class="form-group">
        <label for="title">Title</label>
        <input
          type="text"
          id="title"
          bind:value={title}
          placeholder="Your Post Title"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="slug">Slug</label>
        <div class="slug-display">
          <span class="slug-prefix">/blog/</span>
          <span class="slug-value">{slug}</span>
        </div>
        <span class="form-hint">Slug cannot be changed after creation</span>
      </div>

      <div class="form-group">
        <label for="date">Date</label>
        <input
          type="date"
          id="date"
          bind:value={date}
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="description">
          Description
          <span class="char-count" class:warning={description.length > 160} class:good={description.length >= 120 && description.length <= 160}>
            {description.length}/160
          </span>
        </label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="A brief summary of your post (120-160 chars for SEO)..."
          rows="3"
          class="form-input form-textarea"
          class:char-warning={description.length > 160}
        ></textarea>
        {#if description.length > 160}
          <span class="form-warning">Description exceeds recommended SEO length</span>
        {:else if description.length > 0 && description.length < 120}
          <span class="form-hint">Add {120 - description.length} more chars for optimal SEO</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="tags">Tags</label>
        <input
          type="text"
          id="tags"
          bind:value={tagsInput}
          placeholder="tag1, tag2, tag3"
          class="form-input"
        />
        <span class="form-hint">Separate tags with commas</span>
      </div>

      {#if tagsInput}
        <div class="tags-preview">
          {#each parseTags(tagsInput) as tag}
            <span class="tag-preview">{tag}</span>
          {/each}
        </div>
      {/if}

      <div class="metadata-info">
        {#if data.post.last_synced}
          <p class="info-item">
            <span class="info-label">Last synced:</span>
            <span class="info-value">
              {new Date(data.post.last_synced).toLocaleString()}
            </span>
          </p>
        {/if}
        {#if data.post.updated_at}
          <p class="info-item">
            <span class="info-label">Last updated:</span>
            <span class="info-value">
              {new Date(data.post.updated_at).toLocaleString()}
            </span>
          </p>
        {/if}
      </div>
    </aside>

    <!-- Editor Panel -->
    <main class="editor-main">
      <div class="editor-with-gutter">
        <div class="editor-section">
          <MarkdownEditor
            bind:this={editorRef}
            bind:content
            {saving}
            onSave={handleSave}
            draftKey={`edit-${slug}`}
            previewTitle={title}
            previewDate={date}
            previewTags={parseTags(tagsInput)}
          />
        </div>
        {#if showGutter}
          <aside class="gutter-section">
            <GutterManager
              bind:gutterItems
              availableAnchors={editorRef?.availableAnchors || []}
              onInsertAnchor={(name) => editorRef?.insertAnchor(name)}
            />
          </aside>
        {/if}
      </div>
      <button
        class="toggle-gutter-btn"
        onclick={() => (showGutter = !showGutter)}
        title={showGutter ? "Hide gutter panel" : "Show gutter panel"}
      >
        {showGutter ? "Hide Gutter ◀" : "▶ Gutter Content"}
      </button>
    </main>
  </div>
</div>

<style>
  .edit-post-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 8rem);
    min-height: 600px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .back-link {
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  :global(.dark) .back-link {
    color: var(--color-text-subtle-dark);
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  :global(.dark) .back-link:hover {
    color: var(--color-primary-light);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .page-header h1 {
    color: var(--color-text-dark);
  }

  .source-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .source-badge.filesystem {
    background: #fff5b1;
    color: #735c0f;
  }

  :global(.dark) .source-badge.filesystem {
    background: rgba(255, 245, 177, 0.2);
    color: #f0c674;
  }

  .source-badge.d1 {
    background: #dcffe4;
    color: #22863a;
  }

  :global(.dark) .source-badge.d1 {
    background: rgba(40, 167, 69, 0.2);
    color: #7ee787;
  }

  .unsaved-badge {
    padding: 0.2rem 0.6rem;
    background: #ffeef0;
    color: #cf222e;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  :global(.dark) .unsaved-badge {
    background: rgba(248, 81, 73, 0.15);
    color: #ff7b72;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .save-btn,
  .view-btn,
  .delete-btn {
    padding: 0.6rem 1.25rem;
    border-radius: var(--border-radius-button);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, opacity 0.2s;
    text-decoration: none;
    border: none;
  }

  .save-btn {
    background: var(--color-primary);
    color: white;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .view-btn {
    background: var(--color-bg-secondary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  :global(.dark) .view-btn {
    background: var(--color-bg-secondary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .view-btn:hover {
    background: var(--color-border);
  }

  :global(.dark) .view-btn:hover {
    background: var(--color-border-dark);
  }

  .delete-btn {
    background: transparent;
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .delete-btn:hover:not(:disabled) {
    background: var(--color-danger);
    color: white;
  }

  .delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Error & Success Banners */
  .error-banner,
  .success-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-button);
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .error-banner {
    background: #ffeef0;
    border: 1px solid #f85149;
    color: #cf222e;
  }

  :global(.dark) .error-banner {
    background: rgba(248, 81, 73, 0.15);
    border-color: #f85149;
    color: #ff7b72;
  }

  .success-banner {
    background: #dcffe4;
    border: 1px solid #28a745;
    color: #22863a;
  }

  :global(.dark) .success-banner {
    background: rgba(40, 167, 69, 0.15);
    border-color: #238636;
    color: #7ee787;
  }

  .error-icon,
  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .error-icon {
    background: #cf222e;
    color: white;
  }

  :global(.dark) .error-icon {
    background: #f85149;
  }

  .success-icon {
    background: #28a745;
    color: white;
  }

  :global(.dark) .success-icon {
    background: #238636;
  }

  .error-dismiss {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.7;
  }

  .error-dismiss:hover {
    opacity: 1;
  }

  /* Editor Layout */
  .editor-layout {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
  }

  /* Metadata Panel */
  .metadata-panel {
    width: 280px;
    flex-shrink: 0;
    background: var(--mobile-menu-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    padding: 1.25rem;
    overflow-y: auto;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .metadata-panel {
    background: var(--color-bg-tertiary-dark);
    border-color: var(--color-border-dark);
  }

  .panel-title {
    margin: 0 0 1.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .panel-title {
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .form-group label {
    color: var(--color-text-muted-dark);
  }

  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    background: var(--color-bg-secondary);
    color: var(--color-text);
    transition: border-color 0.2s, background-color 0.3s, color 0.3s;
  }

  :global(.dark) .form-input {
    background: var(--color-bg-secondary-dark);
    border-color: var(--color-border-dark);
    color: var(--color-text-dark);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  :global(.dark) .form-input:focus {
    border-color: var(--color-primary-light);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .slug-display {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    transition: background-color 0.3s, border-color 0.3s;
  }

  :global(.dark) .slug-display {
    background: var(--color-bg-secondary-dark);
    border-color: var(--color-border-dark);
  }

  .slug-prefix {
    color: var(--color-text-subtle);
    font-size: 0.85rem;
    transition: color 0.3s;
  }

  :global(.dark) .slug-prefix {
    color: var(--color-text-subtle-dark);
  }

  .slug-value {
    color: var(--color-text);
    font-family: monospace;
    font-size: 0.85rem;
    transition: color 0.3s;
  }

  :global(.dark) .slug-value {
    color: var(--color-text-dark);
  }

  .form-hint {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    transition: color 0.3s ease;
  }

  :global(.dark) .form-hint {
    color: var(--color-text-subtle-dark);
  }

  .form-warning {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: #e07030;
    transition: color 0.3s ease;
  }

  .char-count {
    font-size: 0.75rem;
    font-weight: normal;
    color: var(--color-text-subtle);
    margin-left: 0.5rem;
  }

  .char-count.good {
    color: #5cb85f;
  }

  .char-count.warning {
    color: #e07030;
  }

  .form-input.char-warning {
    border-color: #e07030;
  }

  .tags-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: -0.5rem;
  }

  .tag-preview {
    padding: 0.2rem 0.6rem;
    background: var(--tag-bg);
    color: white;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .metadata-info {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    transition: border-color 0.3s;
  }

  :global(.dark) .metadata-info {
    border-color: var(--color-border-dark);
  }

  .info-item {
    margin: 0.5rem 0;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .info-label {
    color: var(--color-text-subtle);
    transition: color 0.3s;
  }

  :global(.dark) .info-label {
    color: var(--color-text-subtle-dark);
  }

  .info-value {
    color: var(--color-text-muted);
    font-family: monospace;
    font-size: 0.75rem;
    transition: color 0.3s;
  }

  :global(.dark) .info-value {
    color: var(--color-text-muted-dark);
  }

  /* Editor Main */
  .editor-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .editor-with-gutter {
    display: flex;
    gap: 1rem;
    flex: 1;
    min-height: 0;
  }

  .editor-section {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .gutter-section {
    width: 300px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .toggle-gutter-btn {
    margin-top: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: #252526;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #8bc48b;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
    align-self: flex-end;
  }

  .toggle-gutter-btn:hover {
    background: #3a3a3a;
    color: #a8dca8;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .gutter-section {
      width: 250px;
    }
  }

  @media (max-width: 900px) {
    .editor-layout {
      flex-direction: column;
    }

    .metadata-panel {
      width: 100%;
      max-height: none;
    }

    .edit-post-page {
      height: auto;
      min-height: auto;
    }

    .editor-main {
      min-height: 500px;
    }

    .editor-with-gutter {
      flex-direction: column;
    }

    .gutter-section {
      width: 100%;
      max-height: 300px;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
