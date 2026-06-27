import { processAnchorTags } from "$lib/content/markdown";
import { getPageBySlug, getGroveDb } from "$lib/server/db.js";
import { sanitizeMarkdown } from "@autumnsgrove/lattice/utils";
import { error } from "@sveltejs/kit";
import { marked } from "marked";

export const prerender = false;

export async function load({ platform }) {
  let page = null;

  if (platform?.env?.GROVE_DB) {
    try {
      const pageData = await getPageBySlug(platform, "home");

      if (pageData) {
        let hero = null;
        if (pageData.hero) {
          try {
            hero = JSON.parse(pageData.hero);
          } catch {
            hero = null;
          }
        }

        let htmlContent = pageData.html_content;
        if (!htmlContent && pageData.markdown_content) {
          htmlContent = sanitizeMarkdown(marked.parse(pageData.markdown_content));
        }

        const headers = extractHeadersFromHtml(htmlContent || "");
        const gutterContent = parseGutterContent(pageData.gutter_content);

        page = {
          slug: pageData.slug,
          title: pageData.title,
          description: pageData.description || "",
          hero,
          content: htmlContent,
          headers,
          gutterContent,
          font: pageData.font || "default",
        };
      }
    } catch (err) {
      console.error("Failed to load home page:", err);
    }
  }

  if (!page) {
    throw error(404, "Home page not found");
  }

  let latestPost = null;

  if (platform?.env?.GROVE_DB) {
    try {
      const { db, tenantId } = getGroveDb(platform);
      const post = await db
        .prepare(
          `SELECT slug, title, published_at, tags, description, html_content, gutter_content, font
           FROM posts
           WHERE tenant_id = ? AND status = 'published'
           ORDER BY published_at DESC
           LIMIT 1`,
        )
        .bind(tenantId)
        .first();

      if (post) {
        const processedHtml = processAnchorTags(post.html_content || "");
        const headers = extractHeadersFromHtml(processedHtml);

        let tags = [];
        if (post.tags) {
          try { tags = JSON.parse(post.tags); } catch { tags = []; }
        }

        const gutterContent = parseGutterContent(post.gutter_content);

        latestPost = {
          slug: post.slug,
          title: post.title,
          date: post.published_at
            ? new Date(post.published_at * 1000).toISOString().split("T")[0]
            : null,
          tags,
          description: post.description || "",
          content: processedHtml,
          headers,
          gutterContent,
          font: post.font || "default",
        };
      }
    } catch (err) {
      console.error("Failed to load latest post:", err);
    }
  }

  return {
    title: page.title,
    description: page.description,
    hero: page.hero,
    content: page.content,
    headers: page.headers,
    gutterContent: page.gutterContent,
    latestPost,
  };
}

function parseGutterContent(raw) {
  if (!raw) return [];
  try {
    let items = JSON.parse(raw);
    return items.map((item) => {
      if ((item.type === "comment" || item.type === "markdown") && item.content) {
        return { ...item, content: sanitizeMarkdown(marked.parse(item.content)) };
      }
      return item;
    });
  } catch {
    return [];
  }
}

function extractHeadersFromHtml(html) {
  const headers = [];
  const headerRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    headers.push({ level: parseInt(match[1]), id: match[2], text: match[3].trim() });
  }
  return headers;
}
