import { json, error } from "@sveltejs/kit";

/**
 * POST /api/admin/gallery/bulk-tag
 * Apply tag to multiple images
 */
export async function POST({ request, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	if (!platform?.env?.DB) {
		throw error(500, "D1 not configured");
	}

	const { imageKeys, tagId } = await request.json();

	if (!imageKeys || !Array.isArray(imageKeys) || imageKeys.length === 0) {
		throw error(400, "imageKeys array required");
	}

	if (!tagId) {
		throw error(400, "tagId required");
	}

	let tagged = 0;

	for (const key of imageKeys) {
		// Get image ID
		const image = await platform.env.DB.prepare("SELECT id FROM gallery_images WHERE r2_key = ?")
			.bind(key)
			.first();

		if (!image) {
			console.warn(`Image not found in D1: ${key}`);
			continue;
		}

		// Check if tag already exists
		const existing = await platform.env.DB.prepare(
			"SELECT 1 FROM gallery_image_tags WHERE image_id = ? AND tag_id = ?"
		)
			.bind(image.id, tagId)
			.first();

		if (!existing) {
			await platform.env.DB.prepare("INSERT INTO gallery_image_tags (image_id, tag_id) VALUES (?, ?)")
				.bind(image.id, tagId)
				.run();

			tagged++;
		}
	}

	return json({ success: true, tagged });
}
