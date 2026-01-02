<script>
  import { GlassCard, GlassButton, Skeleton } from "$lib/components";
  import { toast } from "@autumnsgrove/groveengine/ui";
  import { api } from "@autumnsgrove/groveengine/utils";

  let clearingCache = $state(false);
  let cacheMessage = $state('');
  let healthStatus = $state(null);
  let loadingHealth = $state(true);

  // Font settings state
  let currentFont = $state('alagard');
  let savingFont = $state(false);
  let fontMessage = $state('');
  let loadingFont = $state(true);

  // AI Writing Assistant settings
  let aiEnabled = $state(false);
  let aiModel = $state('haiku');
  let savingAI = $state(false);
  let aiMessage = $state('');
  let loadingAI = $state(true);
  let aiUsage = $state({ requests: 0, tokens: 0, cost: 0 });

  async function fetchHealth() {
    loadingHealth = true;
    try {
      healthStatus = await api.get('/api/git/health');
    } catch (error) {
      toast.error('Failed to check system health');
      console.error('Failed to fetch health:', error);
      healthStatus = { status: 'error', error: error.message };
    }
    loadingHealth = false;
  }

  async function clearCache() {
    if (!confirm('Are you sure you want to clear the cache? This will cause the next requests to be slower while data is refetched.')) {
      return;
    }

    clearingCache = true;
    cacheMessage = '';

    try {
      await api.post('/api/admin/cache/clear', {});
      cacheMessage = 'Cache cleared successfully!';
    } catch (error) {
      cacheMessage = 'Error: ' + error.message;
    }

    clearingCache = false;
  }

  // Fetch current font setting
  async function fetchCurrentFont() {
    loadingFont = true;
    try {
      const data = await api.get('/api/settings');
      currentFont = data.font_family || 'alagard';
    } catch (error) {
      toast.error('Failed to load font settings');
      console.error('Failed to fetch font setting:', error);
      currentFont = 'alagard';
    }
    loadingFont = false;
  }

  // Save font setting
  async function saveFont() {
    savingFont = true;
    fontMessage = '';

    try {
      await api.put('/api/admin/settings', {
        setting_key: 'font_family',
        setting_value: currentFont
      });

      fontMessage = 'Font setting saved! Refresh to see changes site-wide.';
      // Apply immediately for preview
      const fontMap = {
        alagard: "'Alagard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        cozette: "'Cozette', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        opendyslexic: "'OpenDyslexic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        lexend: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        cormorant: "'Cormorant', Georgia, 'Times New Roman', serif",
        quicksand: "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        ibmplexmono: "'IBM Plex Mono', 'Fira Code', 'Source Code Pro', monospace",
        bodonimoda: "'Bodoni Moda', 'Didot', 'Bodoni MT', Georgia, serif"
      };
      document.documentElement.style.setProperty('--font-family-main', fontMap[currentFont]);
    } catch (error) {
      fontMessage = 'Error: ' + error.message;
    }

    savingFont = false;
  }

  // Fetch AI assistant settings
  async function fetchAISettings() {
    loadingAI = true;
    try {
      const data = await api.get('/api/settings');
      aiEnabled = data.ai_assistant_enabled === 'true';
      aiModel = data.ai_model || 'haiku';

      // Also fetch usage stats
      try {
        const usage = await api.get('/api/ai/writing-assist');
        aiUsage = {
          requests: usage.requests || 0,
          tokens: usage.tokens || 0,
          cost: usage.cost || 0
        };
      } catch (e) {
        // Usage stats are optional, don't fail if unavailable
        console.warn('Could not fetch AI usage stats:', e);
      }
    } catch (error) {
      console.error('Failed to fetch AI settings:', error);
      aiEnabled = false;
      aiModel = 'haiku';
    }
    loadingAI = false;
  }

  // Save AI setting
  async function saveAISetting(key, value) {
    savingAI = true;
    aiMessage = '';

    try {
      await api.put('/api/admin/settings', {
        setting_key: key,
        setting_value: value
      });

      aiMessage = 'Setting saved!';
      setTimeout(() => aiMessage = '', 3000);
    } catch (error) {
      aiMessage = 'Error: ' + error.message;
    }

    savingAI = false;
  }

  // Toggle AI enabled state
  async function toggleAIEnabled() {
    aiEnabled = !aiEnabled;
    await saveAISetting('ai_assistant_enabled', aiEnabled.toString());
  }

  // Change AI model
  async function changeAIModel(event) {
    aiModel = event.target.value;
    await saveAISetting('ai_model', aiModel);
  }

  $effect(() => {
    fetchHealth();
    fetchCurrentFont();
    fetchAISettings();
  });
</script>

