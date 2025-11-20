import { json } from "@sveltejs/kit";

export const prerender = false;

/**
 * Health check endpoint for Git API
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ platform }) {
  const token = platform?.env?.GITHUB_TOKEN;
  const kv = platform?.env?.CACHE_KV;
  const db = platform?.env?.GIT_STATS_DB;

  return json({
    status: "healthy",
    github_token_configured: !!token,
    kv_configured: !!kv,
    d1_configured: !!db,
    timestamp: new Date().toISOString(),
  });
}
