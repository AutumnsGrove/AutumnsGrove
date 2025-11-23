import { getHomePage } from "$lib/utils/markdown.js";
import { error } from "@sveltejs/kit";

export const prerender = true;

export function load() {
  const page = getHomePage();

  if (!page) {
    throw error(404, "Home page not found");
  }

  return {
    title: page.title,
    description: page.description,
    hero: page.hero,
    galleries: page.galleries,
    content: page.content,
    headers: page.headers,
    gutterContent: page.gutterContent,
  };
}
