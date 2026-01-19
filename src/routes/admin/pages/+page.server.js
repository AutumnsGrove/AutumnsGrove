export async function load({ platform }) {
  // Auth check happens in parent layout (/admin/+layout.server.js)
  // which correctly includes the redirect parameter

  let pages = [];

  // Try D1 first
  if (platform?.env?.POSTS_DB) {
    try {
      const result = await platform.env.POSTS_DB.prepare(
        `SELECT slug, title, description, type, updated_at, created_at
         FROM pages
         ORDER BY slug ASC`,
      ).all();

      pages = result.results || [];
    } catch (err) {
      console.error("D1 fetch error for pages:", err);
    }
  }

  return {
    pages,
  };
}
