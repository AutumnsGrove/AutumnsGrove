import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import {
  validateCSRF,
  sanitizeObject,
  sanitizeMarkdown,
} from "@autumnsgrove/lattice/utils";
import {
  getAllPosts,
  createPost,
  postExistsBySlug,
} from "$lib/server/db.js";

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

    const MAX_TITLE_LENGTH = 200;
    const MAX_DESCRIPTION_LENGTH = 500;
    const MAX_MARKDOWN_LENGTH = 1024 * 1024;
    const MAX_SLUG_LENGTH = 100;

    if (data.title.length > MAX_TITLE_LENGTH) {
      throw error(400, `Title too long (max ${MAX_TITLE_LENGTH} characters)`);
    }
    if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
      throw error(400, `Description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`);
    }
    if (data.markdown_content.length > MAX_MARKDOWN_LENGTH) {
      throw error(400, "Content too large (max 1MB)");
    }
    if (data.slug.length > MAX_SLUG_LENGTH) {
      throw error(400, `Slug too long (max ${MAX_SLUG_LENGTH} characters)`);
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

    return json({ success: true, slug, message: "Post created successfully" });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error creating post:", err);
    throw error(500, "Failed to create post");
  }
}
