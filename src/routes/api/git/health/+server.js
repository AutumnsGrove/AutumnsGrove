import { json } from "@sveltejs/kit";

export const prerender = false;

/**
 * Health check endpoint for Git API
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ url, platform }) {
  const token = platform?.env?.GITHUB_TOKEN;
  const kv = platform?.env?.CACHE_KV;
  const db = platform?.env?.GIT_STATS_DB;

  const result = {
    status: "healthy",
    github_token_configured: !!token,
    kv_configured: !!kv,
    d1_configured: !!db,
    timestamp: new Date().toISOString(),
  };

  // If test_kv=true, attempt a test write/read cycle
  if (url.searchParams.get("test_kv") === "true" && kv) {
    const testKey = `health:test:${Date.now()}`;
    const testValue = { test: true, timestamp: result.timestamp };

    try {
      // Test write
      await kv.put(testKey, JSON.stringify(testValue), {
        expirationTtl: 60, // 1 minute TTL
      });

      // Test read
      const readBack = await kv.get(testKey, { type: "json" });

      // Clean up
      await kv.delete(testKey);

      result.kv_test = {
        write: true,
        read: !!readBack,
        match: readBack?.test === testValue.test,
        success: true,
      };
    } catch (error) {
      result.kv_test = {
        success: false,
        error: error.message,
      };
    }
  }

  // List existing cache keys if requested
  if (url.searchParams.get("list_keys") === "true" && kv) {
    try {
      const list = await kv.list({ limit: 20 });
      result.cached_keys = list.keys.map((k) => ({
        name: k.name,
        expiration: k.expiration,
      }));
      result.cached_keys_count = list.keys.length;
    } catch (error) {
      result.list_error = error.message;
    }
  }

  return json(result);
}