<div class="settings">
  <header class="page-header">
    <h1>Settings</h1>
    <p class="subtitle">Manage site configuration and maintenance</p>
  </header>

  <GlassCard title="Health Check" variant="default">
    {#if loadingHealth}
      <div class="health-grid">
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
      </div>
    {:else}
      <div class="health-grid">
        <div class="health-item">
          <span class="health-label">Overall Status</span>
          <span class="health-value" class:healthy={healthStatus?.status === 'healthy'} class:error={healthStatus?.status !== 'healthy'}>
            {healthStatus?.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
          </span>
        </div>

        <div class="health-item">
          <span class="health-label">GitHub Token</span>
          <span class="health-value" class:healthy={healthStatus?.github_token_configured} class:error={!healthStatus?.github_token_configured}>
            {healthStatus?.github_token_configured ? 'Configured' : 'Missing'}
          </span>
        </div>

        <div class="health-item">
          <span class="health-label">KV Cache</span>
          <span class="health-value" class:healthy={healthStatus?.kv_configured} class:error={!healthStatus?.kv_configured}>
            {healthStatus?.kv_configured ? 'Connected' : 'Not Configured'}
          </span>
        </div>

        <div class="health-item">
          <span class="health-label">D1 Database</span>
          <span class="health-value" class:healthy={healthStatus?.d1_configured} class:error={!healthStatus?.d1_configured}>
            {healthStatus?.d1_configured ? 'Connected' : 'Not Configured'}
          </span>
        </div>

        {#if healthStatus?.timestamp}
          <div class="health-item full-width">
            <span class="health-label">Last Check</span>
            <span class="health-value">{new Date(healthStatus.timestamp).toLocaleString()}</span>
          </div>
        {/if}
      </div>
    {/if}

    <GlassButton onclick={fetchHealth} variant="secondary" disabled={loadingHealth}>
      {loadingHealth ? 'Checking...' : 'Refresh Status'}
    </GlassButton>
  </GlassCard>

  <GlassCard title="Font Selection" variant="default">
    <p class="section-description">
      Choose the font family used across the entire site. Changes take effect immediately.
    </p>

    {#if loadingFont}
      <Skeleton class="h-64 w-full" />
    {:else}
      <div class="font-selector">
        <label class="font-option" class:selected={currentFont === 'alagard'}>
          <input
            type="radio"
            name="font"
            value="alagard"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Alagard', sans-serif;">Alagard</span>
            <span class="font-description">Medieval pixel font (default)</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'cozette'}>
          <input
            type="radio"
            name="font"
            value="cozette"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Cozette', sans-serif;">Cozette</span>
            <span class="font-description">Bitmap programming font</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'atkinson'}>
          <input
            type="radio"
            name="font"
            value="atkinson"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Atkinson Hyperlegible', sans-serif;">Atkinson Hyperlegible</span>
            <span class="font-description">Accessibility font for low vision</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'opendyslexic'}>
          <input
            type="radio"
            name="font"
            value="opendyslexic"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'OpenDyslexic', sans-serif;">OpenDyslexic</span>
            <span class="font-description">Accessibility font for dyslexia</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'lexend'}>
          <input
            type="radio"
            name="font"
            value="lexend"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Lexend', sans-serif;">Lexend</span>
            <span class="font-description">Modern accessibility font for reading fluency</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'cormorant'}>
          <input
            type="radio"
            name="font"
            value="cormorant"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Cormorant', serif;">Cormorant</span>
            <span class="font-description">Elegant display serif for fantasy aesthetic</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'quicksand'}>
          <input
            type="radio"
            name="font"
            value="quicksand"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Quicksand', sans-serif;">Quicksand</span>
            <span class="font-description">Rounded, friendly geometric sans-serif</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'ibmplexmono'}>
          <input
            type="radio"
            name="font"
            value="ibmplexmono"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'IBM Plex Mono', monospace;">IBM Plex Mono</span>
            <span class="font-description">Clean monospace for code and technical writing</span>
          </div>
        </label>

        <label class="font-option" class:selected={currentFont === 'bodonimoda'}>
          <input
            type="radio"
            name="font"
            value="bodonimoda"
            bind:group={currentFont}
          />
          <div class="font-info">
            <span class="font-name" style="font-family: 'Bodoni Moda', serif;">Bodoni Moda</span>
            <span class="font-description">High-contrast display serif with dramatic elegance</span>
          </div>
        </label>
      </div>

      {#if fontMessage}
        <div class="message" class:success={fontMessage.includes('saved')} class:error={!fontMessage.includes('saved')}>
          {fontMessage}
        </div>
      {/if}

      <div class="button-row">
        <GlassButton onclick={saveFont} variant="primary" disabled={savingFont}>
          {savingFont ? 'Saving...' : 'Save Font Setting'}
        </GlassButton>
      </div>

      <p class="note">
        See <a href="/credits">font credits and licenses</a> for attribution.
      </p>
    {/if}
  </GlassCard>

  <GlassCard title="AI Writing Assistant" variant="accent">
    <p class="section-description">
      Get grammar, tone, and readability feedback on your writing. Powered by Claude AI.
    </p>

    {#if loadingAI}
      <Skeleton class="h-24 w-full" />
    {:else}
      <div class="ai-toggle">
        <label class="toggle-option">
          <input
            type="checkbox"
            checked={aiEnabled}
            onchange={toggleAIEnabled}
            disabled={savingAI}
          />
          <div class="toggle-info">
            <span class="toggle-label">Enable AI Writing Assistant</span>
            <span class="toggle-desc">Show the assistant panel in the markdown editor</span>
          </div>
        </label>
      </div>

      {#if aiEnabled}
        <div class="ai-model-selector">
          <label for="ai-model">Preferred Model</label>
          <select id="ai-model" value={aiModel} onchange={changeAIModel} disabled={savingAI}>
            <option value="haiku">Claude Haiku (faster, cheaper)</option>
            <option value="sonnet">Claude Sonnet (more thorough)</option>
          </select>
        </div>

        <div class="ai-info-box">
          <pre class="ai-vibe">
    .  *  .    .  *
  .    _    .      .
     /   \\    *  .
    / ~ ~ \\  .    .
   /       \\______
  ~~~~~~~~~~~~~~~~~~~
    a helper, not a writer</pre>

          <div class="ai-details">
            <p>The AI Writing Assistant helps you polish your writing by:</p>
            <ul>
              <li>Checking grammar and spelling</li>
              <li>Analyzing tone and voice</li>
              <li>Measuring readability</li>
            </ul>
            <p class="ai-note">
              Your content is sent to Anthropic for analysis.
              The assistant will never generate or expand content.
            </p>
          </div>
        </div>

        {#if aiUsage.requests > 0}
          <div class="ai-usage-stats">
            <h4>Usage (last 30 days)</h4>
            <div class="usage-grid">
              <div class="usage-stat">
                <span class="usage-value">{aiUsage.requests}</span>
                <span class="usage-label">requests</span>
              </div>
              <div class="usage-stat">
                <span class="usage-value">{aiUsage.tokens.toLocaleString()}</span>
                <span class="usage-label">tokens</span>
              </div>
              <div class="usage-stat">
                <span class="usage-value">${aiUsage.cost.toFixed(4)}</span>
                <span class="usage-label">estimated cost</span>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      {#if aiMessage}
        <div class="message" class:success={aiMessage.includes('saved')} class:error={!aiMessage.includes('saved')}>
          {aiMessage}
        </div>
      {/if}
    {/if}
  </GlassCard>

  <GlassCard title="Cache Management" variant="default">

    <p class="section-description">
      The site uses KV for caching API responses. Clearing the cache will cause
      data to be refetched from the source on the next request.
    </p>

    {#if cacheMessage}
      <div class="message" class:success={cacheMessage.includes('success')} class:error={!cacheMessage.includes('success')}>
        {cacheMessage}
      </div>
    {/if}

    <GlassButton onclick={clearCache} variant="danger" disabled={clearingCache}>
      {clearingCache ? 'Clearing...' : 'Clear All Cache'}
    </GlassButton>

    <p class="note">
      Note: The cache clear endpoint needs to be implemented at <code>/api/admin/cache/clear</code>
    </p>
  </GlassCard>

  <GlassCard title="Environment" variant="default">
    <div class="env-info">
      <div class="env-item">
        <span class="env-label">Cache TTL</span>
        <span class="env-value">1 hour (3600 seconds)</span>
      </div>
      <div class="env-item">
        <span class="env-label">AI Cache TTL</span>
        <span class="env-value">6 hours (21600 seconds)</span>
      </div>
    </div>
  </GlassCard>

  <GlassCard title="Links" variant="default">
    <ul class="links-list">
      <li>
        <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a>
      </li>
      <li>
        <a href="https://github.com/AutumnsGrove/AutumnsGrove" target="_blank">GitHub Repository</a>
      </li>
      <li>
        <a href="https://github.com/AutumnsGrove/AutumnsGrove/actions" target="_blank">GitHub Actions</a>
      </li>
    </ul>
  </GlassCard>
</div>

<style>
  .settings {
    max-width: 800px;
  }
  .page-header {
    margin-bottom: 2rem;
  }
  .page-header h1 {
    margin: 0 0 0.25rem 0;
    font-size: 2rem;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .subtitle {
    margin: 0;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .settings-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: background-color 0.3s ease;
  }
  .settings-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .section-description {
    margin: 0 0 1rem 0;
    color: var(--color-muted-foreground);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .health-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .health-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .health-item.full-width {
    grid-column: 1 / -1;
  }
  .health-label {
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .health-value {
    font-weight: 600;
  }
  .health-value.healthy {
    color: var(--grove-500);
  }
  .health-value.error {
    color: var(--color-error);
  }
  .health-value.loading {
    color: var(--bark-500);
    transition: color 0.3s ease;
  }
  .message {
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-button);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  .message.success {
    background: #dcffe4;
    color: var(--grove-700);
  }
  .message.error {
    background: #ffeef0;
    color: var(--color-error);
  }
  .note {
    margin: 1rem 0 0 0;
    font-size: 0.8rem;
    color: var(--bark-500);
    transition: color 0.3s ease;
  }
  .note code {
    background: var(--cream-200);
    padding: 0.125rem 0.25rem;
    border-radius: var(--border-radius-small);
    font-size: 0.85em;
    transition: background-color 0.3s ease;
  }
  .env-info {
    display: grid;
    gap: 0.75rem;
  }
  .env-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .env-item:last-child {
    border-bottom: none;
  }
  .env-label {
    color: var(--color-muted-foreground);
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .env-value {
    font-weight: 500;
    font-size: 0.9rem;
  }
  .links-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .links-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }
  .links-list li:last-child {
    border-bottom: none;
  }
  .links-list a {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;
  }
  .links-list a:hover {
    text-decoration: underline;
  }
  /* Font selector styles */
  .font-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .font-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }
  .font-option:hover {
    border-color: var(--color-primary);
  }
  .font-option.selected {
    border-color: var(--color-primary);
    background: rgba(44, 95, 45, 0.05);
  }
  :global(.dark) .font-option.selected {
    border-color: var(--color-primary-light);
    background: rgba(92, 184, 95, 0.1);
  }
  .font-option input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary);
  }
  .font-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .font-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-foreground);
    transition: color 0.3s ease;
  }
  .font-description {
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    transition: color 0.3s ease;
  }
  .button-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .loading-text {
    color: var(--color-muted-foreground);
    font-style: italic;
  }
  /* AI Writing Assistant styles */
  .ai-toggle {
    margin-bottom: 1rem;
  }
  .toggle-option {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-standard);
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }
  .toggle-option:hover {
    border-color: var(--color-primary);
  }
  .toggle-option input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: var(--color-primary);
    margin-top: 0.1rem;
  }
  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .toggle-label {
    font-weight: 600;
    color: var(--color-foreground);
  }
  .toggle-desc {
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
  }
  .ai-model-selector {
    margin-bottom: 1rem;
  }
  .ai-model-selector label {
    display: block;
    font-size: 0.9rem;
    color: var(--color-muted-foreground);
    margin-bottom: 0.5rem;
  }
  .ai-model-selector select {
    width: 100%;
    padding: 0.5rem;
    background: var(--cream-200);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-button);
    color: var(--color-foreground);
    font-size: 0.9rem;
  }
  .ai-info-box {
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--cream-200);
    border-radius: var(--border-radius-standard);
    margin-bottom: 1rem;
  }
  .ai-vibe {
    font-family: monospace;
    font-size: 0.55rem;
    line-height: 1.2;
    color: var(--color-primary);
    opacity: 0.8;
    margin: 0;
    white-space: pre;
    flex-shrink: 0;
  }
  .ai-details {
    flex: 1;
    font-size: 0.85rem;
  }
  .ai-details p {
    margin: 0 0 0.5rem 0;
    color: var(--color-muted-foreground);
  }
  .ai-details ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.25rem;
  }
  .ai-details li {
    color: var(--color-foreground);
    margin-bottom: 0.25rem;
  }
  .ai-note {
    font-size: 0.8rem;
    font-style: italic;
    opacity: 0.8;
  }
  .ai-usage-stats {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--cream-200);
    border-radius: var(--border-radius-standard);
    border: 1px solid var(--color-border);
  }
  .ai-usage-stats h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.85rem;
    color: var(--color-muted-foreground);
    text-transform: lowercase;
  }
  .usage-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .usage-stat {
    text-align: center;
  }
  .usage-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary);
  }
  .usage-label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-muted-foreground);
    margin-top: 0.25rem;
  }
  @media (max-width: 600px) {
    .ai-info-box {
      flex-direction: column;
    }
    .ai-vibe {
      text-align: center;
    }
    .usage-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }
</style>
