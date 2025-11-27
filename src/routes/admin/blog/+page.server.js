// Fetch posts from D1 database via Cloudflare Worker API
const WORKER_URL = 'https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev';

export async function load() {
  console.log('=== Admin Blog Page Server Load START ===');
  console.log('Fetching posts from D1 via worker API:', `${WORKER_URL}/posts`);

  try {
    const response = await fetch(`${WORKER_URL}/posts`);

    if (!response.ok) {
      console.error('Failed to fetch posts from worker:', response.status, response.statusText);
      return { posts: [] };
    }

    // Worker API returns an array directly, not {posts: [...]}
    const postsArray = await response.json();
    console.log('Posts returned from worker API:', postsArray);
    console.log('Posts count:', postsArray.length);

    // Transform posts - tags are already parsed by the worker
    const posts = postsArray.map(post => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: Array.isArray(post.tags) ? post.tags : [],
      description: post.description || '',
    }));

    console.log('Transformed posts:', posts);
    console.log('=== Admin Blog Page Server Load END ===');

    return { posts };
  } catch (error) {
    console.error('Error fetching posts from worker:', error);
    return { posts: [] };
  }
}
