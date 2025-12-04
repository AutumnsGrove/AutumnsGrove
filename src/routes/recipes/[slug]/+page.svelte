<script>
	import { untrack } from 'svelte';
	import { ContentWithGutter } from '$lib/components';
	import IconLegend from '$lib/components/custom/IconLegend.svelte';
	import { Button, Badge } from '$lib/components/ui';

	let { data } = $props();

	// Extract sidecar data if available
	let sidecar = $derived(data.recipe.sidecar);
	let iconsUsed = $derived(sidecar?.icons_used || []);

	$effect(() => {
		untrack(() => {
			// Inject instruction icons into step headings after component mounts
			if (sidecar?.steps) {
				injectStepIcons();
			}
		});
	});

	function injectStepIcons() {
		// Find all h3 elements that contain step information
		const stepHeadings = document.querySelectorAll('.content-body h3');

		stepHeadings.forEach((heading) => {
			const text = heading.textContent || '';
			// Match "Step N:" pattern
			const match = text.match(/Step\s+(\d+)/i);

			if (match) {
				const stepNumber = parseInt(match[1], 10);
				const stepData = sidecar.steps.find(s => s.step === stepNumber);

				if (stepData?.icons && stepData.icons.length > 0) {
					// Create icon container
					const iconContainer = document.createElement('span');
					iconContainer.className = 'step-icons';

					stepData.icons.forEach(iconKey => {
						const img = document.createElement('img');
						img.src = `/icons/instruction/${iconKey}.webp`;
						img.alt = iconKey;
						img.className = 'step-icon';
						img.title = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
						iconContainer.appendChild(img);
					});

					// Insert icons before the heading text
					heading.insertBefore(iconContainer, heading.firstChild);
				}
			}
		});
	}
</script>

<svelte:head>
	<title>{data.recipe.title} - AutumnsGrove</title>
	<meta name="description" content={data.recipe.description || data.recipe.title} />
</svelte:head>

<ContentWithGutter
	content={data.recipe.content}
	gutterContent={data.recipe.gutterContent || []}
	headers={data.recipe.headers || []}
>
	{#snippet children()}
		<header class="content-header">
			<Button variant="link" href="/recipes" class="!p-0 mb-8">&larr; Back to Recipes</Button>
			<h1>{data.recipe.title}</h1>
			<div class="recipe-meta">
				<time datetime={data.recipe.date} class="text-gray-600 dark:text-gray-400 transition-colors">
					{new Date(data.recipe.date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
				{#if data.recipe.tags.length > 0}
					<div class="tags">
						{#each data.recipe.tags as tag (tag)}
							<Badge variant="tag">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</div>
		</header>

		{#if iconsUsed.length > 0}
			<IconLegend {iconsUsed} />
		{/if}
	{/snippet}
</ContentWithGutter>

<style>
	/* Override content-header h1 to add margin for recipe meta */
	.content-header h1 {
		margin: 0 0 1rem 0;
	}

	.recipe-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Step instruction icons */
	:global(.step-icons) {
		display: inline-flex;
		gap: 0.35rem;
		margin-right: 0.5rem;
		vertical-align: middle;
	}

	:global(.step-icon) {
		width: 24px;
		height: 24px;
		vertical-align: middle;
		transition: transform 0.2s;
	}

	:global(.step-icon:hover) {
		transform: scale(1.15);
	}

	/* Style step headings to accommodate icons */
	:global(.content-body h3) {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	@media (max-width: 768px) {
		:global(.step-icons) {
			display: flex;
			margin-right: 0;
			margin-bottom: 0.5rem;
			width: 100%;
		}
	}
</style>
