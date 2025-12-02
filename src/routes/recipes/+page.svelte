<script>
	import { Card, Badge } from '@autumnsgrove/groveengine/components/ui';

	let { data } = $props();
</script>

<svelte:head>
	<title>Recipes - AutumnsGrove</title>
	<meta name="description" content="Explore my collection of delicious recipes with step-by-step instructions." />
</svelte:head>

<div class="recipes-header">
	<h1>Recipes</h1>
	<p>Delicious dishes with step-by-step instructions and cooking workflows.</p>
</div>

{#if data.recipes.length === 0}
	<div class="no-recipes">
		<p>No recipes yet. Check back soon!</p>
	</div>
{:else}
	<div class="recipes-grid">
		{#each data.recipes as recipe (recipe.slug)}
			<Card hoverable>
				<a href="/recipes/{recipe.slug}" class="recipe-link">
					<h2 class="text-xl font-semibold mb-4 text-green-800 dark:text-green-500 transition-colors">{recipe.title}</h2>
					<div class="recipe-meta">
						<time datetime={recipe.date} class="text-sm text-gray-600 dark:text-gray-400 transition-colors">
							{new Date(recipe.date).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
						{#if recipe.tags.length > 0}
							<div class="tags">
								{#each recipe.tags as tag (tag)}
									<Badge variant="tag">{tag}</Badge>
								{/each}
							</div>
						{/if}
					</div>
					{#if recipe.description}
						<p class="description">{recipe.description}</p>
					{/if}
				</a>
			</Card>
		{/each}
	</div>
{/if}

<style>
	.recipes-header {
		text-align: center;
		margin-bottom: 3rem;
	}
	.recipes-header h1 {
		font-size: 2.5rem;
		color: #2c5f2d;
		margin-bottom: 0.5rem;
		transition: color 0.3s ease;
	}
	:global(.dark) .recipes-header h1 {
		color: var(--accent-success);
	}
	.recipes-header p {
		color: #666;
		font-size: 1.1rem;
		transition: color 0.3s ease;
	}
	.no-recipes {
		text-align: center;
		padding: 3rem;
		color: var(--light-text-muted);
	}
	.recipes-grid {
		display: grid;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
	.recipe-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}
	.recipe-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}
	.description {
		color: #666;
		line-height: 1.6;
		margin: 0;
		transition: color 0.3s ease;
	}
	@media (max-width: 768px) {
		.recipes-header h1 {
			font-size: 2rem;
		}
	}
</style>