import { error } from "@sveltejs/kit";

export async function load({ params, platform }) {
  // Auth check happens in parent layout (/admin/+layout.server.js)
  // which correctly includes the redirect parameter

  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  // Try D1 first
  if (platform?.env?.POSTS_DB) {
    try {
      const page = await platform.env.POSTS_DB.prepare(
        `SELECT slug, title, description, type, markdown_content, html_content, hero, gutter_content, font, updated_at, created_at
         FROM pages
         WHERE slug = ?`,
      )
        .bind(slug)
        .first();

      if (page) {
        return {
          source: "d1",
          page: {
            ...page,
            hero: page.hero ? JSON.parse(page.hero) : null,
            gutter_content: page.gutter_content || "[]",
          },
        };
      }
    } catch (err) {
      console.error("D1 fetch error:", err);
      throw error(500, "Failed to fetch page");
    }
  }

  // If not found in D1, return error
  throw error(404, "Page not found");
}
