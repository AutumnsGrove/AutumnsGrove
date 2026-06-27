<script>
	import { page } from '$app/stores';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>{$page.status} - Autumns Grove</title>
</svelte:head>

<div class="error-page container">
	<div class="error-content animate-in">
		<p class="error-code">{$page.status}</p>
		<h1>{$page.error?.message || 'Something went wrong'}</h1>
		<p class="description">The page you're looking for doesn't exist, or something unexpected happened.</p>
		<a href="/" class="home-link"><ArrowLeft size={14} /> Back home</a>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.error-content {
		text-align: center;
		max-width: 480px;
	}

	.error-code {
		font-family: var(--font-heading);
		font-size: clamp(5rem, 12vw, 8rem);
		font-weight: 700;
		color: var(--color-border);
		line-height: 1;
		margin: 0 0 0.5rem;
	}

	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.75rem;
	}

	.description {
		color: var(--color-muted);
		margin: 0 0 2rem;
	}

	.home-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.6rem 1.5rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 100px;
		font-weight: 600;
		font-size: 0.9rem;
		transition: background var(--transition);
	}

	.home-link:hover {
		background: var(--color-primary-hover);
		color: var(--color-bg);
	}
</style>
