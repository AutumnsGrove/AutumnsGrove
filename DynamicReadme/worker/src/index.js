import { fetchUserStats } from './github.js';
import { renderStatsCard } from './cards/stats.js';
import { renderLanguagesCard } from './cards/languages.js';
import { renderStreakCard } from './cards/streak.js';

/**
 * Grove README Stats Worker
 *
 * Serves dynamic SVG stat cards for the GitHub profile README.
 *
 * Routes:
 *   GET /stats?username=AutumnsGrove     → GitHub stats card
 *   GET /languages?username=AutumnsGrove → Top languages card
 *   GET /streak?username=AutumnsGrove    → Contribution streak card
 *   GET /health                          → Health check
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (path === '/health') {
        return json({ status: 'ok', worker: 'grove-readme-stats' });
      }

      if (path === '/stats' || path === '/languages' || path === '/streak') {
        return await handleCard(path, url, env);
      }

      return json({ error: 'Not found. Routes: /stats, /languages, /streak, /health' }, 404);
    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal error', message: err.message }, 500);
    }
  },
};

async function handleCard(path, url, env) {
  const username = url.searchParams.get('username') || env.GITHUB_USERNAME;
  const token = env.GITHUB_TOKEN;

  if (!token) {
    return json({ error: 'GITHUB_TOKEN secret not configured' }, 500);
  }

  // Check edge cache first
  const cacheKey = new Request(`${url.origin}${path}?username=${username}`, { method: 'GET' });
  const cache = caches.default;
  let cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data from GitHub
  const data = await fetchUserStats(username, token);

  let svg;
  switch (path) {
    case '/stats':
      svg = renderStatsCard(data.stats);
      break;
    case '/languages':
      svg = renderLanguagesCard(data.languages);
      break;
    case '/streak':
      svg = renderStreakCard(data.streak, data.stats);
      break;
  }

  const response = new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': `public, max-age=${env.CACHE_TTL || 1800}`,
      ...corsHeaders(),
    },
  });

  // Store in edge cache
  await cache.put(cacheKey, response.clone());

  return response;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}
