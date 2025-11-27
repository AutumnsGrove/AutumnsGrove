<script>
  import { onMount } from 'svelte';

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

  // Toast notification state
  let toasts = $state([]);
  let toastId = 0;

  // Modal element reference for focus management
  let modalElement = $state(null);

  const folderOptions = [
    { value: 'blog', label: 'Blog Posts' },
    { value: 'recipes', label: 'Recipes' },
    { value: 'projects', label: 'Projects' },
    { value: 'site', label: 'Site/General' },
    { value: 'custom', label: 'Custom Path...' },
  ];

  onMount(() => {
    loadGallery();
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

      const response = await fetch(`/api/images/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load images');
      }

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
      showToast('Please select image files only', 'error');
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

        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Upload failed');
        }

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
      console.error('Failed to copy:', err);
    }
  }

  function clearCompleted() {
    uploads = uploads.filter(u => u.status === 'uploading');
  }

  // Toast notification functions
  function showToast(message, type = 'info') {
    const id = ++toastId;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 5000);
  }

  function dismissToast(id) {
    toasts = toasts.filter(t => t.id !== id);
  }

  // Delete confirmation functions
  function confirmDelete(image) {
    imageToDelete = image;
    deleteModalOpen = true;
    // Focus the modal after it opens
    setTimeout(() => {
      if (modalElement) {
        modalElement.focus();
      }
    }, 0);
  }

  function cancelDelete() {
    deleteModalOpen = false;
    imageToDelete = null;
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      cancelDelete();
    }
    // Focus trap: keep focus within modal
    if (e.key === 'Tab' && modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  async function executeDelete() {
    if (!imageToDelete) return;

    deleting = true;

    try {
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: imageToDelete.key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete image');
      }

      // Remove from gallery after successful deletion
      galleryImages = galleryImages.filter(img => img.key !== imageToDelete.key);
      showToast('Image deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete image: ' + err.message, 'error');
    } finally {
      deleting = false;
      deleteModalOpen = false;
      imageToDelete = null;
    }
  }
</script>

<div class="images-page">
  <header class="page-header">
    <h1>Upload Images</h1>
    <p class="subtitle">Drag and drop images to upload to CDN</p>
  </header>

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
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={() => document.getElementById('file-input').click()}
    onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input').click()}
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
        <button class="clear-btn" onclick={clearCompleted}>Clear completed</button>
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
                  <button class="copy-btn" onclick={() => copyToClipboard(upload.url, 'url', upload.id)}>
                    {copiedItem === `${upload.id}-url` ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button class="copy-btn" onclick={() => copyToClipboard(upload.markdown, 'markdown', upload.id)}>
                    {copiedItem === `${upload.id}-markdown` ? 'Copied!' : 'Copy Markdown'}
                  </button>
                  <button class="copy-btn" onclick={() => copyToClipboard(upload.svelte, 'svelte', upload.id)}>
                    {copiedItem === `${upload.id}-svelte` ? 'Copied!' : 'Copy Svelte'}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Gallery Section -->
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
          <button class="filter-btn" onclick={filterGallery}>Filter</button>
        </div>
        <button class="refresh-btn" onclick={() => loadGallery()}>Refresh</button>
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
              <button class="copy-btn small" onclick={() => copyToClipboard(image.url, 'url', image.key)}>
                {copiedItem === `${image.key}-url` ? '✓' : 'URL'}
              </button>
              <button class="copy-btn small" onclick={() => copyToClipboard(`![](${image.url})`, 'markdown', image.key)}>
                {copiedItem === `${image.key}-markdown` ? '✓' : 'MD'}
              </button>
              <button class="delete-btn small" onclick={() => confirmDelete(image)} aria-label="Delete image">
                X
              </button>
            </div>
          </div>
        {/each}
      </div>

      {#if galleryHasMore}
        <div class="gallery-load-more">
          <button
            class="load-more-btn"
            onclick={() => loadGallery(true)}
            disabled={galleryLoading}
          >
            {galleryLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Delete Confirmation Modal -->
{#if deleteModalOpen}
  <div
    class="modal-overlay"
    onclick={cancelDelete}
    onkeydown={handleModalKeydown}
    role="presentation"
  >
    <div
      class="modal-content"
      bind:this={modalElement}
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleModalKeydown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <h3 id="modal-title">Delete Image?</h3>
      {#if imageToDelete}
        <p class="modal-filename">{getFileName(imageToDelete.key)}</p>
        <div class="modal-preview">
          <img src={imageToDelete.url} alt="Preview" />
        </div>
      {/if}
      <p class="modal-warning">This action cannot be undone.</p>
      <div class="modal-actions">
        <button class="modal-btn cancel" onclick={cancelDelete} disabled={deleting}>
          Cancel
        </button>
        <button class="modal-btn delete" onclick={executeDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notifications -->
{#if toasts.length > 0}
  <div class="toast-container" role="status" aria-live="polite">
    {#each toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}">
        <span class="toast-message">{toast.message}</span>
        <button class="toast-dismiss" onclick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
          &times;
        </button>
      </div>
    {/each}
  </div>
{/if}

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
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .page-header h1 {
    color: var(--color-text-dark);
  }

  .subtitle {
    margin: 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .subtitle {
    color: var(--color-text-subtle-dark);
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
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .folder-select span {
    color: var(--color-text-dark);
  }

  .folder-select select {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    background: var(--mobile-menu-bg);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .folder-select select {
    background: var(--color-bg-tertiary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .custom-folder {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    background: var(--mobile-menu-bg);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .custom-folder {
    background: var(--color-bg-tertiary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
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

  :global(.dark) .drop-zone {
    background: var(--color-bg-tertiary-dark);
    border-color: var(--color-border-dark);
  }

  .drop-zone:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-secondary);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .drop-zone:hover {
    background: var(--color-bg-secondary-dark);
    border-color: var(--color-primary-light);
  }

  .drop-zone.dragging {
    border-color: #28a745;
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
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
    transition: color 0.3s ease;
  }

  :global(.dark) .drop-text {
    color: var(--color-text-dark);
  }

  .drop-hint {
    color: var(--color-text-muted);
    margin: 0 0 0.5rem 0;
    transition: color 0.3s ease;
  }

  :global(.dark) .drop-hint {
    color: var(--color-text-subtle-dark);
  }

  .drop-formats {
    font-size: 0.85rem;
    color: var(--color-text-subtle);
    margin: 0;
    transition: color 0.3s ease;
  }

  :global(.dark) .drop-formats {
    color: var(--color-text-subtle-dark);
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
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .uploads-header h2 {
    color: var(--color-text-dark);
  }

  .clear-btn {
    padding: 0.4rem 0.8rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .clear-btn {
    background: var(--color-bg-secondary-dark);
    color: var(--color-text-subtle-dark);
    border-color: var(--color-border-dark);
  }

  .clear-btn:hover {
    background: #e1e4e8;
  }

  :global(.dark) .clear-btn:hover {
    background: rgba(255, 255, 255, 0.1);
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

  :global(.dark) .upload-item {
    background: var(--color-bg-tertiary-dark);
    border-color: var(--color-border-dark);
  }

  .upload-item.success {
    border-color: #28a745;
  }

  .upload-item.error {
    border-color: #d73a49;
  }

  .upload-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .upload-name {
    font-weight: 500;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .upload-name {
    color: var(--color-text-dark);
  }

  .upload-status {
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-small);
  }

  .upload-status.uploading {
    background: #fff5b1;
    color: #735c0f;
  }

  .upload-status.success {
    background: #dcffe4;
    color: #22863a;
  }

  .upload-status.error {
    background: #ffeef0;
    color: #d73a49;
  }

  .upload-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .url-display {
    background: var(--color-bg-secondary);
    padding: 0.5rem;
    border-radius: var(--border-radius-small);
    overflow-x: auto;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .url-display {
    background: var(--color-bg-secondary-dark);
  }

  .url-display code {
    font-size: 0.8rem;
    color: var(--color-text);
    word-break: break-all;
    transition: color 0.3s ease;
  }

  :global(.dark) .url-display code {
    color: var(--color-text-dark);
  }

  .copy-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .copy-btn {
    padding: 0.4rem 0.8rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .copy-btn {
    background: var(--color-primary-light);
  }

  .copy-btn:hover {
    background: #0256cc;
  }

  :global(.dark) .copy-btn:hover {
    background: #0366d6;
  }

  .copy-btn.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
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

  :global(.dark) .gallery-section {
    background: var(--color-bg-tertiary-dark);
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
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .gallery-title h2 {
    color: var(--color-text-dark);
  }

  .gallery-subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-style: italic;
    transition: color 0.3s ease;
  }

  :global(.dark) .gallery-subtitle {
    color: var(--color-text-subtle-dark);
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
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .control-group label {
    color: var(--color-text-muted-dark);
  }

  .control-group select {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    background: var(--mobile-menu-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .control-group select {
    background: var(--color-bg-tertiary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .gallery-filter {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    min-width: 180px;
    background: var(--mobile-menu-bg);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .gallery-filter {
    background: var(--color-bg-tertiary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .filter-btn,
  .refresh-btn {
    padding: 0.4rem 0.8rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-small);
    font-size: 0.85rem;
    cursor: pointer;
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .filter-btn,
  :global(.dark) .refresh-btn {
    background: var(--color-bg-secondary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .filter-btn:hover,
  .refresh-btn:hover {
    background: #e1e4e8;
  }

  :global(.dark) .filter-btn:hover,
  :global(.dark) .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .gallery-error {
    background: #ffeef0;
    color: #d73a49;
    padding: 1rem;
    border-radius: var(--border-radius-small);
    margin-bottom: 1rem;
  }

  .gallery-loading,
  .gallery-empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: 2rem;
    transition: color 0.3s ease;
  }

  :global(.dark) .gallery-loading,
  :global(.dark) .gallery-empty {
    color: var(--color-text-subtle-dark);
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
    background: var(--color-bg-secondary);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .gallery-item {
    background: var(--color-bg-secondary-dark);
    border-color: var(--color-border-dark);
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

  :global(.dark) .gallery-image-container {
    background: var(--color-bg-tertiary-dark);
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

  :global(.dark) .gallery-item-info {
    border-color: var(--color-border-dark);
  }

  .gallery-item-name {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s ease;
  }

  :global(.dark) .gallery-item-name {
    color: var(--color-text-dark);
  }

  .gallery-item-size {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .gallery-item-size {
    color: var(--color-text-subtle-dark);
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

  .load-more-btn {
    padding: 0.5rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .load-more-btn {
    background: var(--color-primary-light);
  }

  .load-more-btn:hover:not(:disabled) {
    background: #0256cc;
  }

  :global(.dark) .load-more-btn:hover:not(:disabled) {
    background: #0366d6;
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  /* Delete Button */
  .delete-btn {
    background: #d73a49;
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .delete-btn:hover {
    background: #cb2431;
  }

  .delete-btn.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: bold;
  }

  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  :global(.dark) .modal-overlay {
    background: rgba(0, 0, 0, 0.7);
  }

  /* Modal Content */
  .modal-content {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    padding: 1.5rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s ease;
  }

  :global(.dark) .modal-content {
    background: var(--color-bg-tertiary-dark);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .modal-content h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .modal-content h3 {
    color: var(--color-text-dark);
  }

  .modal-filename {
    font-family: monospace;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    word-break: break-all;
    margin: 0 0 1rem 0;
    transition: color 0.3s ease;
  }

  :global(.dark) .modal-filename {
    color: var(--color-text-subtle-dark);
  }

  .modal-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-small);
    padding: 0.5rem;
    margin-bottom: 1rem;
    max-height: 150px;
    overflow: hidden;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .modal-preview {
    background: var(--color-bg-secondary-dark);
  }

  .modal-preview img {
    max-width: 100%;
    max-height: 130px;
    object-fit: contain;
  }

  .modal-warning {
    font-size: 0.85rem;
    color: #d73a49;
    margin: 0 0 1.5rem 0;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .modal-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s ease, opacity 0.2s ease;
  }

  .modal-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .modal-btn.cancel {
    background: var(--color-bg-secondary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .modal-btn.cancel {
    background: var(--color-bg-secondary-dark);
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  .modal-btn.cancel:hover:not(:disabled) {
    background: #e1e4e8;
  }

  :global(.dark) .modal-btn.cancel:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .modal-btn.delete {
    background: #d73a49;
    color: white;
  }

  .modal-btn.delete:hover:not(:disabled) {
    background: #cb2431;
  }

  /* Toast Notifications */
  .toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1001;
    max-width: 350px;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-small);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: #dcffe4;
    color: #22863a;
    border: 1px solid #22863a;
  }

  :global(.dark) .toast-success {
    background: rgba(40, 167, 69, 0.2);
    color: #7ee787;
    border-color: #238636;
  }

  .toast-error {
    background: #ffeef0;
    color: #d73a49;
    border: 1px solid #d73a49;
  }

  :global(.dark) .toast-error {
    background: rgba(248, 81, 73, 0.2);
    color: #f85149;
    border-color: #f85149;
  }

  .toast-info {
    background: #e6f3ff;
    color: #0366d6;
    border: 1px solid #0366d6;
  }

  :global(.dark) .toast-info {
    background: rgba(56, 139, 253, 0.2);
    color: #58a6ff;
    border-color: #388bfd;
  }

  .toast-message {
    flex: 1;
    font-size: 0.9rem;
  }

  .toast-dismiss {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    margin-left: 0.5rem;
    opacity: 0.7;
    color: inherit;
    line-height: 1;
  }

  .toast-dismiss:hover {
    opacity: 1;
  }

  /* Mobile styles for modal and toast */
  @media (max-width: 768px) {
    .modal-content {
      max-width: none;
      margin: 0 1rem;
    }

    .toast-container {
      left: 1rem;
      right: 1rem;
      max-width: none;
    }
  }
</style>
