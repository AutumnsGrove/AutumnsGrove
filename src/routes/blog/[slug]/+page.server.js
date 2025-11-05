import { getPostBySlug, getAllPosts } from '$lib/utils/markdown.js';
import { error } from '@sveltejs/kit';

export function load({ params }) {
	const post = getPostBySlug(params.slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return {
		post
	};
}

// Generate static paths for all posts during build
export function entries() {
	const posts = getAllPosts();
	return posts.map(post => ({ slug: post.slug }));
}

export const prerender = true;
