<svelte:head>
	<link rel="alternate" type="application/rss+xml" title="AutumnsGrove Blog" href="/api/feed" />
	{#if data.csrfToken}
		<meta name="csrf-token" content={data.csrfToken} />
	{/if}
</svelte:head>

<script>
	import '../app.css';
	import '@autumnsgrove/groveengine/ui/styles/tokens.css';
	import '@autumnsgrove/groveengine/ui/styles/content.css';
	import '$lib/styles/vine-pattern.css';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, Input, Logo, Sheet } from '@autumnsgrove/groveengine/ui';
	import Home from 'lucide-svelte/icons/home';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import ImageIcon from 'lucide-svelte/icons/image';
	import Clock from 'lucide-svelte/icons/clock';
	import User from 'lucide-svelte/icons/user';

	let { children, data } = $props();

	// Font family mapping - maps database values to CSS font stacks
	const fontMap = {
		alagard: "'Alagard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		cozette: "'Cozette', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		opendyslexic: "'OpenDyslexic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		lexend: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		cormorant: "'Cormorant', Georgia, 'Times New Roman', serif",
		quicksand: "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		ibmplexmono: "'IBM Plex Mono', 'Fira Code', 'Source Code Pro', monospace",
		bodonimoda: "'Bodoni Moda', 'Didot', 'Bodoni MT', Georgia, serif"
	};

	// Apply font from server-loaded settings
	$effect(() => {
		if (typeof document !== 'undefined' && data?.siteSettings?.font_family) {
			const fontValue = fontMap[data.siteSettings.font_family] || fontMap.alagard;
			document.documentElement.style.setProperty('--font-family-main', fontValue);
		}
	});

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

