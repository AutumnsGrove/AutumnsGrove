import { marked } from 'marked';
import matter from 'gray-matter';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const postsDirectory = 'posts';

/**
 * Get all markdown posts from the posts directory
 * @returns {Array} Array of post objects with metadata and slug
 */
export function getAllPosts() {
	try {
		const fileNames = readdirSync(postsDirectory);
		const posts = fileNames
			.filter(fileName => fileName.endsWith('.md'))
			.map(fileName => {
				const slug = fileName.replace(/\.md$/, '');
				const fullPath = join(postsDirectory, fileName);
				const fileContents = readFileSync(fullPath, 'utf8');
				const { data } = matter(fileContents);

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
	} catch (error) {
		console.error('Error reading posts:', error);
		return [];
	}
}

/**
 * Get a single post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} Post object with content and metadata
 */
export function getPostBySlug(slug) {
	try {
		const fullPath = join(postsDirectory, `${slug}.md`);
		const fileContents = readFileSync(fullPath, 'utf8');
		const { data, content } = matter(fileContents);

		const htmlContent = marked(content);

		return {
			slug,
			title: data.title || 'Untitled',
			date: data.date || new Date().toISOString(),
			tags: data.tags || [],
			description: data.description || '',
			content: htmlContent
		};
	} catch (error) {
		console.error(`Error reading post ${slug}:`, error);
		return null;
	}
}
