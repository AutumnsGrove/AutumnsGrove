import { getAllRecipes } from "$lib/content/markdown";

export const prerender = true;

export function load() {
  const recipes = getAllRecipes();

  return {
    recipes,
  };
}
