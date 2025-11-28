import { json, error } from "@sveltejs/kit";
import { marked } from "marked";

/**
 * GET /api/posts - List all posts from D1
 */
export async function GET({ platform, locals }) {
  // Auth check for admin access
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!platform?.env?.POSTS_DB) {
    throw error(500, "Posts database not configured");
  }

  try {
    const result = await platform.env.POSTS_DB.prepare(
      `SELECT slug, title, date, tags, description, last_synced, updated_at
       FROM posts
       ORDER BY date DESC`
    ).all();

    const posts = result.results.map((post) => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
    }));

    return json({ posts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    throw error(500, "Failed to fetch posts");
  }
}

/**
 * POST /api/posts - Create a new post in D1
 */
export async function POST({ request, platform, locals }) {
  // Auth check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!platform?.env?.POSTS_DB) {
    throw error(500, "Posts database not configured");
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.slug || !data.markdown_content) {
      throw error(400, "Missing required fields: title, slug, markdown_content");
    }

    // Sanitize slug
    const slug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existing = await platform.env.POSTS_DB.prepare(
      "SELECT slug FROM posts WHERE slug = ?"
    ).bind(slug).first();

    if (existing) {
      throw error(409, "A post with this slug already exists");
    }

    // Generate HTML from markdown
    const html_content = marked.parse(data.markdown_content);

    // Generate a simple hash of the content
    const encoder = new TextEncoder();
    const contentData = encoder.encode(data.markdown_content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", contentData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const file_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const now = new Date().toISOString();
    const tags = JSON.stringify(data.tags || []);

    await platform.env.POSTS_DB.prepare(
      `INSERT INTO posts (slug, title, date, tags, description, markdown_content, html_content, file_hash, last_synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        slug,
        data.title,
        data.date || now.split("T")[0],
        tags,
        data.description || "",
        data.markdown_content,
        html_content,
        file_hash,
        now,
        now,
        now
      )
      .run();

    return json({
      success: true,
      slug,
      message: "Post created successfully",
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error creating post:", err);
    throw error(500, "Failed to create post");
  }
}
