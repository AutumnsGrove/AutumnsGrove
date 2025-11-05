import { marked } from 'marked';
import matter from 'gray-matter';

// Use Vite's import.meta.glob to load markdown files at build time
// This works in both dev and production (including Cloudflare Workers)
// Path is relative to project root
const modules = import.meta.glob('../../../posts/*.md', { eager: true, query: '?raw', import: 'default' });

/**
 * Get all markdown posts from the posts directory
 * @returns {Array} Array of post objects with metadata and slug
 */
export function getAllPosts() {
	try {
		const posts = Object.entries(modules)
			.map(([filepath, content]) => {
				try {
					// Extract slug from filepath: ../../../posts/example.md -> example
					const slug = filepath.split('/').pop().replace('.md', '');
					const { data } = matter(content);

					return {
						slug,
						title: data.title || 'Untitled',
						date: data.date || new Date().toISOString(),
						tags: data.tags || [],
						description: data.description || ''
					};
				} catch (err) {
					console.error(`Error processing post ${filepath}:`, err);
					return null;
				}
			})
			.filter(Boolean)
			.sort((a, b) => new Date(b.date) - new Date(a.date));

		return posts;
	} catch (err) {
		console.error('Error in getAllPosts:', err);
		return [];
	}
}

/**
 * Get a single post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} Post object with content and metadata
 */
export function getPostBySlug(slug) {
	// Find the matching module by slug
	const entry = Object.entries(modules).find(([filepath]) => {
		const fileSlug = filepath.split('/').pop().replace('.md', '');
		return fileSlug === slug;
	});

	if (!entry) {
		return null;
	}

	const content = entry[1];

	const { data, content: markdown } = matter(content);
	const htmlContent = marked.parse(markdown);

	return {
		slug,
		title: data.title || 'Untitled',
		date: data.date || new Date().toISOString(),
		tags: data.tags || [],
		description: data.description || '',
		content: htmlContent
	};
}
