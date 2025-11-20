<script>
  let { data, children } = $props();
</script>

<svelte:head>
  <title>Admin - Autumns Grove</title>
</svelte:head>

<div class="admin-layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Admin Panel</h2>
    </div>

    <nav class="sidebar-nav">
      <a href="/admin" class="nav-item">
        <span class="nav-icon">&#x1F3E0;</span>
        Dashboard
      </a>
      <a href="/admin/blog" class="nav-item">
        <span class="nav-icon">&#x1F4DD;</span>
        Blog Posts
      </a>
      <a href="/admin/analytics" class="nav-item">
        <span class="nav-icon">&#x1F4CA;</span>
        Analytics
      </a>
      <a href="/admin/settings" class="nav-item">
        <span class="nav-icon">&#x2699;</span>
        Settings
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <img src={data.user.avatar} alt={data.user.username} class="avatar" />
        <span class="username">{data.user.username}</span>
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

  .sidebar {
    width: 250px;
    background: #24292e;
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #3d4450;
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .username {
    font-size: 0.9rem;
    color: #e1e4e8;
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
</style>
