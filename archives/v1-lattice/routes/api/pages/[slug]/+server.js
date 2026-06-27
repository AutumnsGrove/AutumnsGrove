import { json, error } from "@sveltejs/kit";
import { marked } from "marked";
import {
  validateCSRF,
  sanitizeObject,
  sanitizeMarkdown,
} from "@autumnsgrove/lattice/utils";
import { getPageBySlug, getGroveDb } from "$lib/server/db.js";

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

    const existing = await getPageBySlug(platform, slug);
    if (!existing) {
      throw error(404, "Page not found");
    }

    const { db, tenantId } = getGroveDb(platform);
    const html_content = sanitizeMarkdown(marked.parse(data.markdown_content));
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        `UPDATE pages
         SET title = ?, description = ?, markdown_content = ?, html_content = ?, hero = ?, updated_at = ?
         WHERE tenant_id = ? AND slug = ?`,
      )
      .bind(
        data.title,
        data.description || "",
        data.markdown_content,
        html_content,
        data.hero || null,
        now,
        tenantId,
        slug,
      )
      .run();

    return json({ success: true, slug, message: "Page updated successfully" });
  } catch (err) {
    if (err.status) throw err;
    console.error("Error updating page:", err);
    throw error(500, "Failed to update page");
  }
}
