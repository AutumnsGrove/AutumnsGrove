<script>
	export let iconsUsed = [];

	let expanded = false;

	// Map icon keys to their semantic meanings and display names
	const iconMeanings = {
		stovetop: { name: 'Stovetop', meaning: 'Cook on stove/pan' },
		mix: { name: 'Mix', meaning: 'Mix/stir in bowl' },
		spicy: { name: 'Spicy', meaning: 'Spicy/hot indicator' },
		chop: { name: 'Chop', meaning: 'Chop/prep ingredients' },
		simmer: { name: 'Simmer', meaning: 'Simmer/wait' },
		chill: { name: 'Chill', meaning: 'Refrigerate/chill' },
		serve: { name: 'Serve', meaning: 'Plate/serve' },
		boil: { name: 'Boil', meaning: 'Boil in pot' },
		bake: { name: 'Bake', meaning: 'Oven/bake' },
		marinate: { name: 'Marinate', meaning: 'Marinate/rest' },
		blend: { name: 'Blend', meaning: 'Blend/puree' },
		season: { name: 'Season', meaning: 'Season/salt' },
		grill: { name: 'Grill', meaning: 'Grill/BBQ' },
		steam: { name: 'Steam', meaning: 'Steam' },
		knead: { name: 'Knead', meaning: 'Knead dough' }
	};

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

{#if iconsUsed && iconsUsed.length > 0}
	<div class="icon-legend">
		<button
			class="legend-toggle"
			on:click={toggleExpanded}
			aria-expanded={expanded}
		>
			<span class="legend-title">Icon Legend</span>
			<span class="toggle-icon" class:expanded>{expanded ? '▼' : '▶'}</span>
		</button>

		{#if expanded}
			<div class="legend-content">
				{#each iconsUsed as iconKey}
					{#if iconMeanings[iconKey]}
						<div class="legend-item">
							<img
								src="/icons/instruction/{iconKey}.webp"
								alt={iconMeanings[iconKey].name}
								class="legend-icon"
							/>
							<div class="legend-text">
								<span class="icon-name">{iconMeanings[iconKey].name}</span>
								<span class="icon-meaning">{iconMeanings[iconKey].meaning}</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.icon-legend {
		margin-bottom: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	:global(.dark) .icon-legend {
		border-color: #3a3a3a;
	}

	.legend-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #f5f5f5;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		transition: background-color 0.2s;
	}

	:global(.dark) .legend-toggle {
		background: #2a2a2a;
		color: #e0e0e0;
	}

	.legend-toggle:hover {
		background: #e8e8e8;
	}

	:global(.dark) .legend-toggle:hover {
		background: #333;
	}

	.legend-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-icon {
		font-size: 0.75rem;
		transition: transform 0.2s;
	}

	.toggle-icon.expanded {
		transform: rotate(0deg);
	}

	.legend-content {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: #fafafa;
	}

	:global(.dark) .legend-content {
		background: #1f1f1f;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.legend-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.icon-name {
		font-weight: 500;
		font-size: 0.85rem;
		color: #333;
	}

	:global(.dark) .icon-name {
		color: #e0e0e0;
	}

	.icon-meaning {
		font-size: 0.75rem;
		color: #666;
	}

	:global(.dark) .icon-meaning {
		color: #999;
	}

	@media (max-width: 640px) {
		.legend-content {
			grid-template-columns: 1fr;
		}
	}
</style>
