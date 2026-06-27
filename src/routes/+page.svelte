<script>
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import FloatingMotes from '$lib/components/FloatingMotes.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Autumns Grove</title>
	<meta name="description" content={data.hero.subtitle} />
</svelte:head>

<section class="hero-wrap grain ambient-bg">
	<FloatingMotes />
	<div class="container hero">
		<p class="kicker animate-in">Welcome</p>
		<h1 class="hero-title animate-in animate-in-delay-1">{data.hero.title}</h1>
		<p class="subtitle animate-in animate-in-delay-2">{data.hero.subtitle}</p>
		{#if data.hero.cta}
			<a href={data.hero.cta.link} class="cta animate-in animate-in-delay-3">{data.hero.cta.text} <ArrowRight size={16} /></a>
		{/if}
	</div>
</section>

<div class="home container">
	{#if data.content}
		<section class="intro prose animate-in animate-in-delay-2">
			{@html data.content}
		</section>
	{/if}

	{#if data.recentPosts.length > 0}
		<section class="recent scroll-reveal">
			<h2 class="section-heading">Recent writing</h2>
			<hr class="divider" />
			<ul class="post-list">
				{#each data.recentPosts as post, i}
					<li class="scroll-reveal" style="--reveal-delay: {i * 60}ms">
						<a href="/blog/{post.slug}" class="post-link">
							<span class="post-title">{post.title}</span>
							<span class="post-date">{post.date}</span>
						</a>
						{#if post.description}
							<p class="post-desc">{post.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
			<a href="/blog" class="view-all">All posts <ArrowRight size={14} /></a>
		</section>
	{/if}
</div>

<style>
	.hero-wrap {
		padding: clamp(4rem, 10vw, 8rem) 0 clamp(3rem, 8vw, 6rem);
		overflow: hidden;
	}

	.hero {
		text-align: left;
		max-width: var(--max-width);
	}

	.hero-title {
		max-width: 14ch;
	}

	.subtitle {
		font-size: clamp(1.1rem, 1.8vw, 1.35rem);
		color: var(--color-muted);
		margin-top: 1rem;
		font-style: italic;
		font-family: var(--font-body);
		font-weight: 400;
		max-width: 38ch;
		line-height: 1.5;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		padding: 0.75rem 2rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 100px;
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.02em;
		transition: background var(--transition), transform var(--transition);
	}

	.cta:hover {
		background: var(--color-primary-hover);
		color: var(--color-bg);
		transform: translateX(4px);
	}

	.home {
		padding-top: var(--section-gap);
		padding-bottom: var(--section-gap);
	}

	.intro {
		max-width: 680px;
		margin-bottom: clamp(3rem, 6vw, 5rem);
	}

	.recent {
		max-width: 680px;
	}

	.section-heading {
		margin-bottom: 1rem;
	}

	.recent .divider {
		margin-bottom: 1.75rem;
	}

	.post-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.post-link {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		text-decoration: none;
		color: var(--color-ink);
		transition: color var(--transition), padding-left var(--transition);
	}

	.post-link:hover {
		color: var(--color-primary);
		padding-left: 0.5rem;
	}

	.post-title {
		font-weight: 600;
		font-size: 1.05rem;
	}

	.post-date {
		font-size: 0.8rem;
		color: var(--color-muted);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.post-desc {
		font-size: 0.88rem;
		color: var(--color-muted);
		margin-top: 0.3rem;
		max-width: 55ch;
		padding-left: 0;
		transition: padding-left var(--transition);
	}

	.view-all {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 2rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		transition: color var(--transition), gap var(--transition);
	}

	.view-all:hover {
		color: var(--color-accent-hover);
		gap: 0.65rem;
	}
</style>
