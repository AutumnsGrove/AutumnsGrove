<script lang="ts">
	import { type TOCHeader, DEFAULT_SCROLL_OFFSET } from "./types";
	import { scheduleIdle, cancelIdle } from "$lib/utils/schedule";

	interface Props {
		headers?: TOCHeader[];
		title?: string;
		scrollOffset?: number;
	}

	let {
		headers = [],
		title = "Table of Contents",
		scrollOffset = DEFAULT_SCROLL_OFFSET,
	}: Props = $props();

	let activeId = $state("");

	function setupScrollTracking() {
		if (typeof window === "undefined") return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) activeId = entry.target.id;
				});
			},
			{ rootMargin: "-20% 0% -35% 0%", threshold: 0 }
		);

		headers.forEach((header) => {
			const element = document.getElementById(header.id);
			if (element) observer.observe(element);
		});

		return () => observer.disconnect();
	}

	$effect(() => {
		const _snapshot = headers;
		let cleanup: (() => void) | undefined;

		const id = scheduleIdle(() => {
			cleanup = setupScrollTracking();
		});

		return () => {
			cancelIdle(id);
			cleanup?.();
		};
	});

	function scrollToHeader(id: string) {
		const element = document.getElementById(id);
		if (element) {
			const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - scrollOffset;
			window.scrollTo({ top: offsetPosition, behavior: "smooth" });
			history.pushState(null, "", `#${id}`);
		}
	}
</script>

{#if headers.length > 0}
	<nav class="toc" aria-label="Table of contents">
		<h3 class="toc-title">{title}</h3>
		<ul class="toc-list">
			{#each headers as header (header.id)}
				<li class="toc-item level-{header.level ?? 2}" class:active={activeId === header.id}>
					<button type="button" onclick={() => scrollToHeader(header.id)} class="toc-link">
						<span>{header.text}</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.toc {
		position: sticky;
		top: 6.5rem;
		max-height: calc(100vh - 7.5rem);
		overflow-y: auto;
		padding: 1.25rem;
		font-size: 0.875rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		transition: border-color var(--transition);
	}

	.toc:hover {
		border-color: var(--color-muted);
	}

	.toc-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		padding: 0.375rem 0;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		transition: color var(--transition), padding-left var(--transition);
		font-size: inherit;
		font-family: inherit;
		line-height: 1.4;
	}

	.toc-link:hover {
		color: var(--color-primary);
		padding-left: 0.5rem;
	}

	.toc-item.active .toc-link {
		color: var(--color-primary);
		font-weight: 600;
		background: var(--color-surface-hover);
		padding: 0.375rem 0.75rem;
		margin-left: -0.75rem;
		margin-right: -0.75rem;
		border-radius: var(--radius);
	}

	.level-1 .toc-link { padding-left: 0; font-weight: 600; }
	.level-2 .toc-link { padding-left: 0; }
	.level-3 .toc-link { padding-left: 1rem; }
	.level-4 .toc-link { padding-left: 2rem; }
	.level-5 .toc-link { padding-left: 3rem; }
	.level-6 .toc-link { padding-left: 4rem; }

	.toc {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	.toc:hover {
		scrollbar-color: var(--color-muted) transparent;
	}
</style>
