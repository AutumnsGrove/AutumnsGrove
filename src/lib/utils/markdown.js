import { marked } from 'marked';
import matter from 'gray-matter';
import mermaid from 'mermaid';

// Configure Mermaid
mermaid.initialize({ 
	startOnLoad: false,
	theme: 'default',
	securityLevel: 'loose'
});

// Use Vite's import.meta.glob to load markdown files at build time
// This works in both dev and production (including Cloudflare Workers)
// Path is relative to project root
const modules = import.meta.glob('../../../posts/*.md', { eager: true, query: '?raw', import: 'default' });
const recipeModules = import.meta.glob('../../../recipes/*.md', { eager: true, query: '?raw', import: 'default' });

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
 * Get all recipes from the recipes directory
 * @returns {Array} Array of recipe objects with metadata and slug
 */
export function getAllRecipes() {
	try {
		const recipes = Object.entries(recipeModules)
			.map(([filepath, content]) => {
				try {
					// Extract slug from filepath: ../../../recipes/example.md -> example
					const slug = filepath.split('/').pop().replace('.md', '');
					const { data } = matter(content);

					return {
						slug,
						title: data.title || 'Untitled Recipe',
						date: data.date || new Date().toISOString(),
						tags: data.tags || [],
						description: data.description || ''
					};
				} catch (err) {
					console.error(`Error processing recipe ${filepath}:`, err);
					return null;
				}
			})
			.filter(Boolean)
			.sort((a, b) => new Date(b.date) - new Date(a.date));

		return recipes;
	} catch (err) {
		console.error('Error in getAllRecipes:', err);
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

/**
 * Get a single recipe by slug
 * @param {string} slug - The recipe slug
 * @returns {Object|null} Recipe object with content and metadata
 */
export function getRecipeBySlug(slug) {
	// Find the matching module by slug
	const entry = Object.entries(recipeModules).find(([filepath]) => {
		const fileSlug = filepath.split('/').pop().replace('.md', '');
		return fileSlug === slug;
	});

	if (!entry) {
		return null;
	}

	const content = entry[1];

	const { data, content: markdown } = matter(content);
	
	// Process Mermaid diagrams in the content
	const processedContent = processMermaidDiagrams(markdown);
	const htmlContent = marked.parse(processedContent);

	return {
		slug,
		title: data.title || 'Untitled Recipe',
		date: data.date || new Date().toISOString(),
		tags: data.tags || [],
		description: data.description || '',
		content: htmlContent
	};
}

/**
 * Process Mermaid diagrams in markdown content
 * @param {string} markdown - The markdown content
 * @returns {string} Processed markdown with Mermaid diagrams
 */
function processMermaidDiagrams(markdown) {
	// Replace Mermaid code blocks with special divs that will be processed later
	return markdown.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagramCode) => {
		const diagramId = 'mermaid-' + Math.random().toString(36).substr(2, 9);
		return `<div class="mermaid-container" id="${diagramId}" data-diagram="${encodeURIComponent(diagramCode.trim())}"></div>`;
	});
}

/**
 * Render Mermaid diagrams in the DOM
 * This should be called after the content is mounted
 */
export async function renderMermaidDiagrams() {
	const containers = document.querySelectorAll('.mermaid-container');
	
	for (const container of containers) {
		try {
			const diagramCode = decodeURIComponent(container.dataset.diagram);
			const { svg } = await mermaid.render(container.id, diagramCode);
			container.innerHTML = svg;
		} catch (error) {
			console.error('Error rendering Mermaid diagram:', error);
			container.innerHTML = '<p class="error">Error rendering diagram</p>';
		}
	}
}
