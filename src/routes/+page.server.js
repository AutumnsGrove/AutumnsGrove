import { getHomePage } from "$lib/utils/markdown.js";

export const prerender = true;

export function load() {
  const page = getHomePage();

  if (!page) {
    return {
      title: "AutumnsGrove - Home",
      description: "A personal website for blogging, demonstrating projects, and sharing articles.",
      hero: null,
      galleries: [],
      content: "",
      headers: [],
      gutterContent: [],
    };
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