<div class="layout leaf-pattern">
	<header>
		<nav>
			<!-- TITLE AREA -->
			<a href="/" class="logo">
				<Logo class="w-6 h-6" color="#e67e22" />
				<span>Autumns Grove</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="nav-links desktop-nav">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
				<a href="/gallery" class:active={$page.url.pathname.startsWith('/gallery')}>Gallery</a>
				<a href="/timeline" class:active={$page.url.pathname.startsWith('/timeline')}>Timeline</a>
				<a href="/about" class:active={$page.url.pathname.startsWith('/about')}>About</a>

				<!-- Search -->
				<div class="search-wrapper">
					{#if searchExpanded}
						<form class="search-form" onsubmit={handleSearchSubmit}>
							<Input
								bind:ref={searchInputRef}
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
					<Button
						variant="ghost"
						size="icon"
						onclick={toggleSearch}
						aria-label={searchExpanded ? 'Close search' : 'Open search'}
						class="search-btn"
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
					</Button>
				</div>
			</div>

			<!-- Mobile Hamburger Button with Sheet -->
			<div class="mobile-menu-trigger">
				<Sheet bind:open={mobileMenuOpen} side="right" title="Menu">
					{#snippet trigger()}
						<Button
							bind:ref={hamburgerBtnRef}
							variant="ghost"
							size="icon"
							class={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
							aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
							aria-expanded={mobileMenuOpen}
						>
							<span class="hamburger-icon">
								<span class="bar"></span>
								<span class="bar"></span>
								<span class="bar"></span>
							</span>
						</Button>
					{/snippet}

					<!-- Mobile Navigation Menu Content -->
					<nav class="mobile-nav-content" bind:this={mobileMenuRef}>
						<a href="/" class:active={$page.url.pathname === '/'} onclick={closeMobileMenu}>
							<Home size={20} />
							<span>Home</span>
						</a>
						<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')} onclick={closeMobileMenu}>
							<BookOpen size={20} />
							<span>Blog</span>
						</a>
						<a href="/gallery" class:active={$page.url.pathname.startsWith('/gallery')} onclick={closeMobileMenu}>
							<ImageIcon size={20} />
							<span>Gallery</span>
						</a>
						<a href="/timeline" class:active={$page.url.pathname.startsWith('/timeline')} onclick={closeMobileMenu}>
							<Clock size={20} />
							<span>Timeline</span>
						</a>
						<a href="/about" class:active={$page.url.pathname.startsWith('/about')} onclick={closeMobileMenu}>
							<User size={20} />
							<span>About</span>
						</a>
					</nav>
				</Sheet>
			</div>
		</nav>
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
			<Button variant="ghost" size="icon" class="theme-toggle" onclick={toggleTheme} aria-label="Toggle dark mode">
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
			</Button>
		</div>
	</footer>
</div>

<style>
	/* @font-face declarations for custom fonts */
	@font-face {
		font-family: 'Alagard';
		src: url('/fonts/alagard.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Cozette';
		src: url('/fonts/CozetteVector.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Atkinson Hyperlegible';
		src: url('/fonts/AtkinsonHyperlegible-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'OpenDyslexic';
		src: url('/fonts/OpenDyslexic-Regular.otf') format('opentype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Lexend';
		src: url('/fonts/Lexend-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Cormorant';
		src: url('/fonts/Cormorant-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Quicksand';
		src: url('/fonts/Quicksand-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'IBM Plex Mono';
		src: url('/fonts/IBMPlexMono-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'Bodoni Moda';
		src: url('/fonts/BodoniModa-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}
	/* CSS Custom Properties - Site-specific overrides */
	:global(:root) {
		/* Font family - dynamically set via JavaScript from database settings */
		--font-family-main: 'Alagard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		/* Component-specific */
		--mobile-menu-bg: var(--cream);
		--mobile-menu-border: var(--color-border);
		--tag-bg: #7c4dab;
		--tag-bg-hover: #6a3d9a;
		/* Border radius standardization */
		--border-radius-standard: 8px;
		--border-radius-small: 4px;
		--border-radius-button: 6px;
	}
	:global(.dark) {
		--tag-bg: #6a3d9a;
		--tag-bg-hover: #7c4dab;
	}
	:global(body) {
		margin: 0;
		font-family: var(--font-family-main);
		line-height: 1.6;
		color: var(--color-foreground);
		background: var(--color-background);
		transition: background-color 0.3s ease, color 0.3s ease;
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
		border-bottom: 1px solid var(--color-border);
		padding: 1rem 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}
	:global(.dark) header {
		background: #242424;
		border-bottom: 1px solid var(--color-border-strong);
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: bold;
		color: #2c5f2d;
		text-decoration: none;
		transition: color 0.2s;
	}
	:global(.dark) .logo {
		color: var(--grove-500);
	}
	.logo:hover {
		color: #4a9d4f;
	}
	:global(.dark) .logo:hover {
		color: var(--grove-400);
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
	:global(.dark) .nav-links a::after {
		background: var(--grove-500);
	}
	.nav-links a:hover {
		color: #2c5f2d;
	}
	.nav-links a:hover::after {
		transform: scaleX(1);
	}
	:global(.dark) .nav-links a:hover {
		color: var(--grove-500);
	}
	.nav-links a.active {
		color: #2c5f2d;
	}
	.nav-links a.active::after {
		transform: scaleX(1);
	}
	:global(.dark) .nav-links a.active {
		color: var(--grove-500);
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
	footer {
		background: white;
		border-top: 1px solid var(--color-border);
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
		border-top: 1px solid var(--color-border-strong);
		color: var(--color-muted-foreground);
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
	.admin-link:hover {
		color: #2c5f2d;
		transform: scale(1.1);
	}
	:global(.dark) .admin-link:hover {
		color: var(--grove-500);
	}
	.logged-in-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--grove-500);
		padding: 0.25rem;
	}
	:global(.dark) .logged-in-indicator {
		color: var(--grove-500);
	}
	/* Mobile menu trigger - hidden on desktop */
	.mobile-menu-trigger {
		display: none;
	}
	/* Mobile nav content styles (inside Sheet) */
	.mobile-nav-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.mobile-nav-content a {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		color: var(--color-muted-foreground);
		font-weight: 500;
		padding: 0.875rem 0;
		font-size: 1.05rem;
		transition: color 0.2s;
	}
	.mobile-nav-content a:hover {
		color: var(--grove-500);
	}
	.mobile-nav-content a.active {
		color: var(--grove-500);
		font-weight: 600;
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
		/* Show mobile menu trigger */
		.mobile-menu-trigger {
			display: block;
		}
	}

	/* Sheet overlay backdrop blur */
	:global([data-dialog-overlay]) {
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		background: rgba(0, 0, 0, 0.5) !important;
	}

	/* Sheet content - matching grove.place styling */
	:global([data-dialog-content][data-state]) {
		width: 60% !important;
		max-width: 300px !important;
		background: rgba(18, 18, 18, 0.75) !important;
		backdrop-filter: blur(20px) saturate(1.2);
		-webkit-backdrop-filter: blur(20px) saturate(1.2);
		border-left: 1px solid rgba(255, 255, 255, 0.06) !important;
	}
</style>
