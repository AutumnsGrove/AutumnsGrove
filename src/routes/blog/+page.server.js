import { getAllPosts } from '$lib/utils/markdown.js';

export const prerender = true;

export function load({ locals }) {
	const posts = getAllPosts();

	return {
		posts,
		user: locals.user || null
	};
}
