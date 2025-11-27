export async function load({ locals, platform }) {
  // Default site settings
  let siteSettings = { font_family: "alagard" };

  // Only fetch from database at runtime (not during prerendering)
  // The Cloudflare adapter throws when accessing platform.env during prerendering
  try {
    const db = platform?.env?.GIT_STATS_DB;
    if (db) {
      const result = await db
        .prepare("SELECT setting_key, setting_value FROM site_settings")
        .all();

      for (const row of result.results) {
        siteSettings[row.setting_key] = row.setting_value;
      }
    }
  } catch (error) {
    // During prerendering, platform.env access throws - this is expected
    // Also catch any database errors at runtime
    if (!error.message?.includes("prerenderable")) {
      console.error("Failed to load site settings:", error);
    }
  }

  return {
    user: locals.user || null,
    siteSettings,
  };
}
