<script>
	import { page } from '$app/stores';
</script>

<div class="layout">
	<header>
		<nav>
			<a href="/" class="logo">AutumnsGrove</a>
			<div class="nav-links">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
			</div>
		</nav>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<p>&copy; {new Date().getFullYear()} AutumnsGrove. Built with SvelteKit.</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		color: #333;
		background: #fafafa;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: white;
		border-bottom: 1px solid #e0e0e0;
		padding: 1rem 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	nav {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: #2c5f2d;
		text-decoration: none;
		transition: color 0.2s;
	}

	.logo:hover {
		color: #4a9d4f;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-links a {
		text-decoration: none;
		color: #666;
		font-weight: 500;
		transition: color 0.2s;
		position: relative;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: #2c5f2d;
	}

	.nav-links a.active::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		right: 0;
		height: 2px;
		background: #2c5f2d;
	}

	main {
		flex: 1;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
	}

	footer {
		background: white;
		border-top: 1px solid #e0e0e0;
		padding: 2rem;
		text-align: center;
		color: #666;
		margin-top: 4rem;
	}

	footer p {
		margin: 0;
	}

	@media (max-width: 768px) {
		header {
			padding: 1rem;
		}

		.nav-links {
			gap: 1rem;
		}

		main {
			padding: 1rem;
		}
	}
</style>
