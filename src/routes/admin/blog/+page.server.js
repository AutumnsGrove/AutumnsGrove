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

    const data = await response.json();
    console.log('Posts returned from worker API:', data);
    console.log('Posts count:', data.posts?.length || 0);

    const posts = (data.posts || []).map(post => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : [],
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
