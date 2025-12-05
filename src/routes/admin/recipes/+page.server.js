import { getAllRecipes } from "$lib/content/markdown";

export const prerender = false;

const WORKER_URL = "https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev";

export async function load({ fetch }) {
  // Try to fetch from D1 via worker first, fallback to local filesystem
  try {
    const response = await fetch(`${WORKER_URL}/recipes`);

    if (response.ok) {
      const recipes = await response.json();

      // Transform to match expected format
      return {
        recipes: recipes.map((recipe) => ({
          slug: recipe.slug,
          title: recipe.title,
          date: recipe.date,
          tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          description: recipe.description || "",
          url: recipe.url || null,
        })),
        source: "d1",
      };
    }
  } catch (error) {
    console.error("Error fetching recipes from D1:", error);
  }

  // Fallback to local filesystem
  const recipes = getAllRecipes();

  return {
    recipes,
    source: "filesystem",
  };
}
