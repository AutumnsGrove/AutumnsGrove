import { getAllPosts } from '$lib/utils/markdown.js';

export function load() {
	const posts = getAllPosts();

	return {
		posts
	};
}
