<script lang="ts">
	interface Props {
		user?: { id: string; email: string; name?: string | null } | null;
	}

	let { user = null }: Props = $props();

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="container footer-inner">
		<a href="/contact" class="footer-cta">Say hello &rarr;</a>
		<div class="footer-links">
			<a href="/blog">Blog</a>
			<a href="/about">About</a>
			<a href="https://github.com/AutumnsGrove" target="_blank" rel="noopener noreferrer">GitHub</a>
		</div>
		<p class="copyright">
			&copy; {year} Autumns Grove
			{#if user}
				&middot; <a href="/admin" class="admin-link">Admin</a>
			{/if}
		</p>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--color-border);
		padding: 3rem 0;
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

	.footer-cta {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-accent);
		transition: color var(--transition);
		margin-bottom: 0.5rem;
	}

	.footer-cta:hover {
		color: var(--color-accent-hover);
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
		letter-spacing: 0.03em;
		text-transform: uppercase;
		font-size: 0.8rem;
		transition: color var(--transition);
	}

	.footer-links a:hover {
		color: var(--color-accent);
	}

	.copyright {
		text-align: center;
		letter-spacing: 0.02em;
	}

	.admin-link {
		color: var(--color-muted);
		font-weight: 400;
	}

	.admin-link:hover {
		color: var(--color-primary);
	}
</style>
