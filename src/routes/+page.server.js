import { getPublishedPosts, getPageBySlug } from "$lib/server/db.js";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
import { marked } from "marked";

export const prerender = false;

export async function load({ platform }) {
	let hero = null;
	let content = null;

	if (platform?.env?.GROVE_DB) {
		try {
			const page = await getPageBySlug(platform, "home");
			if (page) {
				if (page.hero) {
					try { hero = JSON.parse(page.hero); } catch { hero = null; }
				}
				content = page.html_content;
				if (!content && page.markdown_content) {
					content = sanitizeMarkdown(marked.parse(page.markdown_content));
				}
			}
		} catch (err) {
			console.error("[HOME] Failed to load page:", err.message);
		}
	}

	let recentPosts = [];

	if (platform?.env?.GROVE_DB) {
		try {
			const posts = await getPublishedPosts(platform);
			recentPosts = posts.slice(0, 5);
		} catch (err) {
			console.error("[HOME] Failed to load posts:", err.message);
		}
	}

	return {
		hero: hero ?? { title: "Autumns Grove", subtitle: "a place for words, projects, and quiet thoughts." },
		content,
		recentPosts,
	};
}
