<script lang="ts">
	import { type TOCHeader, DEFAULT_SCROLL_OFFSET } from "./types";
	import { scheduleIdle, cancelIdle } from "$lib/utils/schedule";
	import ListIcon from "@lucide/svelte/icons/list";

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

	let isOpen = $state(false);
	let menuRef = $state<HTMLDivElement>();
	let buttonRef = $state<HTMLButtonElement>();
	let activeId = $state("");

	function toggleMenu() { isOpen = !isOpen; }
	function closeMenu() { isOpen = false; }

	function scrollToHeader(id: string) {
		const element = document.getElementById(id);
		if (element) {
			const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - scrollOffset;
			window.scrollTo({ top: offsetPosition, behavior: "smooth" });
			history.pushState(null, "", `#${id}`);
		}
		closeMenu();
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && menuRef && buttonRef) {
			const target = event.target as Node;
			if (!menuRef.contains(target) && !buttonRef.contains(target)) closeMenu();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && isOpen) {
			closeMenu();
			buttonRef?.focus();
		}
	}

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
		let observerCleanup: (() => void) | undefined;

		const id = scheduleIdle(() => {
			observerCleanup = setupScrollTracking();
		});

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleKeydown);

		return () => {
			cancelIdle(id);
			observerCleanup?.();
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

{#if headers.length > 0}
	<div class="mobile-toc-wrapper">
		<button
			bind:this={buttonRef}
			class="toc-button"
			onclick={toggleMenu}
			aria-label="Toggle table of contents"
			aria-expanded={isOpen}
		>
			<ListIcon size={20} />
		</button>

		{#if isOpen}
			<div
				class="toc-menu"
				bind:this={menuRef}
				role="dialog"
				aria-modal="true"
				aria-label="Table of contents"
			>
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
			</div>
		{/if}
	</div>
{/if}

<style>
	.mobile-toc-wrapper {
		display: none;
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 40;
	}

	@media (max-width: 768px) {
		.mobile-toc-wrapper {
			display: block;
		}
	}

	.toc-button {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-primary);
		border: none;
		color: var(--color-bg);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px oklch(0.1 0 0 / 0.2);
		transition: background var(--transition), transform var(--transition);
	}

	.toc-button:hover {
		background: var(--color-primary-hover);
	}

	.toc-button:active {
		transform: scale(0.95);
	}

	.toc-menu {
		position: absolute;
		bottom: 52px;
		right: 0;
		width: 280px;
		max-height: 60vh;
		overflow-y: auto;
		background: var(--color-bg);
		border-radius: 12px;
		border: 1px solid var(--color-border);
		box-shadow: 0 8px 32px oklch(0.1 0 0 / 0.15);
		padding: 1rem;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.toc-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		margin: 0 0 0.75rem 0;
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
		padding: 0.5rem 0;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		transition: color var(--transition);
		font-size: 0.875rem;
		font-family: inherit;
		line-height: 1.4;
	}

	.toc-link:hover {
		color: var(--color-primary);
	}

	.toc-item.active .toc-link {
		color: var(--color-primary);
		font-weight: 600;
	}

	.level-1 .toc-link { padding-left: 0; font-weight: 600; }
	.level-2 .toc-link { padding-left: 0; }
	.level-3 .toc-link { padding-left: 1rem; }
	.level-4 .toc-link { padding-left: 2rem; }
</style>
