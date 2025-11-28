import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import { getPostBySlug } from "$lib/utils/markdown.js";

/**
 * GET /api/posts/[slug] - Get a single post
 * Tries D1 first, falls back to filesystem (UserContent)
 */
export async function GET({ params, platform, locals }) {
  // Auth check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  // Try D1 first
  if (platform?.env?.POSTS_DB) {
    try {
      const post = await platform.env.POSTS_DB.prepare(
        `SELECT slug, title, date, tags, description, markdown_content, html_content, last_synced, updated_at
         FROM posts
         WHERE slug = ?`
      )
        .bind(slug)
        .first();

      if (post) {
        return json({
          source: "d1",
          post: {
            ...post,
            tags: post.tags ? JSON.parse(post.tags) : [],
          },
        });
      }
    } catch (err) {
      console.error("D1 fetch error:", err);
      // Fall through to filesystem fallback
    }
  }

  // Fallback to filesystem (UserContent)
  try {
    const post = getPostBySlug(slug);

    if (!post) {
      throw error(404, "Post not found");
    }

    // Reconstruct markdown from the post (we don't have raw markdown stored)
    // For filesystem posts, we return the content without raw markdown
    return json({
      source: "filesystem",
      post: {
        slug: post.slug,
        title: post.title,
        date: post.date,
        tags: post.tags || [],
        description: post.description || "",
        html_content: post.content,
        markdown_content: null, // Not available from filesystem read
      },
    });
  } catch (err) {
    if (err.status === 404) throw err;
    console.error("Filesystem fetch error:", err);
    throw error(500, "Failed to fetch post");
  }
}

/**
 * PUT /api/posts/[slug] - Update an existing post in D1
 */
export async function PUT({ params, request, platform, locals }) {
  // Auth check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!platform?.env?.POSTS_DB) {
    throw error(500, "Posts database not configured");
  }

  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.markdown_content) {
      throw error(400, "Missing required fields: title, markdown_content");
    }

    // Check if post exists
    const existing = await platform.env.POSTS_DB.prepare(
      "SELECT slug FROM posts WHERE slug = ?"
    )
      .bind(slug)
      .first();

    if (!existing) {
      throw error(404, "Post not found");
    }

    // Generate HTML from markdown
    const html_content = marked.parse(data.markdown_content);

    // Generate a simple hash of the content
    const encoder = new TextEncoder();
    const contentData = encoder.encode(data.markdown_content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", contentData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const file_hash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const now = new Date().toISOString();
    const tags = JSON.stringify(data.tags || []);

    await platform.env.POSTS_DB.prepare(
      `UPDATE posts
       SET title = ?, date = ?, tags = ?, description = ?, markdown_content = ?, html_content = ?, file_hash = ?, updated_at = ?
       WHERE slug = ?`
    )
      .bind(
        data.title,
        data.date || now.split("T")[0],
        tags,
        data.description || "",
        data.markdown_content,
        html_content,
        file_hash,
        now,
        slug
      )
      .run();

    return json({
      success: true,
      slug,
      message: "Post updated successfully",
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error updating post:", err);
    throw error(500, "Failed to update post");
  }
}

/**
 * DELETE /api/posts/[slug] - Delete a post from D1
 */
export async function DELETE({ params, platform, locals }) {
  // Auth check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!platform?.env?.POSTS_DB) {
    throw error(500, "Posts database not configured");
  }

  const { slug } = params;

  if (!slug) {
    throw error(400, "Slug is required");
  }

  try {
    // Check if post exists
    const existing = await platform.env.POSTS_DB.prepare(
      "SELECT slug FROM posts WHERE slug = ?"
    )
      .bind(slug)
      .first();

    if (!existing) {
      throw error(404, "Post not found");
    }

    await platform.env.POSTS_DB.prepare("DELETE FROM posts WHERE slug = ?")
      .bind(slug)
      .run();

    return json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error deleting post:", err);
    throw error(500, "Failed to delete post");
  }
}
