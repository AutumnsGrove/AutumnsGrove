<script>
	import { ImageGallery } from '$lib/components';

	export let data;
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

{#each data.galleries as gallery}
	<div class="gallery-section">
		<h2>{gallery.title}</h2>
		<ImageGallery images={gallery.images} />
	</div>
{/each}

<style>
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
		color: #2c5f2d;
		transition: color 0.3s ease;
	}

	:global(.dark) h1 {
		color: #5cb85f;
	}

	.subtitle {
		font-size: 1.25rem;
		color: #555;
		margin: 0 0 2rem 0;
		transition: color 0.3s ease;
	}

	:global(.dark) .subtitle {
		color: var(--color-text-muted-dark);
	}

	.cta-button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: #2c5f2d;
		color: white;
		text-decoration: none;
		border-radius: 20px;
		font-weight: 600;
		transition: background 0.2s, transform 0.2s;
	}

	:global(.dark) .cta-button {
		background: #5cb85f;
		color: #1a1a1a;
	}

	.cta-button:hover {
		background: #4a9d4f;
		transform: translateY(-2px) scale(1.05);
		filter: brightness(1.1);
		box-shadow: 0 4px 12px rgba(44, 95, 45, 0.3);
	}

	:global(.dark) .cta-button:hover {
		background: #7cd97f;
		box-shadow: 0 4px 12px rgba(92, 184, 95, 0.4);
	}

	.intro {
		max-width: 700px;
		margin: 0 auto;
	}

	.intro :global(h2) {
		color: #333;
		margin-bottom: 1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro :global(h2) {
		color: var(--color-text-dark);
	}

	.intro :global(p) {
		font-size: 1.1rem;
		color: #666;
		line-height: 1.8;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro :global(p) {
		color: var(--color-text-muted-dark);
	}

	.gallery-section {
		margin-top: 4.5rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.gallery-section h2 {
		color: #333;
		margin-bottom: 1rem;
		text-align: center;
		transition: color 0.3s ease;
	}

	:global(.dark) .gallery-section h2 {
		color: var(--color-text-dark);
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
	}
</style>
