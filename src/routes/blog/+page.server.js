import { getAllPosts } from '$lib/utils/markdown.js';

export const prerender = true;

export function load() {
	const posts = getAllPosts();

	return {
		posts
	};
}
