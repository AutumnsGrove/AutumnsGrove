import { error } from "@sveltejs/kit";

/**
 * Get the shared Grove DB and tenant ID from the platform.
 * Every query against GROVE_DB must be scoped by tenant_id.
 * @param {App.Platform} platform
 * @returns {{ db: D1Database, tenantId: string }}
 */
export function getGroveDb(platform) {
  if (!platform?.env?.GROVE_DB) {
    throw error(500, "Grove database not configured");
  }
  return {
    db: platform.env.GROVE_DB,
    tenantId: platform.env.TENANT_ID,
  };
}

/**
 * Get the curios DB (gallery, timeline, guestbook).
 * @param {App.Platform} platform
 * @returns {{ db: D1Database, tenantId: string }}
 */
export function getCurioDb(platform) {
  if (!platform?.env?.CURIO_DB) {
    throw error(500, "Curio database not configured");
  }
  return {
    db: platform.env.CURIO_DB,
    tenantId: platform.env.TENANT_ID,
  };
}

// ─── Date helpers ───
// Grove uses INTEGER unix epoch for published_at/created_at/updated_at.
// AutumnsGrove UI expects "YYYY-MM-DD" date strings.

function epochToDateStr(epoch) {
  if (!epoch) return null;
  return new Date(epoch * 1000).toISOString().split("T")[0];
}

function dateStrToEpoch(dateStr) {
  if (!dateStr) return Math.floor(Date.now() / 1000);
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// ─── Posts (GROVE_DB, tenant-scoped) ───

export async function getPublishedPosts(platform) {
  const { db, tenantId } = getGroveDb(platform);
  const result = await db
    .prepare(
      `SELECT slug, title, published_at, tags, description
       FROM posts
       WHERE tenant_id = ? AND status = 'published'
       ORDER BY published_at DESC`,
    )
    .bind(tenantId)
    .all();

  return result.results.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: epochToDateStr(post.published_at),
    tags: post.tags ? JSON.parse(post.tags) : [],
    description: post.description || "",
  }));
}

export async function getAllPosts(platform) {
  const { db, tenantId } = getGroveDb(platform);
  const result = await db
    .prepare(
      `SELECT slug, title, status, published_at, tags, description, updated_at
       FROM posts
       WHERE tenant_id = ?
       ORDER BY published_at DESC`,
    )
    .bind(tenantId)
    .all();

  return result.results.map((post) => ({
    slug: post.slug,
    title: post.title,
    status: post.status,
    date: epochToDateStr(post.published_at),
    tags: post.tags ? JSON.parse(post.tags) : [],
    description: post.description || "",
    updated_at: post.updated_at,
  }));
}

export async function getPostBySlug(platform, slug) {
  const { db, tenantId } = getGroveDb(platform);
  const post = await db
    .prepare(
      `SELECT slug, title, published_at, tags, description, html_content,
              markdown_content, gutter_content, font, status
       FROM posts
       WHERE tenant_id = ? AND slug = ?`,
    )
    .bind(tenantId, slug)
    .first();

  if (!post) return null;

  return {
    slug: post.slug,
    title: post.title,
    date: epochToDateStr(post.published_at),
    tags: post.tags ? JSON.parse(post.tags) : [],
    description: post.description || "",
    html_content: post.html_content,
    markdown_content: post.markdown_content,
    gutter_content: post.gutter_content,
    font: post.font || "default",
    status: post.status,
  };
}

export async function createPost(platform, data) {
  const { db, tenantId } = getGroveDb(platform);
  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO posts (id, tenant_id, slug, title, description, markdown_content,
        html_content, gutter_content, tags, status, font, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      tenantId,
      data.slug,
      data.title,
      data.description || "",
      data.markdown_content,
      data.html_content,
      data.gutter_content || "[]",
      JSON.stringify(data.tags || []),
      data.status || "published",
      data.font || "default",
      data.date ? dateStrToEpoch(data.date) : now,
      now,
      now,
    )
    .run();

  return { id, slug: data.slug };
}

export async function updatePost(platform, slug, data) {
  const { db, tenantId } = getGroveDb(platform);
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `UPDATE posts
       SET title = ?, description = ?, markdown_content = ?, html_content = ?,
           gutter_content = ?, tags = ?, font = ?, published_at = ?, updated_at = ?
       WHERE tenant_id = ? AND slug = ?`,
    )
    .bind(
      data.title,
      data.description || "",
      data.markdown_content,
      data.html_content,
      data.gutter_content || "[]",
      JSON.stringify(data.tags || []),
      data.font || "default",
      data.date ? dateStrToEpoch(data.date) : now,
      now,
      tenantId,
      slug,
    )
    .run();
}

export async function deletePost(platform, slug) {
  const { db, tenantId } = getGroveDb(platform);
  await db
    .prepare("DELETE FROM posts WHERE tenant_id = ? AND slug = ?")
    .bind(tenantId, slug)
    .run();
}

export async function postExistsBySlug(platform, slug) {
  const { db, tenantId } = getGroveDb(platform);
  const row = await db
    .prepare("SELECT slug FROM posts WHERE tenant_id = ? AND slug = ?")
    .bind(tenantId, slug)
    .first();
  return !!row;
}

// ─── Pages (GROVE_DB, tenant-scoped) ───

export async function getPages(platform) {
  const { db, tenantId } = getGroveDb(platform);
  const result = await db
    .prepare(
      `SELECT slug, title, description, type, updated_at
       FROM pages
       WHERE tenant_id = ?
       ORDER BY title ASC`,
    )
    .bind(tenantId)
    .all();
  return result.results;
}

export async function getPageBySlug(platform, slug) {
  const { db, tenantId } = getGroveDb(platform);
  return db
    .prepare(
      `SELECT slug, title, description, type, markdown_content, html_content,
              gutter_content, font
       FROM pages
       WHERE tenant_id = ? AND slug = ?`,
    )
    .bind(tenantId, slug)
    .first();
}

// ─── Site Settings (GROVE_DB, tenant-scoped) ───

export async function getSiteSettings(platform) {
  const { db, tenantId } = getGroveDb(platform);
  const result = await db
    .prepare(
      "SELECT setting_key, setting_value FROM site_settings WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .all();

  const settings = { font_family: "alagard" };
  if (result?.results) {
    for (const row of result.results) {
      settings[row.setting_key] = row.setting_value;
    }
  }
  return settings;
}

export async function updateSiteSetting(platform, key, value) {
  const { db, tenantId } = getGroveDb(platform);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO site_settings (tenant_id, setting_key, setting_value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (tenant_id, setting_key)
       DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`,
    )
    .bind(tenantId, key, value, now)
    .run();
}

// ─── Media (R2 bucket) ───

export function getMediaBucket(platform) {
  if (!platform?.env?.MEDIA) {
    throw error(500, "Media storage not configured");
  }
  return platform.env.MEDIA;
}
