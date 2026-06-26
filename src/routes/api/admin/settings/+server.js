import { json, error } from "@sveltejs/kit";
import { validateCSRF } from "@autumnsgrove/lattice/utils";
import { sanitizeObject } from "@autumnsgrove/lattice/utils";
import { updateSiteSetting } from "$lib/server/db.js";

export const prerender = false;

export async function PUT({ request, platform, locals }) {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  if (!validateCSRF(request)) {
    throw error(403, "Invalid origin");
  }

  try {
    const body = sanitizeObject(await request.json());
    const { setting_key, setting_value } = body;

    if (!setting_key || typeof setting_key !== "string") {
      throw error(400, "Missing or invalid setting_key");
    }
    if (setting_value === undefined || setting_value === null) {
      throw error(400, "Missing setting_value");
    }

    const allowedSettings = ["font_family", "ai_assistant_enabled", "ai_model"];
    if (!allowedSettings.includes(setting_key)) {
      throw error(400, "Invalid setting key");
    }

    if (setting_key === "font_family") {
      const validFonts = [
        "alagard", "cozette", "atkinson", "opendyslexic",
        "lexend", "cormorant", "quicksand",
      ];
      if (!validFonts.includes(setting_value)) {
        throw error(400, "Invalid font value");
      }
    }

    if (setting_key === "ai_assistant_enabled") {
      if (!["true", "false"].includes(setting_value)) {
        throw error(400, "Invalid value for ai_assistant_enabled");
      }
    }

    if (setting_key === "ai_model") {
      if (!["haiku", "sonnet"].includes(setting_value)) {
        throw error(400, "Invalid value for ai_model");
      }
    }

    await updateSiteSetting(platform, setting_key, setting_value);

    return json({
      success: true,
      setting_key,
      setting_value,
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Settings update error:", err);
    throw error(500, "Failed to update setting");
  }
}
