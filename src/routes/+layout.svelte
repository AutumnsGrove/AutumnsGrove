<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let { children } = $props();

	let darkMode = $state(true); // Default to dark mode
	let mobileMenuOpen = $state(false);

	// Prevent body scroll when mobile menu is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (mobileMenuOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});

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

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<div class="layout">
	<header>
		<nav>
			<!-- TITLE AREA -->
			<a href="/" class="logo">The Grove</a>

			<!-- Desktop Navigation -->
			<div class="nav-links desktop-nav">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
				<a href="/recipes" class:active={$page.url.pathname.startsWith('/recipes')}>Recipes</a>
				<a href="/dashboard" class:active={$page.url.pathname.startsWith('/dashboard')}>Dashboard</a>
			</div>

			<!-- Mobile Hamburger Button -->
			<button
				class="hamburger-btn"
				class:open={mobileMenuOpen}
				onclick={toggleMobileMenu}
				aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={mobileMenuOpen}
				aria-controls="mobile-menu"
			>
			<span class="hamburger-icon">
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</span>
			</button>
		</nav>

		<!-- Mobile Menu Overlay -->
		{#if mobileMenuOpen}
			<div class="mobile-menu-overlay" onclick={closeMobileMenu} role="presentation"></div>
		{/if}

		<!-- Mobile Navigation Menu -->
		<div
			id="mobile-menu"
			class="mobile-menu"
			class:open={mobileMenuOpen}
			role="navigation"
			aria-label="Mobile navigation"
		>
			<a href="/" class:active={$page.url.pathname === '/'} onclick={closeMobileMenu}>Home</a>
			<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')} onclick={closeMobileMenu}>Blog</a>
			<a href="/recipes" class:active={$page.url.pathname.startsWith('/recipes')} onclick={closeMobileMenu}>Recipes</a>
			<a href="/dashboard" class:active={$page.url.pathname.startsWith('/dashboard')} onclick={closeMobileMenu}>Dashboard</a>
		</div>
	</header>

	<main>
		{#key $page.url.pathname}
			<div in:fade={{ duration: 200, delay: 100 }}>
				{@render children()}
			</div>
		{/key}
	</main>

	<footer>
		<p>&copy; {new Date().getFullYear()} AutumnsGrove. <a href="https://github.com/AutumnsGrove/AutumnsGrove" target="_blank" rel="noopener noreferrer">Built</a> with SvelteKit.</p>
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
		transition: color 0.2s ease;
		position: relative;
	}

	.nav-links a::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		right: 0;
		height: 2px;
		background: #2c5f2d;
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.25s ease;
	}

	:global(.dark) .nav-links a {
		color: #aaa;
	}

	:global(.dark) .nav-links a::after {
		background: #5cb85f;
	}

	.nav-links a:hover {
		color: #2c5f2d;
	}

	.nav-links a:hover::after {
		transform: scaleX(1);
	}

	:global(.dark) .nav-links a:hover {
		color: #5cb85f;
	}

	.nav-links a.active {
		color: #2c5f2d;
	}

	.nav-links a.active::after {
		transform: scaleX(1);
	}

	:global(.dark) .nav-links a.active {
		color: #5cb85f;
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
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
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

	/* Hamburger button - hidden on desktop */
	.hamburger-btn {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #666;
		transition: color 0.2s;
	}

	:global(.dark) .hamburger-btn {
		color: #aaa;
	}

	.hamburger-btn:hover {
		color: #2c5f2d;
	}

	:global(.dark) .hamburger-btn:hover {
		color: #5cb85f;
	}

	/* Animated hamburger icon */
	.hamburger-icon {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 20px;
		height: 14px;
	}

	.hamburger-icon .bar {
		display: block;
		width: 100%;
		height: 2px;
		background: currentColor;
		border-radius: 1px;
		transition: transform 0.3s ease, opacity 0.3s ease;
		transform-origin: center;
	}

	.hamburger-btn.open .hamburger-icon .bar:nth-child(1) {
		transform: translateY(6px) rotate(45deg);
	}

	.hamburger-btn.open .hamburger-icon .bar:nth-child(2) {
		opacity: 0;
		transform: scaleX(0);
	}

	.hamburger-btn.open .hamburger-icon .bar:nth-child(3) {
		transform: translateY(-6px) rotate(-45deg);
	}

	/* Mobile menu overlay */
	.mobile-menu-overlay {
		display: none;
	}

	/* Mobile menu - hidden on desktop */
	.mobile-menu {
		display: none;
	}

	@media (max-width: 768px) {
		header {
			padding: 1rem;
		}

		main {
			padding: 1rem;
		}

		/* Hide desktop nav on mobile */
		.desktop-nav {
			display: none;
		}

		/* Show hamburger button on mobile */
		.hamburger-btn {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		/* Mobile menu overlay */
		.mobile-menu-overlay {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 99;
		}

		/* Mobile menu */
		.mobile-menu {
			display: flex;
			flex-direction: column;
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: white;
			border-bottom: 1px solid #e0e0e0;
			padding: 0;
			max-height: 0;
			overflow: hidden;
			opacity: 0;
			transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
			z-index: 100;
		}

		:global(.dark) .mobile-menu {
			background: #242424;
			border-bottom: 1px solid #333;
		}

		.mobile-menu.open {
			max-height: 300px;
			opacity: 1;
			padding: 0.5rem 0;
		}

		.mobile-menu a {
			text-decoration: none;
			color: #666;
			font-weight: 500;
			padding: 1rem 1.5rem;
			transition: background-color 0.2s, color 0.2s;
			position: relative;
		}

		:global(.dark) .mobile-menu a {
			color: #aaa;
		}

		.mobile-menu a:hover {
			background: #f5f5f5;
			color: #2c5f2d;
		}

		:global(.dark) .mobile-menu a:hover {
			background: #333;
			color: #5cb85f;
		}

		.mobile-menu a.active {
			color: #2c5f2d;
			background: #f0f9f0;
		}

		:global(.dark) .mobile-menu a.active {
			color: #5cb85f;
			background: #2a3a2a;
		}

		/* Active indicator bar for mobile */
		.mobile-menu a.active::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			width: 3px;
			background: #2c5f2d;
		}

		:global(.dark) .mobile-menu a.active::before {
			background: #5cb85f;
		}
	}
</style>
