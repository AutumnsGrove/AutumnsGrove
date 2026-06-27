<script lang="ts">
	interface Props {
		user?: { id: string; email: string; name?: string | null } | null;
	}

	let { user = null }: Props = $props();

	const year = new Date().getFullYear();
</script>

<footer class="footer grain wash-bg scroll-reveal">
	<div class="container footer-inner">
		<p class="footer-tagline">Thanks for wandering through the grove.</p>
		<a href="/contact" class="footer-cta">Say hello &rarr;</a>
		<hr class="footer-rule" />
		<div class="footer-links">
			<a href="/blog">Blog</a>
			<a href="/about">About</a>
			<a href="https://github.com/AutumnsGrove" target="_blank" rel="noopener noreferrer">GitHub</a>
		</div>
		<p class="copyright">
			&copy; {year} Autumns Grove
			&middot; <a href="/admin" class="admin-link">Admin</a>
		</p>
	</div>
</footer>

<style>
	.footer {
		border-top: none;
		padding: clamp(3rem, 6vw, 5rem) 0 2.5rem;
		margin-top: auto;
		color: var(--color-muted);
		font-size: 0.85rem;
	}

	.footer-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.footer-tagline {
		font-style: italic;
		color: var(--color-muted);
		font-size: 0.95rem;
		margin-bottom: 0.25rem;
	}

	.footer-cta {
		font-family: var(--font-heading);
		font-size: clamp(1.4rem, 3vw, 1.8rem);
		font-weight: 700;
		color: var(--color-accent);
		transition: color var(--transition), letter-spacing var(--transition);
		letter-spacing: -0.01em;
	}

	.footer-cta:hover {
		color: var(--color-accent-hover);
		letter-spacing: 0.02em;
	}

	.footer-rule {
		width: 3rem;
		height: 2px;
		background: var(--color-accent);
		border: none;
		margin: 0.75rem 0;
		opacity: 0.5;
	}

	.footer-links {
		display: flex;
		gap: 1.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer-links a {
		color: var(--color-muted);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-size: 0.78rem;
		transition: color var(--transition);
	}

	.footer-links a:hover {
		color: var(--color-accent);
	}

	.copyright {
		text-align: center;
		letter-spacing: 0.02em;
		margin-top: 0.5rem;
	}

	.admin-link {
		color: var(--color-muted);
		font-weight: 400;
	}

	.admin-link:hover {
		color: var(--color-primary);
	}
</style>
