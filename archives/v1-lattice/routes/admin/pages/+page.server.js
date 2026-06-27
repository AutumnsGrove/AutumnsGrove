import { getPages } from "$lib/server/db.js";

export async function load({ platform }) {
  let pages = [];

  if (platform?.env?.GROVE_DB) {
    try {
      pages = await getPages(platform);
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    }
  }

  return { pages };
}
