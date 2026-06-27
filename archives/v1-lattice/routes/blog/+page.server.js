import { getPublishedPosts } from "$lib/server/db.js";

export const prerender = false;

export async function load({ locals, platform }) {
  let posts = [];

  if (platform?.env?.GROVE_DB) {
    try {
      posts = await getPublishedPosts(platform);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }

  return {
    posts,
    user: locals.user || null,
  };
}
