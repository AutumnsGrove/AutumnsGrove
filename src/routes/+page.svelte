<script>
	import InternalsPostViewer from '$lib/components/custom/InternalsPostViewer.svelte';
	import { Button } from '@autumnsgrove/groveengine/ui';
	import { GlassCard } from '$lib/components';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} - AutumnsGrove</title>
	<meta name="description" content={data.description} />
</svelte:head>

{#if data.hero}
	<section class="hero-section">
		<GlassCard variant="accent" hoverable class="hero-card">
			<div class="hero-content">
				<h1>{data.hero.title}</h1>
				<p class="subtitle">{data.hero.subtitle}</p>
				{#if data.hero.cta}
					<Button href={data.hero.cta.link} variant="default" size="lg" class="cta-button">{data.hero.cta.text}</Button>
				{/if}
			</div>
		</GlassCard>
	</section>
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
	.home-footer a {
		color: var(--color-muted-foreground);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}
	.home-footer a:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.hero-section {
		max-width: 700px;
		margin: 0 auto 3rem;
	}
	:global(.hero-card) {
		text-align: center;
	}
	.hero-content {
		padding: 2rem 1rem;
	}
	h1 {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		color: var(--color-primary);
		transition: color 0.3s ease;
	}
	:global(.dark) h1 {
		color: var(--grove-500);
	}
	.subtitle {
		font-size: 1.15rem;
		color: var(--color-muted-foreground);
		margin: 0 0 1.5rem 0;
		transition: color 0.3s ease;
	}
	.cta-button {
		margin-top: 0.5rem;
	}
	.intro {
		max-width: 700px;
		margin: 0 auto;
	}
	.intro :global(h2) {
		color: var(--color-foreground);
		margin-bottom: 1rem;
		transition: color 0.3s ease;
	}
	.intro :global(p) {
		font-size: 1.1rem;
		color: var(--color-muted-foreground);
		line-height: 1.8;
		transition: color 0.3s ease;
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
		border-bottom: 2px solid var(--color-border);
		transition: color 0.3s ease, border-color 0.3s ease;
	}
	:global(.dark) .section-title {
		color: var(--color-primary-light);
		border-bottom-color: var(--color-border-strong);
	}
	@media (max-width: 768px) {
		.hero-section {
			margin: 0 1rem 2rem;
		}
		h1 {
			font-size: 1.75rem;
		}
		.hero-content {
			padding: 1.5rem 0.5rem;
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
