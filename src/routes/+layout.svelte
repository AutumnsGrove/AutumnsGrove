<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let darkMode = $state(true); // Default to dark mode

	onMount(() => {
		// Check localStorage or system preference
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'light') {
			darkMode = false;
		} else if (savedTheme === 'dark') {
			darkMode = true;
		} else {
			// Default to dark mode (no system preference check)
			darkMode = true;
		}
		applyTheme();
	});

	function toggleTheme() {
		darkMode = !darkMode;
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
		applyTheme();
	}

	function applyTheme() {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<div class="layout">
	<header>
		<nav>
			<a href="/" class="logo">AutumnsGrove</a>
			<div class="nav-links">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
			</div>
			<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle dark mode">
				{#if darkMode}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="5"></circle>
						<line x1="12" y1="1" x2="12" y2="3"></line>
						<line x1="12" y1="21" x2="12" y2="23"></line>
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
						<line x1="1" y1="12" x2="3" y2="12"></line>
						<line x1="21" y1="12" x2="23" y2="12"></line>
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
					</svg>
				{/if}
			</button>
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
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark body) {
		color: #e0e0e0;
		background: #1a1a1a;
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
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) header {
		background: #242424;
		border-bottom: 1px solid #333;
	}

	nav {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: #2c5f2d;
		text-decoration: none;
		transition: color 0.2s;
	}

	:global(.dark) .logo {
		color: #5cb85f;
	}

	.logo:hover {
		color: #4a9d4f;
	}

	:global(.dark) .logo:hover {
		color: #7cd97f;
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

	:global(.dark) .nav-links a {
		color: #aaa;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: #2c5f2d;
	}

	:global(.dark) .nav-links a:hover,
	:global(.dark) .nav-links a.active {
		color: #5cb85f;
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

	:global(.dark) .nav-links a.active::after {
		background: #5cb85f;
	}

	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		transition: color 0.2s, transform 0.2s;
		border-radius: 4px;
	}

	:global(.dark) .theme-toggle {
		color: #aaa;
	}

	.theme-toggle:hover {
		color: #2c5f2d;
		transform: scale(1.1);
	}

	:global(.dark) .theme-toggle:hover {
		color: #5cb85f;
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
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) footer {
		background: #242424;
		border-top: 1px solid #333;
		color: #aaa;
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
