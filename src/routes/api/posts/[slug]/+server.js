import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import { validateCSRF } from "$lib/utils/csrf";
import { sanitizeObject } from "$lib/utils/validation";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
import { getPostBySlug, updatePost, deletePost, postExistsBySlug } from "$lib/server/db.js";

export async function GET({ params, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	try {
		const post = await getPostBySlug(platform, params.slug);
		if (!post) {
			throw error(404, "Post not found");
		}
		return json({ post });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error fetching post:", err);
		throw error(500, "Failed to fetch post");
	}
}

export async function PUT({ params, request, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}
	if (!validateCSRF(request)) {
		throw error(403, "Invalid origin");
	}

	try {
		const data = sanitizeObject(await request.json());

		if (!data.title || !data.markdown_content) {
			throw error(400, "Missing required fields: title, markdown_content");
		}

		if (data.title.length > 200) {
			throw error(400, "Title too long (max 200 characters)");
		}
		if (data.description && data.description.length > 500) {
			throw error(400, "Description too long (max 500 characters)");
		}
		if (data.markdown_content.length > 1024 * 1024) {
			throw error(400, "Content too large (max 1MB)");
		}

		if (!(await postExistsBySlug(platform, params.slug))) {
			throw error(404, "Post not found");
		}

		const html_content = sanitizeMarkdown(marked.parse(data.markdown_content));

		await updatePost(platform, params.slug, {
			title: data.title,
			date: data.date,
			tags: data.tags,
			description: data.description,
			markdown_content: data.markdown_content,
			html_content,
			gutter_content: data.gutter_content,
			font: data.font,
		});

		return json({ success: true, slug: params.slug });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error updating post:", err);
		throw error(500, "Failed to update post");
	}
}

export async function DELETE({ request, params, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}
	if (!validateCSRF(request)) {
		throw error(403, "Invalid origin");
	}

	try {
		if (!(await postExistsBySlug(platform, params.slug))) {
			throw error(404, "Post not found");
		}

		await deletePost(platform, params.slug);
		return json({ success: true });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error deleting post:", err);
		throw error(500, "Failed to delete post");
	}
}
