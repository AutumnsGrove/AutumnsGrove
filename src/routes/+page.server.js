import { getHomePage, getLatestPost } from "$lib/utils/markdown.js";
import { error } from "@sveltejs/kit";

export const prerender = true;

export function load() {
  const page = getHomePage();

  if (!page) {
    throw error(404, "Home page not found");
  }

  const latestPost = getLatestPost();

  return {
    title: page.title,
    description: page.description,
    hero: page.hero,
    content: page.content,
    headers: page.headers,
    gutterContent: page.gutterContent,
    latestPost,
  };
}
