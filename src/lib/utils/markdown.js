import { marked } from 'marked';
import matter from 'gray-matter';

// Use Vite's import.meta.glob to load markdown files at build time
// This works in both dev and production (including Cloudflare Workers)
const modules = import.meta.glob('/posts/*.md', { eager: true, query: '?raw', import: 'default' });

/**
 * Get all markdown posts from the posts directory
 * @returns {Array} Array of post objects with metadata and slug
 */
export function getAllPosts() {
	const posts = Object.entries(modules)
		.map(([filepath, content]) => {
			// Extract slug from filepath: /posts/example.md -> example
			const slug = filepath.replace('/posts/', '').replace('.md', '');
			const { data } = matter(content);

			return {
				slug,
				title: data.title || 'Untitled',
				date: data.date || new Date().toISOString(),
				tags: data.tags || [],
				description: data.description || ''
			};
		})
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	return posts;
}

/**
 * Get a single post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} Post object with content and metadata
 */
export function getPostBySlug(slug) {
	const filepath = `/posts/${slug}.md`;
	const content = modules[filepath];

	if (!content) {
		return null;
	}

	const { data, content: markdown } = matter(content);
	const htmlContent = marked(markdown);

	return {
		slug,
		title: data.title || 'Untitled',
		date: data.date || new Date().toISOString(),
		tags: data.tags || [],
		description: data.description || '',
		content: htmlContent
	};
}
