<svelte:head>
	<title>AutumnsGrove - Home</title>
	<meta name="description" content="A personal website for blogging, demonstrating projects, and sharing articles." />
</svelte:head>

<div class="hero">
	<h1>Welcome to AutumnsGrove</h1>
	<p class="subtitle">A space for thoughts, projects, and ideas.</p>
	<a href="/blog" class="cta-button">Read the Blog</a>
</div>

<div class="intro">
	<h2>About This Space</h2>
	<p>
		AutumnsGrove is a personal blog where I share my thoughts, projects, and articles.
		This is a place for exploration, learning, and sharing knowledge with the world.
	</p>
</div>

<style>
	.hero {
		text-align: center;
		padding: 4rem 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		border-radius: 12px;
		margin-bottom: 3rem;
		transition: background 0.3s ease;
	}

	:global(.dark) .hero {
		background: linear-gradient(135deg, #2a2a2a 0%, #1f3a1f 100%);
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
		color: #aaa;
	}

	.cta-button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: #2c5f2d;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		transition: background 0.2s, transform 0.2s;
	}

	:global(.dark) .cta-button {
		background: #5cb85f;
		color: #1a1a1a;
	}

	.cta-button:hover {
		background: #4a9d4f;
		transform: translateY(-2px);
	}

	:global(.dark) .cta-button:hover {
		background: #7cd97f;
	}

	.intro {
		max-width: 700px;
		margin: 0 auto;
	}

	.intro h2 {
		color: #333;
		margin-bottom: 1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro h2 {
		color: #e0e0e0;
	}

	.intro p {
		font-size: 1.1rem;
		color: #666;
		line-height: 1.8;
		transition: color 0.3s ease;
	}

	:global(.dark) .intro p {
		color: #aaa;
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
