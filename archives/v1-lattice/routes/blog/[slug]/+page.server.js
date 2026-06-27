import { processAnchorTags } from "$lib/content/markdown";
import { getPostBySlug } from "$lib/server/db.js";
import { sanitizeMarkdown } from "@autumnsgrove/lattice/utils";
import { error } from "@sveltejs/kit";
import { marked } from "marked";

export const prerender = false;

export async function load({ params, platform }) {
  const { slug } = params;

  const post = await getPostBySlug(platform, slug);

  if (!post) {
    throw error(404, "Post not found");
  }

  // Only show published posts on the public site
  if (post.status !== "published") {
    throw error(404, "Post not found");
  }

  let htmlContent = post.html_content || "";

  // Re-parse if html_content looks like raw markdown
  const looksLikeRawMarkdown =
    htmlContent &&
    !htmlContent.includes("<p>") &&
    !htmlContent.includes("<h") &&
    (htmlContent.includes("\n\n") ||
      htmlContent.includes("*") ||
      htmlContent.includes("#"));

  if (looksLikeRawMarkdown && post.markdown_content) {
    htmlContent = sanitizeMarkdown(marked.parse(post.markdown_content));
  }

  const processedHtml = processAnchorTags(htmlContent);
  const headers = extractHeadersFromHtml(processedHtml);

  let gutterContent = [];
  if (post.gutter_content) {
    try {
      gutterContent = JSON.parse(post.gutter_content);
      gutterContent = gutterContent.map((item) => {
        if (
          (item.type === "comment" || item.type === "markdown") &&
          item.content
        ) {
          return {
            ...item,
            content: sanitizeMarkdown(marked.parse(item.content)),
          };
        }
        return item;
      });
    } catch {
      gutterContent = [];
    }
  }

  return {
    post: {
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: post.tags,
      description: post.description,
      content: processedHtml,
      headers,
      gutterContent,
      font: post.font,
    },
  };
}

function extractHeadersFromHtml(html) {
  const headers = [];
  const headerRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    headers.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].trim(),
    });
  }
  return headers;
}
