import { error } from "@sveltejs/kit";
import { getPostBySlug } from "$lib/server/db.js";

export async function load({ params, platform }) {
  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  const post = await getPostBySlug(platform, slug);

  if (!post) {
    throw error(404, "Post not found");
  }

  return {
    source: "d1",
    post: {
      ...post,
      gutter_content: post.gutter_content || "[]",
    },
  };
}
