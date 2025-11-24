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

  // Copy feedback state
  let copiedItem = $state(null);

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

      const response = await fetch(`/api/images/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load images');
      }

      if (append) {
        galleryImages = [...galleryImages, ...data.images];
      } else {
        galleryImages = data.images;
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
      alert('Please select image files only');
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
      <h2>CDN Gallery</h2>
      <div class="gallery-controls">
        <input
          type="text"
          class="gallery-filter"
          placeholder="Filter by folder (e.g., blog/)"
          bind:value={galleryFilter}
          onkeydown={(e) => e.key === 'Enter' && filterGallery()}
        />
        <button class="filter-btn" onclick={filterGallery}>Filter</button>
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
    color: #24292e;
  }

  .subtitle {
    margin: 0;
    color: #586069;
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
    color: #24292e;
  }

  .folder-select select {
    padding: 0.5rem;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
  }

  .custom-folder {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .drop-zone {
    border: 2px dashed #d1d5da;
    border-radius: 8px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
  }

  .drop-zone:hover {
    border-color: #0366d6;
    background: #f6f8fa;
  }

  .drop-zone.dragging {
    border-color: #28a745;
    background: #f0fff4;
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
    color: #24292e;
    margin: 0 0 0.5rem 0;
  }

  .drop-hint {
    color: #586069;
    margin: 0 0 0.5rem 0;
  }

  .drop-formats {
    font-size: 0.85rem;
    color: #6a737d;
    margin: 0;
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
    color: #24292e;
  }

  .clear-btn {
    padding: 0.4rem 0.8rem;
    background: #f6f8fa;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    color: #586069;
  }

  .clear-btn:hover {
    background: #e1e4e8;
  }

  .uploads-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .upload-item {
    background: white;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    padding: 1rem;
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
    color: #24292e;
  }

  .upload-status {
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
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
    background: #f6f8fa;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .url-display code {
    font-size: 0.8rem;
    color: #24292e;
    word-break: break-all;
  }

  .copy-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .copy-btn {
    padding: 0.4rem 0.8rem;
    background: #0366d6;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .copy-btn:hover {
    background: #0256cc;
  }

  .copy-btn.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  /* Gallery Section */
  .gallery-section {
    margin-top: 2rem;
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .gallery-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #24292e;
  }

  .gallery-controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .gallery-filter {
    padding: 0.4rem 0.8rem;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    font-size: 0.85rem;
    min-width: 180px;
  }

  .filter-btn,
  .refresh-btn {
    padding: 0.4rem 0.8rem;
    background: #f6f8fa;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    color: #24292e;
  }

  .filter-btn:hover,
  .refresh-btn:hover {
    background: #e1e4e8;
  }

  .gallery-error {
    background: #ffeef0;
    color: #d73a49;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .gallery-loading,
  .gallery-empty {
    text-align: center;
    color: #586069;
    padding: 2rem;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .gallery-item {
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    overflow: hidden;
    background: #f6f8fa;
  }

  .gallery-image-container {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    overflow: hidden;
  }

  .gallery-image-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .gallery-item-info {
    padding: 0.5rem;
    border-top: 1px solid #e1e4e8;
  }

  .gallery-item-name {
    display: block;
    font-size: 0.75rem;
    color: #24292e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gallery-item-size {
    font-size: 0.7rem;
    color: #586069;
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
    background: #0366d6;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .load-more-btn:hover:not(:disabled) {
    background: #0256cc;
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
</style>
