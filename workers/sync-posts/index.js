import { marked } from 'marked';
import matter from 'gray-matter';

// Validate slug format (alphanumeric, hyphens, underscores only)
function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

// Get CORS headers based on endpoint
function getCorsHeaders(pathname) {
  // Restrict CORS for sync endpoint to specific origins if needed
  // For now, allowing all origins but this should be restricted in production
  const allowedOrigin = '*'; // TODO: Set env.ALLOWED_ORIGIN for production

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(url.pathname);

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

        // Validate slug format
        if (!slug || !isValidSlug(slug)) {
          return new Response(JSON.stringify({ error: 'Invalid slug format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return await handleGetPost(slug, env, corsHeaders);
      } else if (url.pathname === '/health' && request.method === 'GET') {
        return new Response('OK', { headers: corsHeaders });
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      // Return generic error message in production
      const errorMessage = env.ENVIRONMENT === 'production'
        ? 'An internal error occurred'
        : error.message;
      return new Response(JSON.stringify({ error: errorMessage }), {
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

  // Validate all slugs before processing
  for (const post of posts) {
    if (!post.slug || !isValidSlug(post.slug)) {
      results.errors.push({
        slug: post.slug || 'unknown',
        error: 'Invalid slug format'
      });
      return new Response(JSON.stringify({ error: 'Invalid slug format in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Batch fetch existing posts to reduce DB calls
  const existingPostsQuery = await env.DB.prepare(
    `SELECT slug, file_hash FROM posts WHERE slug IN (${posts.map(() => '?').join(',')})`
  ).bind(...posts.map(p => p.slug)).all();

  const existingPostsMap = new Map(
    existingPostsQuery.results.map(p => [p.slug, p.file_hash])
  );

  // Prepare batch statements
  const batchStatements = [];

  for (const post of posts) {
    try {
      // Generate file hash first (before expensive parsing)
      const fileHash = await generateHash(post.content);

      // Check if post needs updating using the batched results
      const existingHash = existingPostsMap.get(post.slug);

      if (existingHash && existingHash === fileHash) {
        // No changes, skip
        results.details.push({
          slug: post.slug,
          action: 'skipped',
          reason: 'no changes'
        });
        continue;
      }

      // Only parse markdown if we need to update
      const { data, content: markdownContent } = matter(post.content);
      const htmlContent = marked.parse(markdownContent);

      // Prepare tags as JSON string
      const tagsJson = JSON.stringify(data.tags || []);
      const timestamp = new Date().toISOString();

      if (existingHash) {
        // Update existing post
        batchStatements.push(
          env.DB.prepare(`
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
            timestamp,
            post.slug
          )
        );

        results.details.push({
          slug: post.slug,
          action: 'updated'
        });
      } else {
        // Insert new post
        batchStatements.push(
          env.DB.prepare(`
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
            timestamp
          )
        );

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
        error: env.ENVIRONMENT === 'production' ? 'Sync failed' : error.message
      });
    }
  }

  // Execute batch statements if any
  if (batchStatements.length > 0) {
    try {
      await env.DB.batch(batchStatements);
    } catch (error) {
      console.error('Batch operation failed:', error);
      return new Response(JSON.stringify({
        error: env.ENVIRONMENT === 'production' ? 'Database operation failed' : error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    const errorMessage = env.ENVIRONMENT === 'production'
      ? 'Failed to retrieve posts'
      : error.message;
    return new Response(JSON.stringify({ error: errorMessage }), {
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
    const errorMessage = env.ENVIRONMENT === 'production'
      ? 'Failed to retrieve post'
      : error.message;
    return new Response(JSON.stringify({ error: errorMessage }), {
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