<script>
	import InternalsPostViewer from '$lib/components/InternalsPostViewer.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} - AutumnsGrove</title>
	<meta name="description" content={data.description} />
</svelte:head>

{#if data.hero}
	<div class="hero">
		<h1>{data.hero.title}</h1>
		<p class="subtitle">{data.hero.subtitle}</p>
		{#if data.hero.cta}
			<a href={data.hero.cta.link} class="cta-button">{data.hero.cta.text}</a>
		{/if}
	</div>
{/if}

{#if data.content}
	<div class="intro">
		{@html data.content}
	</div>
{/if}

{#if data.latestPost}
	<section class="latest-post-section">
		<h2 class="section-title">Latest Post</h2>
		<InternalsPostViewer
			post={data.latestPost}
			caption="From the blog"
		/>
	</section>
{/if}

<footer class="home-footer">
	<a href="/credits">Font Credits & Attribution</a>
</footer>

<style>
	.home-footer {
		text-align: center;
		padding: 2rem 0;
		margin-top: 3rem;
		border-top: 1px solid var(--color-border);
		transition: border-color 0.3s ease;
	}

	:global(.dark) .home-footer {
		border-color: var(--color-border-dark);
	}

	.home-footer a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}

	:global(.dark) .home-footer a {
		color: var(--color-text-subtle-dark);
	}

	.home-footer a:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}

	:global(.dark) .home-footer a:hover {
		color: var(--color-primary-light);
	}


	.hero {
		text-align: center;
		padding: 4rem 2rem;
		background: linear-gradient(145deg, #f8f9fa 0%, #e8f5e9 50%, #c8e6c9 100%);
		border-radius: 12px;
		margin-bottom: 3rem;
		transition: background 0.3s ease;
	}

	:global(.dark) .hero {
		background: linear-gradient(145deg, #252525 0%, #1a2f1a 50%, #1f3a1f 100%);
	}

	h1 {
		font-size: 3rem;
		margin: 0 0 1rem 0;
		color: var(--color-primary);
		transition: color 0.3s ease;
	}

	:global(.dark) h1 {
		color: var(--color-primary-light);
	}

	.subtitle {
		font-size: 1.25rem;
		color: var(--color-text-muted);
		margin: 0 0 2rem 0;
		transition: color 0.3s ease;
	}

	:global(.dark) .subtitle {
		color: var(--color-text-muted-dark);
	}

	.cta-button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: var(--color-primary);
		color: white;
		text-decoration: none;
		border-radius: 20px;
		font-weight: 600;
		transition: background 0.2s, transform 0.2s;
	}

	:global(.dark) .cta-button {
		background: var(--color-primary-light);
		color: var(--color-bg-secondary-dark);
	}

	.cta-button:hover {
		background: var(--color-primary-hover);
		transform: translateY(-2px) scale(1.05);
		filter: brightness(1.1);
		box-shadow: 0 4px 12px rgba(44, 95, 45, 0.3);
	}

	:global(.dark) .cta-button:hover {
		background: var(--color-primary-light-hover);
		box-shadow: 0 4px 12px rgba(92, 184, 95, 0.4);
	}

	.intro {
		max-width: 700px;
		margin: 0 auto;
	}

	.intro :global(h2) {
		color: var(--color-text);
		margin-bottom: 1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro :global(h2) {
		color: var(--color-text-dark);
	}

	.intro :global(p) {
		font-size: 1.1rem;
		color: var(--color-text-muted);
		line-height: 1.8;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro :global(p) {
		color: var(--color-text-muted-dark);
	}

	.latest-post-section {
		max-width: 700px;
		margin: 3rem auto 0;
	}

	.section-title {
		font-size: 1.5rem;
		color: var(--color-primary);
		margin-bottom: 1.25rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e0e0e0;
		transition: color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) .section-title {
		color: var(--color-primary-light);
		border-bottom-color: #333;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.hero {
			padding: 2rem 1rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.latest-post-section {
			margin: 2rem 1rem 0;
		}

		.section-title {
			font-size: 1.25rem;
		}
	}
</style>
