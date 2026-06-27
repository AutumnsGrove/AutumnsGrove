import { json, error } from "@sveltejs/kit";
import { validateCSRF } from "$lib/utils/csrf";
import { sanitizeObject } from "$lib/utils/validation";
import { getSiteSettings, updateSiteSetting } from "$lib/server/db.js";

export async function GET({ platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	try {
		const settings = await getSiteSettings(platform);
		return json({ settings });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error fetching settings:", err);
		throw error(500, "Failed to fetch settings");
	}
}

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

		const allowedSettings = ["font_family", "site_title", "site_description"];
		if (!allowedSettings.includes(setting_key)) {
			throw error(400, "Invalid setting key");
		}

		if (typeof setting_value !== "string" || setting_value.length > 500) {
			throw error(400, "Invalid setting value");
		}

		await updateSiteSetting(platform, setting_key, setting_value);

		return json({ success: true, setting_key, setting_value });
	} catch (err) {
		if (err.status) throw err;
		console.error("Settings update error:", err);
		throw error(500, "Failed to update setting");
	}
}
