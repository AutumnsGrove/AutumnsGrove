import { getAllRecipes } from "$lib/utils/markdown.js";

export async function load() {
  const recipes = getAllRecipes();

  return {
    recipes,
  };
}
