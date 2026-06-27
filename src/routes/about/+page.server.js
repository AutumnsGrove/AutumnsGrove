import { getPageBySlug } from "$lib/server/db.js";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
import { marked } from "marked";

export const prerender = false;

export async function load({ platform }) {
	let content = null;
	let title = "About";

	if (platform?.env?.GROVE_DB) {
		try {
			const page = await getPageBySlug(platform, "about");
			if (page) {
				title = page.title || "About";
				content = page.html_content;
				if (!content && page.markdown_content) {
					content = sanitizeMarkdown(marked.parse(page.markdown_content));
				}
			}
		} catch (err) {
			console.error("[ABOUT] Failed to load page:", err.message);
		}
	}

	return { title, content };
}
