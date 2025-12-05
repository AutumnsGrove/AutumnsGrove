export async function load({ locals, platform }) {
  // Default site settings
  let siteSettings = { font_family: "alagard" };

  // Only fetch from database at runtime (not during prerendering)
  // The Cloudflare adapter throws when accessing platform.env during prerendering
  // We wrap everything in try-catch because even checking platform?.env can throw during prerendering
  try {
    if (platform?.env?.GIT_STATS_DB) {
      const db = platform.env.GIT_STATS_DB;
      const result = await db
        .prepare("SELECT setting_key, setting_value FROM site_settings")
        .all();

      if (result?.results) {
        for (const row of result.results) {
          siteSettings[row.setting_key] = row.setting_value;
        }
      }
    }
  } catch (err) {
    // During prerendering or if DB bindings aren't configured, gracefully fall back to defaults
    // This prevents 500 errors when D1 bindings aren't set up in Cloudflare Pages dashboard
    // Silent fail during prerendering - this is expected behavior
    if (!err.message?.includes("prerenderable route")) {
      console.error(
        "[ROOT LAYOUT] Failed to load site settings (using defaults):",
        {
          message: err.message,
        },
      );
    }
  }

  return {
    user: locals.user || null,
    siteSettings,
  };
}
