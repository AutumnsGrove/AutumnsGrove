import { getSiteSettings } from "$lib/server/db.js";

export async function load({ locals, platform }) {
  let siteSettings = { font_family: "alagard" };

  try {
    if (platform?.env?.GROVE_DB) {
      siteSettings = await getSiteSettings(platform);
    }
  } catch (err) {
    if (!err.message?.includes("prerenderable route")) {
      console.error("[ROOT LAYOUT] Failed to load site settings:", err.message);
    }
  }

  return {
    user: locals.user || null,
    siteSettings,
    csrfToken: locals.csrfToken || null,
  };
}
