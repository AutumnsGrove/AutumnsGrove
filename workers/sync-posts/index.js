import { marked } from 'marked';
import matter from 'gray-matter';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route requests based on path
      if (url.pathname === '/sync' && request.method === 'POST') {
        return await handleSync(request, env, corsHeaders);
      } else if (url.pathname === '/posts' && request.method === 'GET') {
        return await handleGetPosts(env, corsHeaders);
      } else if (url.pathname.startsWith('/posts/') && request.method === 'GET') {
        const slug = url.pathname.split('/')[2];
        return await handleGetPost(slug, env, corsHeaders);
      } else if (url.pathname === '/health' && request.method === 'GET') {
        return new Response('OK', { headers: corsHeaders });
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleSync(request, env, corsHeaders) {
  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.SYNC_API_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const posts = await request.json();
  const results = {
    synced: 0,
    errors: [],
    details: []
  };

  for (const post of posts) {
    try {
      // Parse markdown content to extract metadata
      const { data, content: markdownContent } = matter(post.content);
      const htmlContent = marked.parse(markdownContent);
      
      // Generate file hash for change detection
      const fileHash = await generateHash(post.content);
      
      // Check if post exists and if it needs updating
      const existingPost = await env.DB.prepare(
        'SELECT file_hash FROM posts WHERE slug = ?'
      ).bind(post.slug).first();

      if (existingPost && existingPost.file_hash === fileHash) {
        // No changes, skip
        results.details.push({
          slug: post.slug,
          action: 'skipped',
          reason: 'no changes'
        });
        continue;
      }

      // Prepare tags as JSON string
      const tagsJson = JSON.stringify(data.tags || []);

      if (existingPost) {
        // Update existing post
        await env.DB.prepare(`
          UPDATE posts 
          SET title = ?, date = ?, tags = ?, description = ?, 
              markdown_content = ?, html_content = ?, file_hash = ?, 
              last_synced = ?, updated_at = CURRENT_TIMESTAMP
          WHERE slug = ?
        `).bind(
          data.title || 'Untitled',
          data.date || new Date().toISOString(),
          tagsJson,
          data.description || '',
          post.content,
          htmlContent,
          fileHash,
          new Date().toISOString(),
          post.slug
        ).run();
        
        results.details.push({
          slug: post.slug,
          action: 'updated'
        });
      } else {
        // Insert new post
        await env.DB.prepare(`
          INSERT INTO posts (
            slug, title, date, tags, description, 
            markdown_content, html_content, file_hash, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          post.slug,
          data.title || 'Untitled',
          data.date || new Date().toISOString(),
          tagsJson,
          data.description || '',
          post.content,
          htmlContent,
          fileHash,
          new Date().toISOString()
        ).run();
        
        results.details.push({
          slug: post.slug,
          action: 'created'
        });
      }
      
      results.synced++;
    } catch (error) {
      console.error(`Error syncing post ${post.slug}:`, error);
      results.errors.push({
        slug: post.slug,
        error: error.message
      });
    }
  }

  // Handle deleted posts (posts that exist in DB but not in the sync)
  try {
    const dbSlugs = await env.DB.prepare('SELECT slug FROM posts').all();
    const syncSlugs = new Set(posts.map(p => p.slug));
    
    for (const row of dbSlugs.results) {
      if (!syncSlugs.has(row.slug)) {
        await env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(row.slug).run();
        results.details.push({
          slug: row.slug,
          action: 'deleted'
        });
      }
    }
  } catch (error) {
    console.error('Error handling deleted posts:', error);
    results.errors.push({
      action: 'cleanup',
      error: error.message
    });
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetPosts(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT slug, title, date, tags, description, last_synced, created_at, updated_at
      FROM posts
      ORDER BY date DESC
    `).all();

    // Parse tags JSON
    const posts = results.map(post => ({
      ...post,
      tags: JSON.parse(post.tags || '[]')
    }));

    return new Response(JSON.stringify(posts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetPost(slug, env, corsHeaders) {
  try {
    const post = await env.DB.prepare(`
      SELECT * FROM posts WHERE slug = ?
    `).bind(slug).first();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse tags JSON
    post.tags = JSON.parse(post.tags || '[]');

    return new Response(JSON.stringify(post), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error getting post ${slug}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function generateHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}