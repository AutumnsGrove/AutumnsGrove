import { getPostBySlug, getAllPosts, extractHeaders, processAnchorTags } from '$lib/utils/markdown.js';
import { error } from '@sveltejs/kit';

export async function load({ params, platform }) {
	const { slug } = params;

	// Try D1 first for posts created via admin panel
	if (platform?.env?.POSTS_DB) {
		try {
			const post = await platform.env.POSTS_DB.prepare(
				`SELECT slug, title, date, tags, description, html_content, gutter_content, font
				 FROM posts WHERE slug = ?`
			).bind(slug).first();

			if (post) {
				// Process anchor tags in HTML content (same as filesystem posts)
				const processedHtml = processAnchorTags(post.html_content || '');

				// Extract headers from HTML for table of contents
				// Note: For D1 posts, we extract from HTML since we don't store raw markdown
				const headers = extractHeadersFromHtml(processedHtml);

				return {
					post: {
						slug: post.slug,
						title: post.title,
						date: post.date,
						tags: post.tags ? JSON.parse(post.tags) : [],
						description: post.description || '',
						content: processedHtml,
						headers,
						gutterContent: post.gutter_content ? JSON.parse(post.gutter_content) : [],
						font: post.font || 'default'
					}
				};
			}
		} catch (err) {
			console.error('D1 fetch error:', err);
			// Fall through to filesystem fallback
		}
	}

	// Fall back to filesystem (UserContent)
	const post = getPostBySlug(slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	// Add default font for filesystem posts
	return {
		post: {
			...post,
			font: 'default'
		}
	};
}

/**
 * Extract headers from HTML content for table of contents
 * Used for D1 posts where raw markdown isn't stored
 * @param {string} html - The HTML content
 * @returns {Array} Array of header objects with level, text, and id
 */
function extractHeadersFromHtml(html) {
	const headers = [];
	const headerRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;

	let match;
	while ((match = headerRegex.exec(html)) !== null) {
		headers.push({
			level: parseInt(match[1]),
			id: match[2],
			text: match[3].trim()
		});
	}

	return headers;
}

// Generate static paths for UserContent posts during build
// D1 posts are handled dynamically at runtime
export function entries() {
	const posts = getAllPosts();
	return posts.map(post => ({ slug: post.slug }));
}
