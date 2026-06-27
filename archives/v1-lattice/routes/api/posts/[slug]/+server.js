import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import {
  validateCSRF,
  sanitizeObject,
  sanitizeMarkdown,
} from "@autumnsgrove/lattice/utils";
import {
  getPostBySlug,
  updatePost,
  deletePost,
  postExistsBySlug,
} from "$lib/server/db.js";

export async function GET({ params, platform, locals }) {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  const { slug } = params;
  if (!slug) {
    throw error(400, "Slug is required");
  }

  try {
    const post = await getPostBySlug(platform, slug);
    if (!post) {
      throw error(404, "Post not found");
    }
    return json({ source: "d1", post });
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

  const { slug } = params;
  if (!slug) {
    throw error(400, "Slug is required");
  }

  try {
    const data = sanitizeObject(await request.json());

    if (!data.title || !data.markdown_content) {
      throw error(400, "Missing required fields: title, markdown_content");
    }

    const MAX_TITLE_LENGTH = 200;
    const MAX_DESCRIPTION_LENGTH = 500;
    const MAX_MARKDOWN_LENGTH = 1024 * 1024;

    if (data.title.length > MAX_TITLE_LENGTH) {
      throw error(400, `Title too long (max ${MAX_TITLE_LENGTH} characters)`);
    }
    if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
      throw error(400, `Description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`);
    }
    if (data.markdown_content.length > MAX_MARKDOWN_LENGTH) {
      throw error(400, "Content too large (max 1MB)");
    }

    if (!(await postExistsBySlug(platform, slug))) {
      throw error(404, "Post not found");
    }

    const html_content = sanitizeMarkdown(marked.parse(data.markdown_content));

    await updatePost(platform, slug, {
      title: data.title,
      date: data.date,
      tags: data.tags,
      description: data.description,
      markdown_content: data.markdown_content,
      html_content,
      gutter_content: data.gutter_content,
      font: data.font,
    });

    return json({ success: true, slug, message: "Post updated successfully" });
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

  const { slug } = params;
  if (!slug) {
    throw error(400, "Slug is required");
  }

  try {
    if (!(await postExistsBySlug(platform, slug))) {
      throw error(404, "Post not found");
    }

    await deletePost(platform, slug);
    return json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error deleting post:", err);
    throw error(500, "Failed to delete post");
  }
}
