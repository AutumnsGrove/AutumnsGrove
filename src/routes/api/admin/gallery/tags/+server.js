import { json, error } from "@sveltejs/kit";

/**
 * GET /api/admin/gallery/tags
 * List all tags
 */
export async function GET({ platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	if (!platform?.env?.DB) {
		throw error(500, "D1 not configured");
	}

	const tags = await platform.env.DB.prepare("SELECT * FROM gallery_tags ORDER BY name ASC").all();

	return json({ success: true, tags: tags.results || [] });
}

/**
 * POST /api/admin/gallery/tags
 * Create a new tag
 */
export async function POST({ request, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	if (!platform?.env?.DB) {
		throw error(500, "D1 not configured");
	}

	const { name, color } = await request.json();

	if (!name) {
		throw error(400, "Tag name required");
	}

	// Generate slug
	const slug = name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");

	await platform.env.DB.prepare(
		`
		INSERT INTO gallery_tags (name, slug, color)
		VALUES (?, ?, ?)
	`
	)
		.bind(name, slug, color || "#5cb85f")
		.run();

	return json({ success: true, slug });
}

/**
 * DELETE /api/admin/gallery/tags/[id]
 * Delete a tag
 */
export async function DELETE({ url, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	if (!platform?.env?.DB) {
		throw error(500, "D1 not configured");
	}

	// Extract ID from URL path
	const pathParts = url.pathname.split("/");
	const id = pathParts[pathParts.length - 1];

	if (!id || id === "tags") {
		throw error(400, "Tag ID required");
	}

	await platform.env.DB.prepare("DELETE FROM gallery_tags WHERE id = ?").bind(id).run();

	return json({ success: true });
}
