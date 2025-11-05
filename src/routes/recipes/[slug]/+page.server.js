import { getRecipeBySlug, getAllRecipes } from '$lib/utils/markdown.js';
import { error } from '@sveltejs/kit';

export function load({ params }) {
	const recipe = getRecipeBySlug(params.slug);

	if (!recipe) {
		throw error(404, 'Recipe not found');
	}

	return {
		recipe
	};
}

// Generate static paths for all recipes during build
export function entries() {
	const recipes = getAllRecipes();
	return recipes.map(recipe => ({ slug: recipe.slug }));
}

export const prerender = true;