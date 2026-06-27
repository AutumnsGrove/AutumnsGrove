import { error } from "@sveltejs/kit";
import { getPostBySlug } from "$lib/server/db.js";

export async function load({ params, platform }) {
	if (!platform?.env?.GROVE_DB) {
		throw error(503, "Database not available");
	}

	const post = await getPostBySlug(platform, params.slug);

	if (!post) {
		throw error(404, "Post not found");
	}

	return { post };
}
