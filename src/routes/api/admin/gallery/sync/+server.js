import { json, error } from "@sveltejs/kit";
import { parseImageFilename } from "@autumnsgrove/groveengine/utils/gallery";

/**
 * POST /api/admin/gallery/sync
 * Sync R2 images to D1 gallery_images table
 */
export async function POST({ platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	if (!platform?.env?.IMAGES || !platform?.env?.DB) {
		throw error(500, "R2 or D1 not configured");
	}

	try {
		let added = 0;
		let updated = 0;
		let cursor = undefined;
		const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

		do {
			const listResult = await platform.env.IMAGES.list({
				cursor: cursor,
				limit: 500
			});

			for (const obj of listResult.objects) {
				const key = obj.key.toLowerCase();
				if (!imageExtensions.some((ext) => key.endsWith(ext))) continue;

				const parsed = parseImageFilename(obj.key);

				// Check if image exists in D1
				const existing = await platform.env.DB.prepare("SELECT id FROM gallery_images WHERE r2_key = ?")
					.bind(obj.key)
					.first();

				if (existing) {
					// Update R2 cached data
					await platform.env.DB.prepare(
						`
						UPDATE gallery_images
						SET
							file_size = ?,
							uploaded_at = ?,
							cdn_url = ?,
							parsed_date = COALESCE(parsed_date, ?),
							parsed_category = COALESCE(parsed_category, ?),
							parsed_slug = COALESCE(parsed_slug, ?),
							updated_at = datetime('now')
						WHERE r2_key = ?
					`
					)
						.bind(
							obj.size,
							obj.uploaded,
							`https://cdn.autumnsgrove.com/${obj.key}`,
							parsed.date,
							parsed.category,
							parsed.slug,
							obj.key
						)
						.run();

					updated++;
				} else {
					// Insert new image
					await platform.env.DB.prepare(
						`
						INSERT INTO gallery_images (
							r2_key, parsed_date, parsed_category, parsed_slug,
							file_size, uploaded_at, cdn_url
						) VALUES (?, ?, ?, ?, ?, ?, ?)
					`
					)
						.bind(
							obj.key,
							parsed.date,
							parsed.category,
							parsed.slug,
							obj.size,
							obj.uploaded,
							`https://cdn.autumnsgrove.com/${obj.key}`
						)
						.run();

					added++;
				}
			}

			cursor = listResult.truncated ? listResult.cursor : undefined;
		} while (cursor);

		return json({
			success: true,
			added,
			updated,
			total: added + updated
		});
	} catch (err) {
		console.error("Sync error:", err);
		throw error(500, "Failed to sync images");
	}
}
