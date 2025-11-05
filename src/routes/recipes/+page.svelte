<script>
	export let data;
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
		{#each data.recipes as recipe}
			<article class="recipe-card">
				<a href="/recipes/{recipe.slug}" class="recipe-link">
					<h2>{recipe.title}</h2>
					<div class="recipe-meta">
						<time datetime={recipe.date}>
							{new Date(recipe.date).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
						{#if recipe.tags.length > 0}
							<div class="tags">
								{#each recipe.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
					</div>
					{#if recipe.description}
						<p class="description">{recipe.description}</p>
					{/if}
				</a>
			</article>
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
		color: #5cb85f;
	}

	.recipes-header p {
		color: #666;
		font-size: 1.1rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .recipes-header p {
		color: #aaa;
	}

	.no-recipes {
		text-align: center;
		padding: 3rem;
		color: #999;
	}

	.recipes-grid {
		display: grid;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.recipe-card {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		border: 1px solid #e0e0e0;
		transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s ease, border-color 0.3s ease;
	}

	:global(.dark) .recipe-card {
		background: #242424;
		border: 1px solid #333;
	}

	.recipe-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .recipe-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.recipe-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.recipe-card h2 {
		margin: 0 0 1rem 0;
		color: #2c5f2d;
		font-size: 1.5rem;
		transition: color 0.3s ease;
	}

	:global(.dark) .recipe-card h2 {
		color: #5cb85f;
	}

	.recipe-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	time {
		color: #888;
		font-size: 0.9rem;
		transition: color 0.3s ease;
	}

	:global(.dark) time {
		color: #999;
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag {
		background: #e8d5f2;
		color: #6a3d9a;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(.dark) .tag {
		background: #4a2d5e;
		color: #d4b5e8;
	}

	.description {
		color: #666;
		line-height: 1.6;
		margin: 0;
		transition: color 0.3s ease;
	}

	:global(.dark) .description {
		color: #aaa;
	}

	@media (max-width: 768px) {
		.recipes-header h1 {
			font-size: 2rem;
		}

		.recipe-card {
			padding: 1.5rem;
		}
	}
</style>