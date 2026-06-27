<script>
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	let { data } = $props();
</script>

<svelte:head>
	<title>Autumns Grove</title>
	<meta name="description" content={data.hero.subtitle} />
</svelte:head>

<div class="home container">
	<section class="hero animate-in">
		<h1>{data.hero.title}</h1>
		<p class="subtitle">{data.hero.subtitle}</p>
		{#if data.hero.cta}
			<a href={data.hero.cta.link} class="cta">{data.hero.cta.text} <ArrowRight size={16} /></a>
		{/if}
	</section>

	{#if data.content}
		<section class="intro prose animate-in animate-in-delay-1">
			{@html data.content}
		</section>
	{/if}

	{#if data.recentPosts.length > 0}
		<section class="recent animate-in animate-in-delay-2">
			<h2>Recent posts</h2>
			<ul class="post-list">
				{#each data.recentPosts as post}
					<li>
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
	.home {
		padding-top: var(--section-gap);
		padding-bottom: var(--section-gap);
	}

	.hero {
		text-align: center;
		max-width: 650px;
		margin: 0 auto 4rem;
	}

	.subtitle {
		font-size: clamp(1.05rem, 1.5vw, 1.25rem);
		color: var(--color-muted);
		margin-top: 0.75rem;
		font-style: italic;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1.5rem;
		padding: 0.6rem 1.5rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 100px;
		font-weight: 600;
		font-size: 0.9rem;
		transition: background var(--transition);
	}

	.cta:hover {
		background: var(--color-primary-hover);
		color: var(--color-bg);
	}

	.intro {
		max-width: 680px;
		margin: 0 auto 4rem;
	}

	.recent {
		max-width: 680px;
		margin: 0 auto;
	}

	.recent h2 {
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.post-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.post-link {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		text-decoration: none;
		color: var(--color-ink);
		transition: color var(--transition);
	}

	.post-link:hover {
		color: var(--color-primary);
	}

	.post-title {
		font-weight: 600;
	}

	.post-date {
		font-size: 0.82rem;
		color: var(--color-muted);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.post-desc {
		font-size: 0.88rem;
		color: var(--color-muted);
		margin-top: 0.25rem;
		max-width: 55ch;
	}

	.view-all {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 1.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	.view-all:hover {
		color: var(--color-accent-hover);
	}
</style>
