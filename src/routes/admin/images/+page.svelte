<script>
  import { onMount } from 'svelte';
  import { Button, Dialog, Select, Tabs, Badge, Input, toast } from "@autumnsgrove/groveengine/ui";
  import { api, apiRequest } from "$lib/utils/api.js";

  let folder = $state('blog');
  let customFolder = $state('');
  let isDragging = $state(false);
  let uploads = $state([]);
  let uploading = $state(false);

  // Gallery state
  let galleryImages = $state([]);
  let galleryLoading = $state(false);
  let galleryError = $state(null);
  let galleryCursor = $state(null);
  let galleryHasMore = $state(false);
  let galleryFilter = $state('');
  let gallerySortBy = $state('date-desc');

  // Copy feedback state
  let copiedItem = $state(null);

  // Delete confirmation modal state
  let deleteModalOpen = $state(false);
  let imageToDelete = $state(null);
  let deleting = $state(false);

  // Tab state
  let activeTab = $state('upload');

  // Tags state
  let tags = $state([]);
  let newTagName = $state('');
  let newTagColor = $state('#8b9467');

  // Bulk tagging state
  let selectedImages = $state([]);
  let selectedTagId = $state(null);

  // Sync state
  let syncing = $state(false);
  let syncResult = $state(null);
  let d1ImageCount = $state(0);

  const folderOptions = [
    { value: 'blog', label: 'Blog Posts' },
    { value: 'recipes', label: 'Recipes' },
    { value: 'projects', label: 'Projects' },
    { value: 'site', label: 'Site/General' },
    { value: 'custom', label: 'Custom Path...' },
  ];

  onMount(() => {
    loadGallery();
    loadTags();
  });

  async function loadGallery(append = false) {
    galleryLoading = true;
    galleryError = null;

    try {
      const params = new URLSearchParams();
      if (galleryFilter) params.set('prefix', galleryFilter);
      if (append && galleryCursor) params.set('cursor', galleryCursor);
      params.set('limit', '30');
      params.set('sortBy', gallerySortBy);

      const data = await api.get(`/api/images/list?${params}`);

      // Filter to only include actual image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.avif'];
      const filteredImages = data.images.filter(img => {
        const key = img.key.toLowerCase();
        return imageExtensions.some(ext => key.endsWith(ext));
      });

      if (append) {
        galleryImages = [...galleryImages, ...filteredImages];
      } else {
        galleryImages = filteredImages;
      }
      galleryCursor = data.cursor;
      galleryHasMore = data.truncated;
    } catch (err) {
      galleryError = err.message;
    } finally {
      galleryLoading = false;
    }
  }

  function filterGallery() {
    galleryCursor = null;
    loadGallery();
  }

  function changeSortOrder() {
    galleryCursor = null;
    loadGallery();
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileName(key) {
    return key.split('/').pop();
  }

  function getTargetFolder() {
    if (folder === 'custom') {
      return customFolder || 'uploads';
    }
    return folder;
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    uploadFiles(files);
    e.target.value = '';
  }

  async function uploadFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    uploading = true;

    for (const file of imageFiles) {
      const uploadItem = {
        id: Date.now() + Math.random(),
        name: file.name,
        status: 'uploading',
        progress: 0,
        url: null,
        error: null,
        markdown: null,
        svelte: null,
      };

      uploads = [uploadItem, ...uploads];

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', getTargetFolder());

        const result = await apiRequest('/api/images/upload', {
          method: 'POST',
          body: formData,
        });

        uploads = uploads.map(u =>
          u.id === uploadItem.id
            ? { ...u, status: 'success', url: result.url, markdown: result.markdown, svelte: result.svelte }
            : u
        );
      } catch (err) {
        uploads = uploads.map(u =>
          u.id === uploadItem.id
            ? { ...u, status: 'error', error: err.message }
            : u
        );
      }
    }

    uploading = false;

    // Refresh gallery to show newly uploaded images
    loadGallery();
  }

  async function copyToClipboard(text, type, itemId = null) {
    try {
      await navigator.clipboard.writeText(text);
      // Show visual feedback
      const feedbackKey = itemId ? `${itemId}-${type}` : type;
      copiedItem = feedbackKey;
      setTimeout(() => {
        if (copiedItem === feedbackKey) {
          copiedItem = null;
        }
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
      console.error('Failed to copy:', err);
    }
  }

  function clearCompleted() {
    uploads = uploads.filter(u => u.status === 'uploading');
  }

  // Delete confirmation functions
  function confirmDelete(image) {
    imageToDelete = image;
    deleteModalOpen = true;
  }

  function cancelDelete() {
    deleteModalOpen = false;
    imageToDelete = null;
  }

  async function executeDelete() {
    if (!imageToDelete) return;

    deleting = true;

    try {
      await api.delete('/api/images/delete', {
        body: JSON.stringify({ key: imageToDelete.key }),
      });

      // Remove from gallery after successful deletion
      galleryImages = galleryImages.filter(img => img.key !== imageToDelete.key);
      toast.success('Image deleted successfully');
    } catch (err) {
      toast.error('Failed to delete image: ' + err.message);
    } finally {
      deleting = false;
      deleteModalOpen = false;
      imageToDelete = null;
    }
  }

  // Tag management functions
  async function loadTags() {
    try {
      const data = await api.get('/api/admin/gallery/tags');
      tags = data.tags || [];
    } catch (err) {
      console.error('Failed to load tags:', err);
      tags = [];
    }
  }

  async function handleCreateTag(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await api.post('/api/admin/gallery/tags', {
        body: JSON.stringify({ name: newTagName, color: newTagColor })
      });
      toast.success('Tag created');
      newTagName = '';
      newTagColor = '#8b9467';
      await loadTags();
    } catch (err) {
      toast.error('Failed to create tag: ' + err.message);
    }
  }

  async function deleteTag(id) {
    if (!confirm('Delete this tag? This will remove it from all images.')) return;

    try {
      await api.delete(`/api/admin/gallery/tags/${id}`);
      toast.success('Tag deleted');
      await loadTags();
    } catch (err) {
      toast.error('Failed to delete tag: ' + err.message);
    }
  }

  // Bulk tagging functions
  function toggleImageSelection(key) {
    if (selectedImages.includes(key)) {
      selectedImages = selectedImages.filter(k => k !== key);
    } else {
      selectedImages = [...selectedImages, key];
    }
  }

  async function applyBulkTag() {
    if (!selectedTagId || selectedImages.length === 0) {
      toast.error('Please select images and a tag');
      return;
    }

    try {
      const result = await api.post('/api/admin/gallery/bulk-tag', {
        body: JSON.stringify({
          imageKeys: selectedImages,
          tagId: selectedTagId
        })
      });

      toast.success(`Tagged ${result.tagged || selectedImages.length} images`);
      selectedImages = [];
      selectedTagId = null;
    } catch (err) {
      toast.error('Failed to apply tags: ' + err.message);
    }
  }

  // Sync functions
  async function handleSync() {
    syncing = true;
    syncResult = null;

    try {
      const result = await api.post('/api/admin/gallery/sync');
      syncResult = result;
      toast.success(`Synced ${result.total || result.added || 0} images`);
      await loadD1Count();
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      syncing = false;
    }
  }

  async function loadD1Count() {
    if (syncResult) {
      d1ImageCount = syncResult.total || syncResult.added || 0;
    }
  }
</script>

<div class="images-page">
  <header class="page-header">
    <h1>Image Management</h1>
    <p class="subtitle">Upload, organize, and sync images</p>
  </header>

  <Tabs
    bind:value={activeTab}
    tabs={[
      { value: 'upload', label: 'Upload' },
      { value: 'gallery', label: 'CDN Gallery' },
      { value: 'metadata', label: 'Metadata & Tags' },
      { value: 'sync', label: 'Sync' }
    ]}
  >
    {#snippet content(tab)}
      {#if tab.value === 'upload'}
        <!-- Upload Tab -->
        <div class="upload-config">
          <label class="folder-select">
            <span>Upload to:</span>
            <select bind:value={folder}>
              {#each folderOptions as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>

          {#if folder === 'custom'}
            <input
              type="text"
              class="custom-folder"
              placeholder="e.g., blog/my-post-slug"
              bind:value={customFolder}
            />
          {/if}
        </div>

        <div
          class="drop-zone"
          class:dragging={isDragging}
          role="button"
          tabindex="0"
          aria-label="Drag and drop zone for image uploads"
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          onclick={() => document.getElementById('file-input').click()}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('file-input').click();
            }
          }}
        >
          <input
            type="file"
            id="file-input"
            accept="image/*"
            multiple
            onchange={handleFileSelect}
            hidden
          />

          <div class="drop-content">
            <span class="drop-icon">&#x1F4F7;</span>
            <p class="drop-text">
              {#if isDragging}
                Drop images here
              {:else}
                Drag & drop images here
              {/if}
            </p>
            <p class="drop-hint">or click to browse</p>
            <p class="drop-formats">JPG, PNG, GIF, WebP, SVG (max 10MB)</p>
          </div>
        </div>

        {#if uploads.length > 0}
          <div class="uploads-section">
            <div class="uploads-header">
              <h2>Uploads</h2>
              <Button variant="secondary" size="sm" onclick={clearCompleted}>Clear completed</Button>
            </div>

            <div class="uploads-list">
              {#each uploads as upload (upload.id)}
                <div class="upload-item" class:success={upload.status === 'success'} class:error={upload.status === 'error'}>
                  <div class="upload-info">
                    <span class="upload-name">{upload.name}</span>
                    {#if upload.status === 'uploading'}
                      <span class="upload-status uploading">Uploading...</span>
                    {:else if upload.status === 'success'}
                      <span class="upload-status success">Uploaded</span>
                    {:else if upload.status === 'error'}
                      <span class="upload-status error">{upload.error}</span>
                    {/if}
                  </div>

                  {#if upload.status === 'success'}
                    <div class="upload-actions">
                      <div class="url-display">
                        <code>{upload.url}</code>
                      </div>
                      <div class="copy-buttons">
                        <Button variant="primary" size="sm" onclick={() => copyToClipboard(upload.url, 'url', upload.id)}>
                          {copiedItem === `${upload.id}-url` ? 'Copied!' : 'Copy URL'}
                        </Button>
                        <Button variant="primary" size="sm" onclick={() => copyToClipboard(upload.markdown, 'markdown', upload.id)}>
                          {copiedItem === `${upload.id}-markdown` ? 'Copied!' : 'Copy Markdown'}
                        </Button>
                        <Button variant="primary" size="sm" onclick={() => copyToClipboard(upload.svelte, 'svelte', upload.id)}>
                          {copiedItem === `${upload.id}-svelte` ? 'Copied!' : 'Copy Svelte'}
                        </Button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

      {:else if tab.value === 'gallery'}
        <!-- CDN Gallery Tab -->
        <div class="gallery-section">
          <div class="gallery-header">
            <div class="gallery-title">
              <h2>CDN Gallery</h2>
              <p class="gallery-subtitle">Hosted in website CDN</p>
            </div>
            <div class="gallery-controls">
              <div class="control-group">
                <label for="sortBy">Sort by:</label>
                <select id="sortBy" bind:value={gallerySortBy} onchange={changeSortOrder}>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="size-desc">Largest First</option>
                  <option value="size-asc">Smallest First</option>
                </select>
              </div>
              <div class="control-group">
                <label for="filterInput">Filter by folder:</label>
                <input
                  id="filterInput"
                  type="text"
                  class="gallery-filter"
                  placeholder="e.g., blog/"
                  bind:value={galleryFilter}
                  onkeydown={(e) => e.key === 'Enter' && filterGallery()}
                />
                <Button variant="secondary" size="sm" onclick={filterGallery}>Filter</Button>
              </div>
              <Button variant="secondary" size="sm" onclick={() => loadGallery()}>Refresh</Button>
            </div>
          </div>

          {#if galleryError}
            <div class="gallery-error">{galleryError}</div>
          {/if}

          {#if galleryLoading && galleryImages.length === 0}
            <div class="gallery-loading">Loading images...</div>
          {:else if galleryImages.length === 0}
            <div class="gallery-empty">No images found</div>
          {:else}
            <div class="gallery-grid">
              {#each galleryImages as image (image.key)}
                <div class="gallery-item">
                  <div class="gallery-image-container">
                    <img src={image.url} alt={getFileName(image.key)} loading="lazy" />
                  </div>
                  <div class="gallery-item-info">
                    <span class="gallery-item-name" title={image.key}>{getFileName(image.key)}</span>
                    <span class="gallery-item-size">{formatFileSize(image.size)}</span>
                  </div>
                  <div class="gallery-item-actions">
                    <Button variant="primary" size="sm" onclick={() => copyToClipboard(image.url, 'url', image.key)}>
                      {copiedItem === `${image.key}-url` ? '✓' : 'URL'}
                    </Button>
                    <Button variant="primary" size="sm" onclick={() => copyToClipboard(`![](${image.url})`, 'markdown', image.key)}>
                      {copiedItem === `${image.key}-markdown` ? '✓' : 'MD'}
                    </Button>
                    <Button variant="danger" size="sm" onclick={() => confirmDelete(image)} aria-label="Delete image" title="Delete image">
                      X
                    </Button>
                  </div>
                </div>
              {/each}
            </div>

            {#if galleryHasMore}
              <div class="gallery-load-more">
                <Button
                  variant="primary"
                  onclick={() => loadGallery(true)}
                  disabled={galleryLoading}
                >
                  {galleryLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            {/if}
          {/if}
        </div>

      {:else if tab.value === 'metadata'}
        <!-- Metadata & Tags Tab -->
        <div class="metadata-section">
          <!-- Tag Management Section -->
          <div class="tags-section">
            <h2>Manage Tags</h2>

            <!-- Create Tag Form -->
            <form class="create-tag-form" onsubmit={handleCreateTag}>
              <Input placeholder="Tag name (e.g., 'minecraft')" bind:value={newTagName} />
              <input type="color" class="color-picker" bind:value={newTagColor} />
              <Button type="submit">Create Tag</Button>
            </form>

            <!-- Tag List -->
            <div class="tag-list">
              {#each tags as tag (tag.id)}
                <div class="tag-item">
                  <Badge style="background-color: {tag.color}; color: white;">{tag.name}</Badge>
                  <span class="tag-slug">{tag.slug}</span>
                  <Button variant="ghost" size="sm" onclick={() => deleteTag(tag.id)}>
                    Delete
                  </Button>
                </div>
              {:else}
                <p class="empty-state">No tags yet. Create one above to get started.</p>
              {/each}
            </div>
          </div>

          <!-- Bulk Tagging Section -->
          <div class="bulk-tagging-section">
            <h2>Bulk Tag Images</h2>

            <!-- Image Grid with Multi-Select -->
            <div class="bulk-tag-grid">
              {#each galleryImages as image (image.key)}
                <div
                  class="bulk-tag-item"
                  class:selected={selectedImages.includes(image.key)}
                  onclick={() => toggleImageSelection(image.key)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleImageSelection(image.key);
                    }
                  }}
                >
                  <img src={image.url} alt={getFileName(image.key)} loading="lazy" />
                  <div class="selection-overlay">
                    {#if selectedImages.includes(image.key)}
                      <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    {/if}
                  </div>
                </div>
              {:else}
                <p class="empty-state">No images in gallery yet.</p>
              {/each}
            </div>

            <!-- Bulk Actions Bar -->
            {#if selectedImages.length > 0}
              <div class="bulk-actions">
                <p class="selection-count">{selectedImages.length} images selected</p>
                <select class="tag-select" bind:value={selectedTagId}>
                  <option value={null}>Select tag...</option>
                  {#each tags as tag (tag.id)}
                    <option value={tag.id}>{tag.name}</option>
                  {/each}
                </select>
                <Button onclick={applyBulkTag} disabled={!selectedTagId}>Apply Tag</Button>
                <Button variant="ghost" onclick={() => selectedImages = []}>Clear Selection</Button>
              </div>
            {/if}
          </div>
        </div>

      {:else if tab.value === 'sync'}
        <!-- Sync Tab -->
        <div class="sync-section">
          <h2>R2 ↔ D1 Sync</h2>
          <p class="sync-description">Sync R2 images to the D1 database for metadata support.</p>

          <!-- Sync Stats -->
          <div class="sync-stats">
            <div class="stat-card">
              <h3>R2 Images</h3>
              <p class="stat-number">{galleryImages.length}</p>
            </div>
            <div class="stat-card">
              <h3>D1 Records</h3>
              <p class="stat-number">{d1ImageCount}</p>
            </div>
            <div class="stat-card">
              <h3>Not Synced</h3>
              <p class="stat-number">{Math.max(0, galleryImages.length - d1ImageCount)}</p>
            </div>
          </div>

          <Button onclick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          {#if syncResult}
            <div class="sync-result">
              <p>✅ Synced {syncResult.added || 0} new images</p>
              <p>🔄 Updated {syncResult.updated || 0} existing records</p>
            </div>
          {/if}
        </div>
      {/if}
    {/snippet}
  </Tabs>
</div>

<!-- Delete Confirmation Modal -->
<Dialog bind:open={deleteModalOpen} title="Delete Image?">
  {#if imageToDelete}
    <p class="modal-filename">{getFileName(imageToDelete.key)}</p>
    <div class="modal-preview">
      <img src={imageToDelete.url} alt="Preview" />
    </div>
  {/if}
  <p class="modal-warning">This action cannot be undone.</p>

  {#snippet footer()}
    <div class="modal-actions">
      <Button variant="secondary" onclick={cancelDelete} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="danger" onclick={executeDelete} disabled={deleting}>
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  {/snippet}
</Dialog>

<style>
  .images-page {
    max-width: 800px;
  }
  .page-header {
    margin-bottom: 2rem;
  }
  .page-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .subtitle {
    margin: 0;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .upload-config {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .folder-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .folder-select span {
    font-weight: 500;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .folder-select select {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .custom-folder {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .drop-zone {
    border: 2px dashed var(--color-border);
    border-radius: var(--border-radius-standard);
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--mobile-menu-bg);
  }
  .drop-zone:hover {
    border-color: var(--color-primary);
    background: var(--cream-200);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .drop-zone.dragging {
    border-color: var(--grove-500);
    background: #f0fff4;
  }
  :global(.dark) .drop-zone.dragging {
    background: rgba(40, 167, 69, 0.1);
  }
  .drop-content {
    pointer-events: none;
  }
  .drop-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }
  .drop-text {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--color-foreground);
    margin: 0 0 0.5rem 0;
    transition: color 0.3s ease;
  }
  .drop-hint {
    color: var(--color-muted-foreground);
    margin: 0 0 0.5rem 0;
    transition: color 0.3s ease;
  }
  .drop-formats {
    font-size: 0.85rem;
    color: var(--bark-500);
    margin: 0;
    transition: color 0.3s ease;
  }
  .uploads-section {
    margin-top: 2rem;
  }
  .uploads-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .uploads-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .uploads-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .upload-item {
    background: var(--mobile-menu-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    padding: 1rem;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .upload-item.success {
    border-color: var(--grove-500);
  }
  .upload-item.error {
    border-color: var(--color-error);
  }
  .upload-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .upload-name {
    font-weight: 500;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .upload-status {
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-small);
  }
  .upload-status.uploading {
    background: #fff5b1;
    color: var(--color-warning-light);
  }
  .upload-status.success {
    background: #dcffe4;
    color: var(--grove-700);
  }
  .upload-status.error {
    background: #ffeef0;
    color: var(--color-error);
  }
  .upload-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .url-display {
    background: var(--cream-200);
    padding: 0.5rem;
    border-radius: var(--border-radius-small);
    overflow-x: auto;
    transition: background-color 0.3s ease;
  }
  .url-display code {
    font-size: 0.8rem;
    color: var(--color-foreground);
    word-break: break-all;
    transition: color 0.3s ease;
  }
  .copy-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  /* Gallery Section */
  .gallery-section {
    margin-top: 2rem;
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
  }
  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .gallery-title h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .gallery-subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    font-style: italic;
    transition: color 0.3s ease;
  }
  .gallery-controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .control-group label {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .control-group select {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .gallery-filter {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    min-width: 180px;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .gallery-error {
    background: #ffeef0;
    color: var(--color-error);
    padding: 1rem;
    border-radius: var(--border-radius-small);
    margin-bottom: 1rem;
  }
  .gallery-loading,
  .gallery-empty {
    text-align: center;
    color: var(--color-muted-foreground);
    padding: 2rem;
    transition: color 0.3s ease;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }
  .gallery-item {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-button);
    overflow: hidden;
    background: var(--cream-200);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  .gallery-image-container {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--mobile-menu-bg);
    overflow: hidden;
    transition: background-color 0.3s ease;
  }
  .gallery-image-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .gallery-item-info {
    padding: 0.5rem;
    border-top: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .gallery-item-name {
    display: block;
    font-size: 0.75rem;
    color: var(--color-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s ease;
  }
  .gallery-item-size {
    font-size: 0.7rem;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .gallery-item-actions {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    padding-top: 0;
  }
  .gallery-load-more {
    text-align: center;
    margin-top: 1.5rem;
  }
  /* Mobile styles for gallery */
  @media (max-width: 768px) {
    .gallery-header {
      flex-direction: column;
      align-items: stretch;
    }
    .gallery-controls {
      flex-direction: column;
    }
    .gallery-filter {
      min-width: 0;
      width: 100%;
    }
    .gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.5rem;
    }
  }
  /* Modal styles for preview */
  .modal-filename {
    font-family: monospace;
    font-size: 0.9rem;
    color: var(--color-muted-foreground);
    word-break: break-all;
    margin: 0 0 1rem 0;
    transition: color 0.3s ease;
  }
  .modal-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--cream-200);
    border-radius: var(--border-radius-small);
    padding: 0.5rem;
    margin-bottom: 1rem;
    max-height: 150px;
    overflow: hidden;
    transition: background-color 0.3s ease;
  }
  .modal-preview img {
    max-width: 100%;
    max-height: 130px;
    object-fit: contain;
  }
  .modal-warning {
    font-size: 0.85rem;
    color: var(--color-danger, var(--color-error));
    margin: 0 0 1.5rem 0;
    font-weight: 500;
  }
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  /* Metadata & Tags Section */
  .metadata-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .tags-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    transition: background-color 0.3s ease;
  }

  .tags-section h2,
  .bulk-tagging-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--color-foreground);
    font-family: var(--font-mono);
    transition: color 0.3s ease;
  }

  .create-tag-form {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .color-picker {
    width: 50px;
    height: 38px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    cursor: pointer;
    background: var(--mobile-menu-bg);
    transition: border-color 0.3s ease;
  }

  .color-picker:hover {
    border-color: var(--color-primary);
  }

  .tag-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--cream-200);
    border-radius: var(--border-radius-small);
    border: 1px solid var(--color-border);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .tag-slug {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    flex: 1;
    transition: color 0.3s ease;
  }

  .empty-state {
    text-align: center;
    color: var(--color-muted-foreground);
    padding: 2rem;
    font-style: italic;
    transition: color 0.3s ease;
  }

  /* Bulk Tagging Section */
  .bulk-tagging-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    transition: background-color 0.3s ease;
  }

  .bulk-tag-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 1024px) {
    .bulk-tag-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .bulk-tag-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .bulk-tag-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: var(--border-radius-button);
    overflow: hidden;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.2s ease;
  }

  .bulk-tag-item:hover {
    border-color: var(--color-muted-foreground);
  }

  .bulk-tag-item.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .bulk-tag-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .selection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .bulk-tag-item.selected .selection-overlay {
    opacity: 1;
  }

  .checkmark {
    width: 48px;
    height: 48px;
    color: var(--color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .bulk-actions {
    position: sticky;
    bottom: 0;
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    background: var(--cream-200);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    flex-wrap: wrap;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .selection-count {
    margin: 0;
    font-weight: 600;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }

  .tag-select {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    font-size: 0.9rem;
    min-width: 150px;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  /* Sync Section */
  .sync-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    transition: background-color 0.3s ease;
  }

  .sync-section h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: var(--color-foreground);
    font-family: var(--font-mono);
    transition: color 0.3s ease;
  }

  .sync-description {
    margin: 0 0 1.5rem 0;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }

  .sync-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 768px) {
    .sync-stats {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: var(--cream-200);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    text-align: center;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .stat-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: var(--color-muted-foreground);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
  }

  .stat-number {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-primary);
    font-family: var(--font-mono);
    transition: color 0.3s ease;
  }

  .sync-result {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--cream-200);
    border: 1px solid var(--grove-500);
    border-radius: var(--border-radius-standard);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .sync-result p {
    margin: 0.5rem 0;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
</style>
