import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  fetchStatsGraphQL,
  MAX_LIMIT,
  MIN_LIMIT,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const CACHE_TTL = 10800; // 3 hours

/**
 * Get comprehensive commit statistics for a GitHub user
 * Uses GraphQL API for efficiency
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, url, platform }) {
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

    // Check cache first (include since in cache key)
    const cacheParams = { limit };
    if (since) {
      cacheParams.since = since;
    }
    const cacheKey = getCacheKey("stats", username, cacheParams);
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Fetch stats using GraphQL
    const stats = await fetchStatsGraphQL(username, limit, token, since);

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(stats), {
        expirationTtl: CACHE_TTL,
      });
    }

    return json({ ...stats, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching stats:", e);

    // Provide more specific error messages
    if (e.message?.includes("User not found")) {
      throw error(404, "User not found");
    }
    if (e.message?.includes("token required")) {
      throw error(401, "GitHub token required for this endpoint");
    }

    throw error(500, e.message || "Failed to fetch statistics");
  }
}
