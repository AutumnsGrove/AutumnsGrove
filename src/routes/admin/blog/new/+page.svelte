<script>
  import { goto } from "$app/navigation";
  import MarkdownEditor from "$lib/components/admin/MarkdownEditor.svelte";
  import GutterManager from "$lib/components/admin/GutterManager.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { toast } from "$lib/components/ui/toast";

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
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

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

      // Clear draft on successful save
      editorRef?.clearDraft();

      toast.success("Post created successfully!");

      // Redirect to the edit page or blog admin
      goto(`/admin/blog/edit/${result.slug}`);
    } catch (err) {
      toast.error(err.message || "Failed to create post");
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
    <Button
      onclick={handleSave}
      disabled={saving}
    >
      {saving ? "Saving..." : "Save Post"}
    </Button>
  </header>

  <div class="editor-layout">
    <!-- Metadata Panel -->
    <aside class="metadata-panel">
      <h2 class="panel-title">Post Details</h2>

      <div class="form-group">
        <label for="title">Title</label>
        <Input
          type="text"
          id="title"
          bind:value={title}
          placeholder="Your Post Title"
        />
      </div>

      <div class="form-group">
        <label for="slug">Slug</label>
        <div class="slug-input-wrapper">
          <span class="slug-prefix">/blog/</span>
          <Input
            type="text"
            id="slug"
            bind:value={slug}
            oninput={handleSlugInput}
            placeholder="your-post-slug"
            class="slug-input"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="date">Date</label>
        <Input
          type="date"
          id="date"
          bind:value={date}
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
        <Input
          type="text"
          id="tags"
          bind:value={tagsInput}
          placeholder="tag1, tag2, tag3"
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
            draftKey="new-post"
            previewTitle={title}
            previewDate={date}
            previewTags={parseTags(tagsInput)}
          />
        </div>
        {#if showGutter}
          <aside class="gutter-section">
            <GutterManager
              bind:gutterItems
              availableAnchors={editorRef?.getAvailableAnchors?.() || []}
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
