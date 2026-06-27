import { getPublishedPosts } from "$lib/server/db.js";

export const prerender = false;

export async function load({ platform }) {
	let posts = [];

	if (platform?.env?.GROVE_DB) {
		try {
			posts = await getPublishedPosts(platform);
		} catch (err) {
			console.error("[BLOG] Failed to load posts:", err.message);
		}
	}

	return { posts };
}
