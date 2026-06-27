import { error } from "@sveltejs/kit";
import { getPostBySlug } from "$lib/server/db.js";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
import { extractHeadersFromHtml } from "$lib/utils/headers";
import { marked } from "marked";

export const prerender = false;

export async function load({ params, platform }) {
	if (!platform?.env?.GROVE_DB) {
		throw error(503, "Database not available");
	}

	const post = await getPostBySlug(platform, params.slug);

	if (!post || post.status !== "published") {
		throw error(404, "Post not found");
	}

	let content = post.html_content;
	if (!content && post.markdown_content) {
		content = sanitizeMarkdown(marked.parse(post.markdown_content));
	}

	const headers = extractHeadersFromHtml(content || "");

	let gutterContent = [];
	if (post.gutter_content) {
		try {
			const items = JSON.parse(post.gutter_content);
			gutterContent = items.map((item) => {
				if ((item.type === "comment" || item.type === "markdown") && item.content) {
					return { ...item, content: sanitizeMarkdown(marked.parse(item.content)) };
				}
				return item;
			});
		} catch {
			gutterContent = [];
		}
	}

	return {
		slug: post.slug,
		title: post.title,
		date: post.date,
		tags: post.tags,
		description: post.description,
		content: content || "",
		headers,
		gutterContent,
	};
}
