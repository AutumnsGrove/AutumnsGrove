import { marked } from 'marked';
import matter from 'gray-matter';
import { Buffer } from 'node:buffer';

// Polyfill Buffer for Cloudflare Workers compatibility
// gray-matter requires Buffer which is not available in Workers by default
globalThis.Buffer = Buffer;

// Configure marked with security options to prevent XSS
marked.setOptions({
  headerIds: false,  // Disable auto-generated header IDs to prevent DOM clobbering
  mangle: false,     // Don't mangle email addresses
  // Note: marked v5+ automatically escapes HTML by default for security
  // For additional sanitization, consider using DOMPurify on the client side
  // when rendering HTML content: https://github.com/cure53/DOMPurify
});

// Normalize slug to kebab-case (lowercase with hyphens)
function normalizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  return slug
    .toLowerCase()                    // Convert to lowercase
    .trim()                           // Remove leading/trailing whitespace
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/_+/g, '-')             // Replace underscores with hyphens
    .replace(/[^a-z0-9-]/g, '')      // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-')             // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

// Validate slug format (kebab-case: lowercase alphanumeric with hyphens only)
function isValidSlug(slug) {
  // SEO-friendly kebab-case: lowercase letters, numbers, and hyphens
  // Must start and end with alphanumeric, no consecutive hyphens
  return slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// Basic rate limiting using KV (if available) or fallback to header-based check
async function checkRateLimit(request, env) {
  // Rate limit: 10 requests per minute for sync endpoint
  const RATE_LIMIT = 10;
  const WINDOW_MS = 60 * 1000; // 1 minute

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rate_limit:${clientIP}`;

  if (env.RATE_LIMIT_KV) {
    // Use KV for distributed rate limiting if available
    const requestData = await env.RATE_LIMIT_KV.get(rateLimitKey, 'json');
    const now = Date.now();

    if (requestData) {
      const { count, resetTime } = requestData;

      if (now < resetTime) {
        if (count >= RATE_LIMIT) {
          return { limited: true, retryAfter: Math.ceil((resetTime - now) / 1000) };
        }
        await env.RATE_LIMIT_KV.put(
          rateLimitKey,
          JSON.stringify({ count: count + 1, resetTime }),
          { expirationTtl: Math.ceil((resetTime - now) / 1000) + 60 }
        );
      } else {
        // Reset window
        await env.RATE_LIMIT_KV.put(
          rateLimitKey,
          JSON.stringify({ count: 1, resetTime: now + WINDOW_MS }),
          { expirationTtl: 120 }
        );
      }
    } else {
      // First request in window
      await env.RATE_LIMIT_KV.put(
        rateLimitKey,
        JSON.stringify({ count: 1, resetTime: now + WINDOW_MS }),
        { expirationTtl: 120 }
      );
    }
  }
  // Note: For production, configure Cloudflare Rate Limiting rules in dashboard
  // or bind a KV namespace as RATE_LIMIT_KV in wrangler.toml

  return { limited: false };
}

// Get CORS headers based on endpoint
function getCorsHeaders(pathname, env) {
  // Use environment variable for allowed origin, fallback to production domain
  const allowedOrigin = env?.ALLOWED_ORIGIN || 'https://autumnsgrove.com';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(url.pathname, env);

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
        const rawSlug = url.pathname.split('/')[2];

        // Normalize slug for lookup
        const slug = normalizeSlug(rawSlug);

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
  // Check rate limiting
  const rateLimitResult = await checkRateLimit(request, env);
  if (rateLimitResult.limited) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': rateLimitResult.retryAfter.toString()
      }
    });
  }

  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.SYNC_API_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check request size to prevent DoS attacks
  const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB total request limit
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return new Response(JSON.stringify({ error: 'Request too large' }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const posts = await request.json();
  const results = {
    synced: 0,
    errors: [],
    details: []
  };

  // Handle empty posts array
  if (!Array.isArray(posts) || posts.length === 0) {
    return new Response(JSON.stringify({ synced: 0, errors: [], details: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate batch size to prevent SQL bind parameter limit issues
  // SQLite limit: 999 bind parameters
  // Each post uses 9 parameters (slug, title, date, tags, description, markdown, html, hash, timestamp)
  // Safe batch size: 999 ÷ 9 ≈ 111 posts, using 100 for headroom (100 × 9 = 900 params)
  const MAX_POSTS_PER_SYNC = 100;
  if (posts.length > MAX_POSTS_PER_SYNC) {
    return new Response(JSON.stringify({
      error: `Too many posts in single sync request. Maximum: ${MAX_POSTS_PER_SYNC}, received: ${posts.length}. Please batch your requests.`
    }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate all posts before processing
  const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB limit per post
  const MAX_TITLE_LENGTH = 500;
  const MAX_DESCRIPTION_LENGTH = 2000;

  for (const post of posts) {
    // Normalize and validate slug
    const originalSlug = post.slug;
    const normalizedSlug = normalizeSlug(post.slug);

    if (!normalizedSlug || !isValidSlug(normalizedSlug)) {
      results.errors.push({
        slug: originalSlug || 'unknown',
        error: 'Invalid slug format (must contain alphanumeric characters)'
      });
      return new Response(JSON.stringify({
        error: `Invalid slug format in payload: "${originalSlug}" could not be normalized to valid kebab-case`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update the post object with normalized slug
    post.slug = normalizedSlug;

    // Validate content exists and is a string
    if (!post.content || typeof post.content !== 'string') {
      return new Response(JSON.stringify({ error: `Missing or invalid content for post: ${post.slug}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate content size to prevent DoS
    if (post.content.length > MAX_CONTENT_SIZE) {
      return new Response(JSON.stringify({ error: `Content too large for post: ${post.slug}. Max size: ${MAX_CONTENT_SIZE} bytes` }), {
        status: 413,
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
  let pendingSyncCount = 0; // Track operations that will be synced

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
      // Note: HTML content is stored as-is. Ensure client-side rendering uses
      // Content Security Policy (CSP) headers and/or DOMPurify for additional XSS protection
      const htmlContent = marked.parse(markdownContent);

      // Validate title and description lengths
      const title = data.title || 'Untitled';
      const description = data.description || '';

      if (title.length > MAX_TITLE_LENGTH) {
        results.errors.push({
          slug: post.slug,
          error: `Title too long (max ${MAX_TITLE_LENGTH} characters)`
        });
        continue;
      }

      if (description.length > MAX_DESCRIPTION_LENGTH) {
        results.errors.push({
          slug: post.slug,
          error: `Description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`
        });
        continue;
      }

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
            title,
            data.date || new Date().toISOString(),
            tagsJson,
            description,
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
            title,
            data.date || new Date().toISOString(),
            tagsJson,
            description,
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

      pendingSyncCount++; // Count operations to be executed
    } catch (error) {
      console.error(`Error syncing post ${post.slug}:`, error);
      results.errors.push({
        slug: post.slug,
        error: env.ENVIRONMENT === 'production' ? 'Sync failed' : error.message
      });
    }
  }

  // Execute batch statements if any
  // Use chunked batching to stay well below SQLite's 999 bind parameter limit
  const BATCH_CHUNK_SIZE = 100; // 100 statements × ~9 params = ~900 params (safe)
  if (batchStatements.length > 0) {
    try {
      // Process in chunks to prevent parameter overflow
      for (let i = 0; i < batchStatements.length; i += BATCH_CHUNK_SIZE) {
        const chunk = batchStatements.slice(i, i + BATCH_CHUNK_SIZE);
        await env.DB.batch(chunk);
      }
      // Only update synced count after successful batch execution
      results.synced = pendingSyncCount;
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

    // Collect slugs to delete
    const slugsToDelete = dbSlugs.results
      .filter(row => !syncSlugs.has(row.slug))
      .map(row => row.slug);

    // Batch delete operations with chunking for safety
    if (slugsToDelete.length > 0) {
      const deleteStatements = slugsToDelete.map(slug =>
        env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug)
      );

      // Process deletes in chunks (each delete uses 1 param, so we can use larger chunks)
      const DELETE_CHUNK_SIZE = 500; // Well below 999 param limit for deletes
      for (let i = 0; i < deleteStatements.length; i += DELETE_CHUNK_SIZE) {
        const chunk = deleteStatements.slice(i, i + DELETE_CHUNK_SIZE);
        await env.DB.batch(chunk);
      }

      // Add to results
      slugsToDelete.forEach(slug => {
        results.details.push({
          slug: slug,
          action: 'deleted'
        });
      });
    }
  } catch (error) {
    console.error('Error handling deleted posts:', error);
    results.errors.push({
      action: 'cleanup',
      error: env.ENVIRONMENT === 'production' ? 'Cleanup failed' : error.message
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