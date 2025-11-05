import { getAllRecipes } from '$lib/utils/markdown.js';

export const prerender = true;

export function load() {
	const recipes = getAllRecipes();

	return {
		recipes
	};
}