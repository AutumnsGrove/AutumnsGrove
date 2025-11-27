<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

	let darkMode = $state(false); // Default to light mode
	let mobileMenuOpen = $state(false);
	let mobileMenuRef = $state(null);
	let hamburgerBtnRef = $state(null);
	let searchExpanded = $state(false);
	let searchQuery = $state('');
	let searchInputRef = $state(null);

	// Check if we're on an admin page
	let isAdminPage = $derived($page.url.pathname.startsWith('/admin'));

	// Prevent body scroll when mobile menu is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (mobileMenuOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
		// Cleanup on unmount
		return () => {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		};
	});

	// Focus management for mobile menu
	$effect(() => {
		if (mobileMenuOpen && mobileMenuRef) {
			// Focus first link when menu opens
			const firstLink = mobileMenuRef.querySelector('a');
			if (firstLink) {
				firstLink.focus();
			}
		}
	});

	// Handle keyboard shortcuts
	function handleKeydown(event) {
		// Escape to close mobile menu
		if (event.key === 'Escape' && mobileMenuOpen) {
			closeMobileMenu();
			// Return focus to hamburger button
			if (hamburgerBtnRef) {
				hamburgerBtnRef.focus();
			}
		}

		// Escape to close search
		if (event.key === 'Escape' && searchExpanded) {
			searchExpanded = false;
			searchQuery = '';
		}

		// Keyboard shortcut to focus search (/ or Cmd+K)
		const isTyping = document.activeElement.tagName === 'INPUT' ||
		                 document.activeElement.tagName === 'TEXTAREA' ||
		                 document.activeElement.isContentEditable;

		if (!isTyping) {
			// Forward slash to open search
			if (event.key === '/') {
				event.preventDefault();
				if (!searchExpanded) {
					toggleSearch();
				} else if (searchInputRef) {
					searchInputRef.focus();
				}
			}

			// Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open search
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				if (!searchExpanded) {
					toggleSearch();
				} else if (searchInputRef) {
					searchInputRef.focus();
				}
			}
		}

		// Trap focus within mobile menu
		if (mobileMenuOpen && mobileMenuRef && event.key === 'Tab') {
			const focusableElements = mobileMenuRef.querySelectorAll('a');
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}
	}

	onMount(() => {
		// Sync state with pre-hydration theme (set by app.html script)
		// This ensures the Svelte state matches the DOM
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'dark') {
			darkMode = true;
		} else if (savedTheme === 'light') {
			darkMode = false;
		} else {
			// Respect system preference, default to light if no preference
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
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

	function toggleSearch() {
		searchExpanded = !searchExpanded;
		if (searchExpanded) {
			// Focus input after DOM update
			setTimeout(() => {
				if (searchInputRef) {
					searchInputRef.focus();
				}
			}, 50);
		} else {
			searchQuery = '';
		}
	}

	function handleSearchSubmit(event) {
		event.preventDefault();
		if (searchQuery.trim()) {
			goto(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
			searchExpanded = false;
			searchQuery = '';
			closeMobileMenu();
		}
	}

	function handleSearchKeydown(event) {
		if (event.key === 'Escape') {
			searchExpanded = false;
			searchQuery = '';
		}
	}

	function handleSearchBlur(event) {
		// Close search if focus moves outside the search area (but not to the search button)
		const relatedTarget = event.relatedTarget;
		// Check if focus moved to search button or stays within search form
		if (relatedTarget && (relatedTarget.classList.contains('search-btn') || relatedTarget.closest('.search-form'))) {
			return;
		}
		if (!searchQuery.trim()) {
			searchExpanded = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="layout">
	<header>
		<nav>
			<!-- TITLE AREA -->
			<a href="/" class="logo">The Grove</a>

			<!-- Desktop Navigation -->
			<div class="nav-links desktop-nav">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
				<a href="/gallery" class:active={$page.url.pathname.startsWith('/gallery')}>Gallery</a>
				<a href="/recipes" class:active={$page.url.pathname.startsWith('/recipes')}>Recipes</a>
				<a href="/about" class:active={$page.url.pathname.startsWith('/about')}>About</a>

				<!-- Search -->
				<div class="search-wrapper">
					{#if searchExpanded}
						<form class="search-form" onsubmit={handleSearchSubmit}>
							<input
								bind:this={searchInputRef}
								type="text"
								placeholder="Search posts..."
								bind:value={searchQuery}
								onkeydown={handleSearchKeydown}
								onblur={handleSearchBlur}
								class="nav-search-input"
								required
							/>
						</form>
					{/if}
					<button
						class="search-btn"
						onclick={toggleSearch}
						aria-label={searchExpanded ? 'Close search' : 'Open search'}
					>
						{#if searchExpanded}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 6 6 18"></path>
								<path d="m6 6 12 12"></path>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.3-4.3"></path>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Mobile Hamburger Button -->
			<button
				bind:this={hamburgerBtnRef}
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
			bind:this={mobileMenuRef}
			id="mobile-menu"
			class="mobile-menu"
			class:open={mobileMenuOpen}
			role="navigation"
			aria-label="Mobile navigation"
		>
			<form class="mobile-search-form" onsubmit={handleSearchSubmit}>
				<input
					type="text"
					placeholder="Search posts..."
					bind:value={searchQuery}
					class="mobile-search-input"
					required
				/>
				<button type="submit" class="mobile-search-btn" aria-label="Search">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.3-4.3"></path>
					</svg>
				</button>
			</form>
			<a href="/" class:active={$page.url.pathname === '/'} onclick={closeMobileMenu}>Home</a>
			<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')} onclick={closeMobileMenu}>Blog</a>
			<a href="/gallery" class:active={$page.url.pathname.startsWith('/gallery')} onclick={closeMobileMenu}>Gallery</a>
			<a href="/recipes" class:active={$page.url.pathname.startsWith('/recipes')} onclick={closeMobileMenu}>Recipes</a>
			<a href="/about" class:active={$page.url.pathname.startsWith('/about')} onclick={closeMobileMenu}>About</a>
		</div>
	</header>

	<main>
		{#key $page.url.pathname}
			<div in:fade={{ duration: 200 }}>
				{@render children()}
			</div>
		{/key}
	</main>

	<footer class:admin-page-footer={isAdminPage}>
		<p>&copy; {new Date().getFullYear()} AutumnsGrove. <a href="https://github.com/AutumnsGrove/AutumnsGrove" target="_blank" rel="noopener noreferrer">Built</a> with SvelteKit.</p>
		<div class="footer-actions">
			{#if data?.user}
				<span class="logged-in-indicator" title="Logged in">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				</span>
				<a href="/admin" class="admin-link" aria-label="Admin Panel">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
						<circle cx="12" cy="12" r="3"></circle>
					</svg>
				</a>
			{/if}
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
		</div>
	</footer>
</div>

<style>
	/* CSS Custom Properties for theming */
	:global(:root) {
		/* Primary colors */
		--color-primary: #2c5f2d;
		--color-primary-hover: #4a9d4f;
		--color-primary-light: #5cb85f;
		--color-primary-light-hover: #7cd97f;

		/* Text colors */
		--color-text: #333;
		--color-text-muted: #666;
		--color-text-subtle: #888;

		/* Background colors */
		--color-bg-secondary: #f5f5f5;
		--color-border: #e0e0e0;

		/* Dark mode color values */
		--color-text-dark: #f0f0f0;
		--color-text-muted-dark: #d0d0d0;
		--color-text-subtle-dark: #b8b8b8;
		--color-bg-secondary-dark: #1a1a1a;
		--color-bg-tertiary-dark: #2a2a2a;
		--color-border-dark: #333;

		/* Danger/Error colors */
		--color-danger: #d73a49;
		--color-danger-hover: #cb2431;

		/* Component-specific */
		--mobile-menu-bg: white;
		--mobile-menu-border: #e0e0e0;
		--tag-bg: #7c4dab;
		--tag-bg-hover: #6a3d9a;

		/* Border radius standardization */
		--border-radius-standard: 8px;
		--border-radius-small: 4px;
		--border-radius-button: 6px;
	}

	:global(.dark) {
		--mobile-menu-bg: #242424;
		--mobile-menu-border: #333;
		--tag-bg: #6a3d9a;
		--tag-bg-hover: #7c4dab;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		color: #333;
		background: #fafafa;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark body) {
		color: var(--color-text-dark);
		background: #1a1a1a;
	}

	/* Global tag styles - shared across all pages */
	:global(.tag) {
		background: var(--tag-bg);
		color: white;
		padding: 0.4rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		border: none;
		text-decoration: none;
		cursor: pointer;
		display: inline-block;
		transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
	}

	:global(.tag:hover) {
		background: var(--tag-bg-hover);
		transform: scale(1.05);
		color: white;
	}

	:global(.tag:visited) {
		color: white;
	}

	:global(.tags) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
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
		position: relative;
		z-index: 101;
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
		color: var(--color-text-muted-dark);
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

	/* Search styles */
	.search-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.search-form {
		display: flex;
		align-items: center;
	}

	.nav-search-input {
		padding: 0.4rem 0.75rem;
		font-size: 0.9rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: white;
		color: #333;
		width: 160px;
		transition: border-color 0.2s ease, background-color 0.3s ease, color 0.3s ease, width 0.3s ease;
	}

	:global(.dark) .nav-search-input {
		background: #1a1a1a;
		border-color: #444;
		color: var(--color-text-dark);
	}

	.nav-search-input:focus {
		outline: none;
		border-color: #2c5f2d;
		width: 200px;
	}

	:global(.dark) .nav-search-input:focus {
		border-color: #5cb85f;
	}

	.nav-search-input::placeholder {
		color: #999;
	}

	:global(.dark) .nav-search-input::placeholder {
		color: #777;
	}

	.search-btn {
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

	:global(.dark) .search-btn {
		color: var(--color-text-muted-dark);
	}

	.search-btn:hover {
		color: #2c5f2d;
		transform: scale(1.1);
	}

	:global(.dark) .search-btn:hover {
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
		color: var(--color-text-muted-dark);
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
		position: relative;
		z-index: 1003;
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) footer {
		background: #242424;
		border-top: 1px solid var(--color-border-dark);
		color: var(--color-text-muted-dark);
	}

	/* Footer margin on admin pages to avoid sidebar overlap */
	footer.admin-page-footer {
		margin-left: calc(250px + 0.75rem); /* Sidebar width + left margin */
	}

	@media (max-width: 768px) {
		footer.admin-page-footer {
			margin-left: 0;
		}
	}

	footer p {
		margin: 0;
	}

	.footer-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.admin-link {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		color: #666;
		text-decoration: none;
		border-radius: 4px;
		transition: color 0.2s, transform 0.2s;
	}

	:global(.dark) .admin-link {
		color: var(--color-text-muted-dark);
	}

	.admin-link:hover {
		color: #2c5f2d;
		transform: scale(1.1);
	}

	:global(.dark) .admin-link:hover {
		color: #5cb85f;
	}

	.logged-in-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #28a745;
		padding: 0.25rem;
	}

	:global(.dark) .logged-in-indicator {
		color: #5cb85f;
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
		color: var(--color-text-muted-dark);
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
			background: var(--mobile-menu-bg);
			border-bottom: 1px solid var(--mobile-menu-border);
			padding: 0;
			max-height: 0;
			overflow: hidden;
			opacity: 0;
			transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
			z-index: 100;
		}

		.mobile-menu.open {
			max-height: 400px;
			opacity: 1;
			padding: 0.5rem 0;
		}

		/* Mobile search styles */
		.mobile-search-form {
			display: flex;
			align-items: center;
			padding: 0.75rem 1rem;
			gap: 0.5rem;
			border-bottom: 1px solid var(--mobile-menu-border);
			margin-bottom: 0.5rem;
		}

		.mobile-search-input {
			flex: 1;
			padding: 0.6rem 0.75rem;
			font-size: 0.9rem;
			border: 1px solid #e0e0e0;
			border-radius: 6px;
			background: white;
			color: #333;
			transition: border-color 0.2s ease, background-color 0.3s ease, color 0.3s ease;
		}

		:global(.dark) .mobile-search-input {
			background: #1a1a1a;
			border-color: #444;
			color: var(--color-text-dark);
		}

		.mobile-search-input:focus {
			outline: none;
			border-color: #2c5f2d;
		}

		:global(.dark) .mobile-search-input:focus {
			border-color: #5cb85f;
		}

		.mobile-search-input::placeholder {
			color: #999;
		}

		:global(.dark) .mobile-search-input::placeholder {
			color: #777;
		}

		.mobile-search-btn {
			background: #2c5f2d;
			border: none;
			cursor: pointer;
			padding: 0.6rem;
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			border-radius: 6px;
			transition: background-color 0.2s;
		}

		:global(.dark) .mobile-search-btn {
			background: #5cb85f;
		}

		.mobile-search-btn:hover {
			background: #4a9d4f;
		}

		:global(.dark) .mobile-search-btn:hover {
			background: #7cd97f;
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
			color: var(--color-text-muted-dark);
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
