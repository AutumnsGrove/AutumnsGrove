import { getAllPosts } from "$lib/utils/markdown.js";

export async function load() {
  const posts = getAllPosts();

  return {
    posts,
  };
}
