import { error } from "@sveltejs/kit";
import { getPageBySlug } from "$lib/server/db.js";

export async function load({ params, platform }) {
  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  const page = await getPageBySlug(platform, slug);

  if (!page) {
    throw error(404, "Page not found");
  }

  return {
    source: "d1",
    page: {
      ...page,
      hero: page.hero ? JSON.parse(page.hero) : null,
      gutter_content: page.gutter_content || "[]",
    },
  };
}
