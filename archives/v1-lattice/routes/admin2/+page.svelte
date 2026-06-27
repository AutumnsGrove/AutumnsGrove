<script>
  // Minimal admin test page - no external dependencies
  let { data } = $props();
</script>

<svelte:head>
  <title>Admin2 Test - Autumns Grove</title>
</svelte:head>

<div class="container">
  <h1>Admin2 Test Page</h1>

  <div class="status-box">
    <h2>Authentication Status</h2>
    <p><strong>Status:</strong> Authenticated</p>
    {#if data?.user}
      <p><strong>Email:</strong> {data.user.email}</p>
    {:else}
      <p><strong>User Data:</strong> Missing (this shouldn't happen)</p>
    {/if}
  </div>

  <div class="debug-box">
    <h2>Debug Info</h2>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>

  <div class="links">
    <a href="/admin">Try Regular Admin</a>
    <a href="/auth/logout">Logout</a>
    <a href="/">Home</a>
  </div>
</div>

<style>
  .container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }
  h1 {
    color: #2d5016;
    border-bottom: 2px solid #2d5016;
    padding-bottom: 0.5rem;
  }
  .status-box, .debug-box {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }
  .status-box h2, .debug-box h2 {
    margin-top: 0;
    font-size: 1.1rem;
    color: #333;
  }
  pre {
    background: #1a1a1a;
    color: #0f0;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85rem;
  }
  .links {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  .links a {
    padding: 0.5rem 1rem;
    background: #2d5016;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  .links a:hover {
    background: #3d6a1e;
  }
</style>
