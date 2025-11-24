import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  fetchStatsGraphQL,
  MAX_LIMIT,
  MIN_LIMIT,
  getCacheKey,
} from "$lib/utils/github.js";
import { logAPI, logCache, logError } from "$lib/server/logger.js";

export const prerender = false;

const CACHE_TTL = 3600; // 1 hour

/**
 * Get comprehensive commit statistics for a GitHub user
 * Uses GraphQL API for efficiency
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, url, platform }) {
  const startTime = Date.now();
  const endpoint = `/api/git/stats/${params.username}`;

  try {
    const username = validateUsername(params.username);
    const token = platform?.env?.GITHUB_TOKEN;
    const kv = platform?.env?.CACHE_KV;

    if (!token) {
      throw error(401, "GitHub token not configured");
    }

    // Parse and clamp limit parameter
    let limit = parseInt(url.searchParams.get("limit") || "10", 10);
    limit = Math.max(MIN_LIMIT, Math.min(limit, MAX_LIMIT));

    // Parse since parameter (ISO date string for time range filtering)
    const since = url.searchParams.get("since") || null;

    // Parse bypass_cache parameter (for forced refresh)
    const bypassCache = url.searchParams.get("bypass_cache") === "true";

    // Check cache first (include since in cache key)
    const cacheParams = { limit };
    if (since) {
      cacheParams.since = since;
    }
    const cacheKey = getCacheKey("stats", username, cacheParams);
    if (kv && !bypassCache) {
      try {
        const cached = await kv.get(cacheKey, { type: "json" });
        if (cached) {
          logCache("get", cacheKey, { hit: true, ttl: CACHE_TTL });
          const duration = Date.now() - startTime;
          logAPI(endpoint, "GET", 200, {
            duration,
            cached: true,
            username,
            limit,
          });
          return json({ ...cached, cached: true });
        } else {
          logCache("get", cacheKey, { hit: false });
        }
      } catch (cacheError) {
        console.error(`[KV] Cache read failed for ${cacheKey}:`, cacheError);
        logCache("get", cacheKey, { error: cacheError.message });
      }
    } else if (!kv) {
      console.warn("[KV] Cache not available - CACHE_KV binding is undefined");
    }

    // Fetch stats using GraphQL
    const stats = await fetchStatsGraphQL(username, limit, token, since);

    // Cache the result
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(stats), {
          expirationTtl: CACHE_TTL,
        });
        console.log(`[KV] Cached ${cacheKey} with TTL ${CACHE_TTL}s`);
        logCache("set", cacheKey, {
          ttl: CACHE_TTL,
          size: JSON.stringify(stats).length,
        });
      } catch (cacheError) {
        console.error(`[KV] Cache write failed for ${cacheKey}:`, cacheError);
        logCache("set", cacheKey, { error: cacheError.message });
      }
    }

    const duration = Date.now() - startTime;
    logAPI(endpoint, "GET", 200, {
      duration,
      cached: false,
      username,
      limit,
      total_commits: stats.total_commits,
    });
    return json({ ...stats, cached: false });
  } catch (e) {
    const duration = Date.now() - startTime;
    if (e.status) {
      logAPI(endpoint, "GET", e.status, {
        duration,
        error: e.body?.message || e.message,
      });
      throw e;
    }
    console.error("Error fetching stats:", e);
    logError(`Failed to fetch stats for ${params.username}`, e, {
      endpoint,
      username: params.username,
    });

    // Provide more specific error messages
    if (e.message?.includes("User not found")) {
      logAPI(endpoint, "GET", 404, { duration, error: "User not found" });
      throw error(404, "User not found");
    }
    if (e.message?.includes("token required")) {
      throw error(401, "GitHub token required for this endpoint");
    }

    throw error(500, e.message || "Failed to fetch statistics");
  }
}
