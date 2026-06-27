import { getPublishedPosts } from "$lib/server/db.js";

export const prerender = false;

export async function GET({ platform, url }) {
	let posts = [];

	if (platform?.env?.GROVE_DB) {
		try {
			posts = await getPublishedPosts(platform);
		} catch (err) {
			console.error("[RSS] Failed to load posts:", err.message);
		}
	}

	const siteUrl = url.origin;

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Autumns Grove</title>
    <description>Writing about code, creativity, and building things that matter.</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      ${post.date ? `<pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ""}
    </item>`,
      )
      .join("\n    ")}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "max-age=600",
		},
	});
}

function escapeXml(str) {
	if (!str) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
