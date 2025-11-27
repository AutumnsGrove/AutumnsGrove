import { getAllPosts } from "$lib/utils/markdown.js";

export async function load() {
  console.log('=== Admin Blog Page Server Load START ===');
  const posts = getAllPosts();
  console.log('Posts returned from getAllPosts:', posts);
  console.log('Posts count:', posts.length);
  console.log('=== Admin Blog Page Server Load END ===');

  return {
    posts,
  };
}
