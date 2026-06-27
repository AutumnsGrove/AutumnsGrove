import { json } from "@sveltejs/kit";
import { getSiteSettings } from "$lib/server/db.js";

export const prerender = false;

export async function GET({ platform }) {
  if (!platform?.env?.GROVE_DB) {
    return json({ font_family: "alagard" });
  }

  try {
    const settings = await getSiteSettings(platform);
    return json(settings, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return json({ font_family: "alagard" });
  }
}
