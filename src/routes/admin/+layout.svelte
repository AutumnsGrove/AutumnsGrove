<script>
  let { data, children } = $props();
  let sidebarOpen = $state(false);

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<svelte:head>
  <title>Admin - Autumns Grove</title>
</svelte:head>

<div class="admin-layout">
  <!-- Mobile header -->
  <header class="mobile-header">
    <button class="hamburger" onclick={toggleSidebar} aria-label="Toggle menu">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    <h2>Admin Panel</h2>
  </header>

  <!-- Overlay for mobile -->
  {#if sidebarOpen}
    <button
      class="sidebar-overlay"
      onclick={closeSidebar}
      aria-label="Close menu"
    ></button>
  {/if}

  <aside class="sidebar" class:open={sidebarOpen}>
    <div class="sidebar-header">
      <h2>Admin Panel</h2>
      <button class="close-sidebar" onclick={closeSidebar} aria-label="Close menu">
        &times;
      </button>
    </div>

    <nav class="sidebar-nav">
      <a href="/admin" class="nav-item" onclick={closeSidebar}>
        <span class="nav-icon">&#x1F3E0;</span>
        Dashboard
      </a>
      <a href="/admin/blog" class="nav-item" onclick={closeSidebar}>
        <span class="nav-icon">&#x1F4DD;</span>
        Blog Posts
      </a>
      <a href="/admin/images" class="nav-item" onclick={closeSidebar}>
        <span class="nav-icon">&#x1F4F7;</span>
        Images
      </a>
      <a href="/admin/analytics" class="nav-item" onclick={closeSidebar}>
        <span class="nav-icon">&#x1F4CA;</span>
        Analytics
      </a>
      <a href="/admin/settings" class="nav-item" onclick={closeSidebar}>
        <span class="nav-icon">&#x2699;</span>
        Settings
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <span class="email">{data.user.email}</span>
      </div>
      <a href="/auth/logout" class="logout-btn">Logout</a>
    </div>
  </aside>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f5f5f5;
  }

  /* Mobile header - hidden on desktop */
  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #24292e;
    color: white;
    align-items: center;
    padding: 0 1rem;
    gap: 1rem;
    z-index: 1000;
  }

  .mobile-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background: white;
    border-radius: 1px;
  }

  /* Sidebar overlay for mobile */
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1001;
    border: none;
    cursor: pointer;
  }

  /* Close button in sidebar - hidden on desktop */
  .close-sidebar {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }

  .sidebar {
    width: 250px;
    background: #24292e;
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 1002;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #3d4450;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: #e1e4e8;
    text-decoration: none;
    transition: background 0.2s;
  }

  .nav-item:hover {
    background: #3d4450;
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #3d4450;
  }

  .user-info {
    margin-bottom: 0.75rem;
  }

  .email {
    font-size: 0.85rem;
    color: #e1e4e8;
    word-break: break-all;
  }

  .logout-btn {
    display: block;
    text-align: center;
    padding: 0.5rem;
    background: #3d4450;
    color: #e1e4e8;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .logout-btn:hover {
    background: #4a5568;
  }

  .content {
    flex: 1;
    margin-left: 250px;
    padding: 2rem;
    min-height: 100vh;
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .mobile-header {
      display: flex;
    }

    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar-overlay {
      display: block;
    }

    .close-sidebar {
      display: block;
    }

    .content {
      margin-left: 0;
      padding: 1rem;
      padding-top: calc(56px + 1rem); /* Account for mobile header */
    }
  }
</style>
