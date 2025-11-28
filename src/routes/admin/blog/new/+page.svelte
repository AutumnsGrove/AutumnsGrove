<script>
  import { goto } from "$app/navigation";
  import MarkdownEditor from "$lib/components/admin/MarkdownEditor.svelte";
  import GutterManager from "$lib/components/admin/GutterManager.svelte";

  // Form state
  let title = $state("");
  let slug = $state("");
  let date = $state(new Date().toISOString().split("T")[0]);
  let description = $state("");
  let tagsInput = $state("");
  let content = $state("");
  let gutterItems = $state([]);

  // Editor reference for anchor insertion
  let editorRef = $state(null);

  // UI state
  let saving = $state(false);
  let error = $state(null);
  let slugManuallyEdited = $state(false);
  let showGutter = $state(false);

  // Auto-generate slug from title
  $effect(() => {
    if (!slugManuallyEdited && title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }
  });

  function handleSlugInput() {
    slugManuallyEdited = true;
  }

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
    if (!slug.trim()) {
      error = "Slug is required";
      return;
    }
    if (!content.trim()) {
      error = "Content is required";
      return;
    }

    error = null;
    saving = true;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          date,
          description: description.trim(),
          tags: parseTags(tagsInput),
          markdown_content: content,
          gutter_content: JSON.stringify(gutterItems),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create post");
      }

      // Redirect to the edit page or blog admin
      goto(`/admin/blog/edit/${result.slug}`);
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }
</script>

<div class="new-post-page">
  <header class="page-header">
    <div class="header-content">
      <a href="/admin/blog" class="back-link">&larr; Back to Posts</a>
      <h1>New Post</h1>
    </div>
    <button
      class="save-btn"
      onclick={handleSave}
      disabled={saving}
    >
      {saving ? "Saving..." : "Save Post"}
    </button>
  </header>

  {#if error}
    <div class="error-banner">
      <span class="error-icon">!</span>
      <span>{error}</span>
      <button class="error-dismiss" onclick={() => (error = null)}>&times;</button>
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
        <div class="slug-input-wrapper">
          <span class="slug-prefix">/blog/</span>
          <input
            type="text"
            id="slug"
            bind:value={slug}
            oninput={handleSlugInput}
            placeholder="your-post-slug"
            class="form-input slug-input"
          />
        </div>
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
        <label for="description">Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="A brief summary of your post..."
          rows="3"
          class="form-input form-textarea"
        ></textarea>
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
  .new-post-page {
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

  .page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .page-header h1 {
    color: var(--color-text-dark);
  }

  .save-btn {
    padding: 0.6rem 1.25rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-button);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, opacity 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Error Banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #ffeef0;
    border: 1px solid #f85149;
    border-radius: var(--border-radius-button);
    color: #cf222e;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  :global(.dark) .error-banner {
    background: rgba(248, 81, 73, 0.15);
    border-color: #f85149;
    color: #ff7b72;
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #cf222e;
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: bold;
  }

  :global(.dark) .error-icon {
    background: #f85149;
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

  .slug-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    overflow: hidden;
    transition: border-color 0.2s, background-color 0.3s;
  }

  :global(.dark) .slug-input-wrapper {
    background: var(--color-bg-secondary-dark);
    border-color: var(--color-border-dark);
  }

  .slug-input-wrapper:focus-within {
    border-color: var(--color-primary);
  }

  :global(.dark) .slug-input-wrapper:focus-within {
    border-color: var(--color-primary-light);
  }

  .slug-prefix {
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    color: var(--color-text-subtle);
    font-size: 0.85rem;
    background: var(--color-border);
    transition: background-color 0.3s, color 0.3s;
  }

  :global(.dark) .slug-prefix {
    background: var(--color-border-dark);
    color: var(--color-text-subtle-dark);
  }

  .slug-input {
    border: none;
    background: transparent;
    flex: 1;
  }

  .slug-input:focus {
    outline: none;
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

    .new-post-page {
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
  }
</style>
