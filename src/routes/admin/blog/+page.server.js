import { getAllPosts } from "$lib/server/db.js";

export async function load({ platform }) {
	let posts = [];

	if (platform?.env?.GROVE_DB) {
		try {
			posts = await getAllPosts(platform);
		} catch (err) {
			console.error("[ADMIN BLOG] Failed to load posts:", err.message);
		}
	}

	return { posts };
}
