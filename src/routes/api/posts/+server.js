import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import { validateCSRF } from "$lib/utils/csrf";
import { sanitizeObject } from "$lib/utils/validation";
import { sanitizeMarkdown } from "$lib/utils/sanitize";
import { getAllPosts, createPost, postExistsBySlug } from "$lib/server/db.js";

export async function GET({ platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	try {
		const posts = await getAllPosts(platform);
		return json({ posts });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error fetching posts:", err);
		throw error(500, "Failed to fetch posts");
	}
}

export async function POST({ request, platform, locals }) {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}
	if (!validateCSRF(request)) {
		throw error(403, "Invalid origin");
	}

	try {
		const data = sanitizeObject(await request.json());

		if (!data.title || !data.slug || !data.markdown_content) {
			throw error(400, "Missing required fields: title, slug, markdown_content");
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
		if (data.slug.length > 100) {
			throw error(400, "Slug too long (max 100 characters)");
		}

		const slug = data.slug
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		if (await postExistsBySlug(platform, slug)) {
			throw error(409, "A post with this slug already exists");
		}

		const html_content = sanitizeMarkdown(marked.parse(data.markdown_content));

		await createPost(platform, {
			slug,
			title: data.title,
			date: data.date,
			tags: data.tags,
			description: data.description,
			markdown_content: data.markdown_content,
			html_content,
			gutter_content: data.gutter_content,
			font: data.font,
		});

		return json({ success: true, slug });
	} catch (err) {
		if (err.status) throw err;
		console.error("Error creating post:", err);
		throw error(500, "Failed to create post");
	}
}
