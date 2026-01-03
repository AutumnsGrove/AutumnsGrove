<script>
  import { GlassCard, Skeleton } from '$lib/components';
  import { api } from "@autumnsgrove/groveengine/utils";
  import {
    FileText,
    Image,
    BarChart3,
    Calendar,
    Terminal,
    Settings,
    ExternalLink,
    Activity,
    Key,
    Database,
    HardDrive,
    Sparkles
  } from 'lucide-svelte';

  let { data } = $props();

  let healthStatus = $state(null);
  let loading = $state(true);
  let postCount = $state(null);

  async function fetchHealth() {
    loading = true;
    try {
      const [health, postsData] = await Promise.all([
        api.get('/api/git/health'),
        api.get('/api/posts').catch(() => null)
      ]);
      healthStatus = health;
      postCount = postsData?.posts?.length ?? null;
    } catch (error) {
      console.error('Failed to fetch health:', error);
      healthStatus = { status: 'error', error: error.message };
    }
    loading = false;
  }

  $effect(() => {
    fetchHealth();
  });
</script>

<div class="max-w-screen-xl">
  <header class="mb-8">
    <h1 class="m-0 mb-2 text-3xl text-[var(--color-foreground)] dark:text-[var(--color-foreground)] transition-colors">Dashboard</h1>
    <p class="m-0 text-[var(--color-muted-foreground)] dark:text-[var(--bark-400)] text-lg transition-colors">Welcome back, Autumn!</p>
  </header>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
    <GlassCard variant="frosted" hoverable>
      <div class="stat-card-content">
        <div class="stat-icon"><Activity size={24} /></div>
        <div class="stat-info">
          <span class="stat-label">System Status</span>
          {#if loading}
            <Skeleton class="h-6 w-20" />
          {:else if healthStatus?.status === 'healthy'}
            <span class="stat-value healthy">Healthy</span>
          {:else}
            <span class="stat-value error">Error</span>
          {/if}
        </div>
      </div>
    </GlassCard>

    <GlassCard variant="frosted" hoverable>
      <div class="stat-card-content">
        <div class="stat-icon"><Key size={24} /></div>
        <div class="stat-info">
          <span class="stat-label">GitHub Token</span>
          {#if loading}
            <Skeleton class="h-6 w-20" />
          {:else}
            <span class="stat-value" class:healthy={healthStatus?.github_token_configured} class:error={!healthStatus?.github_token_configured}>
              {healthStatus?.github_token_configured ? 'Configured' : 'Missing'}
            </span>
          {/if}
        </div>
      </div>
    </GlassCard>

    <GlassCard variant="frosted" hoverable>
      <div class="stat-card-content">
        <div class="stat-icon"><HardDrive size={24} /></div>
        <div class="stat-info">
          <span class="stat-label">KV Cache</span>
          {#if loading}
            <Skeleton class="h-6 w-20" />
          {:else}
            <span class="stat-value" class:healthy={healthStatus?.kv_configured} class:error={!healthStatus?.kv_configured}>
              {healthStatus?.kv_configured ? 'Connected' : 'Missing'}
            </span>
          {/if}
        </div>
      </div>
    </GlassCard>

    <GlassCard variant="frosted" hoverable>
      <div class="stat-card-content">
        <div class="stat-icon"><Database size={24} /></div>
        <div class="stat-info">
          <span class="stat-label">D1 Database</span>
          {#if loading}
            <Skeleton class="h-6 w-20" />
          {:else}
            <span class="stat-value" class:healthy={healthStatus?.d1_configured} class:error={!healthStatus?.d1_configured}>
              {healthStatus?.d1_configured ? 'Connected' : 'Missing'}
            </span>
          {/if}
        </div>
      </div>
    </GlassCard>

    <GlassCard variant="frosted" hoverable>
      <div class="stat-card-content">
        <div class="stat-icon"><FileText size={24} /></div>
        <div class="stat-info">
          <span class="stat-label">Blog Posts</span>
          {#if loading}
            <Skeleton class="h-6 w-16" />
          {:else}
            <span class="stat-value">{postCount ?? '—'}</span>
          {/if}
        </div>
      </div>
    </GlassCard>
  </div>

  <section class="mt-8">
    <h2 class="m-0 mb-4 text-xl text-[var(--color-foreground)] dark:text-[var(--color-foreground)] transition-colors">Quick Actions</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      <a href="/admin/blog" class="action-card">
        <FileText size={32} class="action-icon" />
        <span class="font-medium text-center">Manage Blog Posts</span>
      </a>
      <a href="/admin/images" class="action-card">
        <Image size={32} class="action-icon" />
        <span class="font-medium text-center">Upload Images</span>
      </a>
      <a href="/admin/analytics" class="action-card">
        <BarChart3 size={32} class="action-icon" />
        <span class="font-medium text-center">View Analytics</span>
      </a>
      <a href="/admin/timeline" class="action-card">
        <Calendar size={32} class="action-icon" />
        <span class="font-medium text-center">Timeline</span>
      </a>
      <a href="/admin/logs" class="action-card">
        <Terminal size={32} class="action-icon" />
        <span class="font-medium text-center">System Console</span>
      </a>
      <a href="/admin/settings" class="action-card">
        <Settings size={32} class="action-icon" />
        <span class="font-medium text-center">Settings</span>
      </a>
      <a href="/" class="action-card" target="_blank">
        <ExternalLink size={32} class="action-icon" />
        <span class="font-medium text-center">View Site</span>
      </a>
    </div>
  </section>

  <section class="mt-8 coming-soon-section">
    <div class="coming-soon-card">
      <div class="coming-soon-icon">
        <Sparkles size={32} />
      </div>
      <div class="coming-soon-content">
        <h3 class="coming-soon-title">What's New in the Grove</h3>
        <p class="coming-soon-description">
          Product updates, changelog, and new features will live here.
          This is a GroveEngine feature — coming soon!
        </p>
      </div>
    </div>
  </section>
</div>

<style>
  .stat-card-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .stat-icon {
    color: var(--grove-500);
    flex-shrink: 0;
  }
  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .stat-label {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
  }
  .stat-value {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
  }
  .stat-value.healthy {
    color: var(--grove-500);
  }
  .stat-value.error {
    color: var(--color-error);
  }
  .action-card {
    background: var(--mobile-menu-bg);
    padding: 1.5rem;
    border-radius: var(--border-radius-standard);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
    text-decoration: none;
    color: var(--color-foreground);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  .action-card :global(.action-icon) {
    color: var(--grove-500);
  }
  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  :global(.dark) .action-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  .coming-soon-section {
    margin-top: 2rem;
  }
  .coming-soon-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--grove-500) 0%, #4a9e4d 100%);
    border-radius: var(--border-radius-standard);
    color: white;
    border: 2px dashed rgba(255, 255, 255, 0.3);
  }
  .coming-soon-icon {
    flex-shrink: 0;
    opacity: 0.9;
  }
  .coming-soon-content {
    flex: 1;
  }
  .coming-soon-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }
  .coming-soon-description {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
    line-height: 1.5;
  }
</style>
