<script>
  // Minimal layout - no groveengine dependencies
  let { data, children } = $props();
</script>

<div class="admin2-layout">
  <header>
    <span>Admin2 Test</span>
    {#if data?.user}
      <span class="user-email">{data.user.email}</span>
    {/if}
  </header>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .admin2-layout {
    min-height: 100vh;
    background: #fafafa;
  }
  header {
    background: #2d5016;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .user-email {
    font-size: 0.85rem;
    opacity: 0.9;
  }
  main {
    padding: 1rem;
  }
</style>
