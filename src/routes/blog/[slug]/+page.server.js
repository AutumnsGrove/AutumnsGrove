import { error } from "@sveltejs/kit";
import { getPostBySlug } from "$lib/server/db.js";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
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

	return {
		slug: post.slug,
		title: post.title,
		date: post.date,
		tags: post.tags,
		description: post.description,
		content: content || "",
		gutter_content: post.gutter_content,
	};
}
