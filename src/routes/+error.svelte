<script>
	import { page } from '$app/stores';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>{$page.status} - Autumns Grove</title>
</svelte:head>

<div class="error-page container">
	<p class="error-watermark" aria-hidden="true">{$page.status}</p>
	<div class="error-content animate-in">
		<p class="kicker animate-in">Lost in the grove</p>
		<h1 class="animate-in animate-in-delay-1">{$page.error?.message || 'Something went wrong'}</h1>
		<p class="description animate-in animate-in-delay-2">You wandered off the path. This page doesn't exist, or something unexpected happened along the way.</p>
		<a href="/" class="home-link animate-in animate-in-delay-3"><ArrowLeft size={14} /> Back home</a>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 65vh;
		position: relative;
		overflow: hidden;
	}

	.error-watermark {
		position: absolute;
		font-family: var(--font-heading);
		font-size: clamp(12rem, 30vw, 22rem);
		font-weight: 700;
		color: var(--color-border);
		line-height: 1;
		margin: 0;
		opacity: 0.35;
		user-select: none;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		letter-spacing: -0.04em;
	}

	.error-content {
		text-align: center;
		max-width: 480px;
		position: relative;
		z-index: 2;
	}

	h1 {
		font-size: clamp(1.5rem, 3vw, 2rem);
		margin: 0 0 1rem;
	}

	.description {
		color: var(--color-muted);
		margin: 0 0 2.5rem;
		line-height: 1.6;
	}

	.home-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.75rem 2rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 100px;
		font-weight: 700;
		font-size: 0.9rem;
		transition: background var(--transition), transform var(--transition);
	}

	.home-link:hover {
		background: var(--color-primary-hover);
		color: var(--color-bg);
		transform: translateX(-4px);
	}
</style>
