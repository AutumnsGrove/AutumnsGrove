<script>
  import { Toast, Sheet, Logo, Button } from "@autumnsgrove/groveengine/ui";
  import {
    LayoutDashboard,
    FileText,
    Files,
    Image,
    BarChart3,
    Calendar,
    Terminal,
    Settings,
    Menu
  } from 'lucide-svelte';
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  let { data, children } = $props();
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);

  // Load collapsed state from localStorage
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem("admin-sidebar-collapsed");
      if (saved !== null) {
        sidebarCollapsed = saved === "true";
      }
    }
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  function toggleCollapsed() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem("admin-sidebar-collapsed", String(sidebarCollapsed));
    }
  }
</script>

<svelte:head>
  <title>Admin - Autumns Grove</title>
</svelte:head>

<div class="admin-layout">
  <!-- Mobile header with Sheet trigger -->
  <header class="mobile-header">
    <Sheet bind:open={sidebarOpen} side="left" title="Admin Panel">
      {#snippet trigger()}
        <Button variant="ghost" size="icon" aria-label="Toggle menu">
          <Menu size={20} />
        </Button>
      {/snippet}

      <!-- Mobile sidebar content -->
      <nav class="mobile-sidebar-nav">
        <a href="/admin" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><LayoutDashboard size={18} /></span>
          Dashboard
        </a>
        <a href="/admin/blog" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><FileText size={18} /></span>
          Blog Posts
        </a>
        <a href="/admin/pages" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><Files size={18} /></span>
          Pages
        </a>
        <a href="/admin/images" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><Image size={18} /></span>
          Images
        </a>
        <a href="/admin/analytics" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><BarChart3 size={18} /></span>
          Analytics
        </a>
        <a href="/admin/timeline" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><Calendar size={18} /></span>
          Timeline
        </a>
        <a href="/admin/logs" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><Terminal size={18} /></span>
          Console
        </a>
        <a href="/admin/settings" class="nav-item" onclick={closeSidebar}>
          <span class="nav-icon"><Settings size={18} /></span>
          Settings
        </a>

        <div class="mobile-sidebar-footer">
          {#if data?.user}
            <div class="user-info">
              <span class="email">{data.user.email}</span>
            </div>
          {/if}
          <a href="/auth/logout" class="logout-btn">Logout</a>
        </div>
      </nav>
    </Sheet>
    <a href="/" class="mobile-home-link" aria-label="Go to home page">
      <Logo class="w-5 h-5" color="#e67e22" />
      <span>Autumns Grove</span>
    </a>
    <span class="mobile-header-spacer"></span>
  </header>

  <aside class="sidebar" class:collapsed={sidebarCollapsed}>
    <div class="sidebar-header">
      <h2 class="sidebar-title">{#if sidebarCollapsed}AP{:else}Admin Panel{/if}</h2>
      <button class="collapse-btn desktop-only" onclick={toggleCollapsed} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand" : "Collapse"}>
        {#if sidebarCollapsed}»{:else}«{/if}
      </button>
    </div>

    <nav class="sidebar-nav">
      <a href="/admin" class="nav-item">
        <span class="nav-icon"><LayoutDashboard size={18} /></span>
        Dashboard
      </a>
      <a href="/admin/blog" class="nav-item">
        <span class="nav-icon"><FileText size={18} /></span>
        Blog Posts
      </a>
      <a href="/admin/pages" class="nav-item">
        <span class="nav-icon"><Files size={18} /></span>
        Pages
      </a>
      <a href="/admin/images" class="nav-item">
        <span class="nav-icon"><Image size={18} /></span>
        Images
      </a>
      <a href="/admin/analytics" class="nav-item">
        <span class="nav-icon"><BarChart3 size={18} /></span>
        Analytics
      </a>
      <a href="/admin/timeline" class="nav-item">
        <span class="nav-icon"><Calendar size={18} /></span>
        Timeline
      </a>
      <a href="/admin/logs" class="nav-item">
        <span class="nav-icon"><Terminal size={18} /></span>
        Console
      </a>
      <a href="/admin/settings" class="nav-item">
        <span class="nav-icon"><Settings size={18} /></span>
        Settings
      </a>
    </nav>

    <div class="sidebar-footer">
      {#if data?.user}
        <div class="user-info">
          <span class="email">{#if sidebarCollapsed}👤{:else}{data.user.email}{/if}</span>
        </div>
      {/if}
      <a href="/auth/logout" class="logout-btn" title="Logout">{#if sidebarCollapsed}⏻{:else}Logout{/if}</a>
    </div>
  </aside>

  <main class="content" class:sidebar-collapsed={sidebarCollapsed}>
    {@render children()}
  </main>
</div>

<Toast />

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--cream-200);
    transition: background-color 0.3s ease;
  }
  /* Mobile header - hidden on desktop */
  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    z-index: 1000;
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .mobile-home-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s;
  }
  .mobile-home-link:hover {
    color: var(--color-primary-hover);
  }
  /* Mobile sidebar nav styles (inside Sheet) */
  .mobile-sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .mobile-sidebar-nav .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    color: var(--color-muted-foreground);
    text-decoration: none;
    border-radius: var(--border-radius-button);
    transition: color 0.2s;
  }
  .mobile-sidebar-nav .nav-item:hover {
    color: var(--grove-500);
  }
  .mobile-sidebar-nav .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    color: var(--grove-500);
  }
  .mobile-sidebar-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
  .mobile-sidebar-footer .user-info {
    margin-bottom: 0.75rem;
  }
  .mobile-sidebar-footer .email {
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
  }
  .mobile-sidebar-footer .logout-btn {
    display: block;
    text-align: center;
    padding: 0.5rem;
    background: var(--cream-200);
    color: var(--color-muted-foreground);
    text-decoration: none;
    border-radius: var(--border-radius-button);
    font-size: 0.85rem;
    transition: background 0.2s, color 0.2s;
  }
  .mobile-sidebar-footer .logout-btn:hover {
    background: var(--color-border);
    color: var(--color-foreground);
  }
  .mobile-header-spacer {
    width: 40px; /* Match button width for centering */
  }
  .sidebar {
    width: 250px;
    background: var(--mobile-menu-bg);
    color: var(--color-foreground);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: calc(4rem + 0.75rem); /* Header height + margin */
    left: 0.75rem;
    bottom: 0.75rem;
    height: auto;
    max-height: calc(100vh - 5.5rem); /* Account for header + margins */
    z-index: 99; /* Below header (100) but above content */
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    overflow-y: auto;
  }
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.3s ease;
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
    min-height: 0; /* Allow flex item to shrink */
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: var(--color-muted-foreground);
    text-decoration: none;
    border-radius: var(--border-radius-button);
    transition: background 0.2s, color 0.2s;
  }
  .nav-item:hover {
    background: var(--cream-200);
    color: var(--color-primary);
  }
  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    color: var(--grove-500);
  }
  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
    flex-shrink: 0; /* Prevent footer from being squeezed */
  }
  .user-info {
    margin-bottom: 0.75rem;
  }
  .email {
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    word-break: break-all;
    transition: color 0.3s ease;
  }
  .logout-btn {
    display: block;
    text-align: center;
    padding: 0.5rem;
    background: var(--cream-200);
    color: var(--color-muted-foreground);
    text-decoration: none;
    border-radius: var(--border-radius-button);
    font-size: 0.85rem;
    transition: background 0.2s, color 0.2s;
  }
  .logout-btn:hover {
    background: var(--color-border);
    color: var(--color-foreground);
  }
  .content {
    flex: 1;
    margin-left: calc(250px + 0.75rem); /* Sidebar width + left margin */
    padding: 2rem;
    min-height: 100vh;
    transition: margin-left 0.2s ease;
  }

  .content.sidebar-collapsed {
    margin-left: calc(60px + 0.75rem); /* Collapsed sidebar width + margin */
  }

  /* Collapse button */
  .collapse-btn {
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-muted);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    transition: all 0.15s ease;
  }

  :global(.dark) .collapse-btn {
    border-color: var(--color-border-dark);
    color: var(--color-text-muted-dark);
  }

  .collapse-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-primary);
  }

  :global(.dark) .collapse-btn:hover {
    background: var(--color-border-dark);
    color: var(--color-primary-light);
  }

  .desktop-only {
    display: block;
  }

  /* Collapsed sidebar state */
  .sidebar.collapsed {
    width: 60px;
  }

  .sidebar.collapsed .sidebar-title {
    font-size: 0.9rem;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 1rem 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .sidebar.collapsed .collapse-btn {
    padding: 0.15rem 0.35rem;
    font-size: 0.85rem;
  }

  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 0.75rem 0.5rem;
  }

  .sidebar.collapsed .nav-label {
    display: none;
  }

  .sidebar.collapsed .nav-icon {
    font-size: 1.25rem;
  }

  .sidebar.collapsed .sidebar-footer {
    padding: 0.75rem 0.5rem;
    text-align: center;
  }

  .sidebar.collapsed .email {
    font-size: 1.1rem;
  }

  .sidebar.collapsed .logout-btn {
    padding: 0.4rem;
    font-size: 1rem;
  }
  /* Mobile styles */
  @media (max-width: 768px) {
    .mobile-header {
      display: flex;
    }
    /* Hide desktop sidebar on mobile - using Sheet instead */
    .sidebar {
      display: none;
    }

    .desktop-only {
      display: none;
    }

    .content {
      margin-left: 0 !important;
      padding: 1rem;
      padding-top: calc(56px + 1rem); /* Account for mobile header */
    }
  }
</style>
