<script>
  import { onMount } from 'svelte';

  let error = $state('');
  let errorMessage = $state('');

  const errorMessages = {
    'unauthorized': 'You are not authorized to access this admin panel.',
    'token_failed': 'Failed to authenticate with GitHub.',
    'no_code': 'No authorization code received.',
    'server_error': 'Server error. Please try again.'
  };

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    error = params.get('error') || '';
    errorMessage = errorMessages[error] || (error ? 'An error occurred.' : '');
  });
</script>

<svelte:head>
  <title>Admin Login - Autumns Grove</title>
</svelte:head>

<div class="login-container">
  <div class="login-box">
    <h1>Admin Panel</h1>
    <p class="subtitle">Sign in to access the admin dashboard</p>

    {#if errorMessage}
      <div class="error">
        {errorMessage}
      </div>
    {/if}

    <a href="/auth/github" class="login-btn">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign in with GitHub
    </a>

    <p class="footer-text">
      Only authorized administrators can access this panel.
    </p>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f5f5;
    padding: 1rem;
  }

  .login-box {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    color: #24292e;
  }

  .subtitle {
    color: #586069;
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
  }

  .error {
    background: #ffeef0;
    border: 1px solid #f97583;
    color: #d73a49;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .login-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #24292e;
    color: white;
    padding: 0.875rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    width: 100%;
    transition: background 0.2s;
  }

  .login-btn:hover {
    background: #2f363d;
  }

  .footer-text {
    margin: 1.5rem 0 0 0;
    color: #6a737d;
    font-size: 0.8rem;
  }
</style>
