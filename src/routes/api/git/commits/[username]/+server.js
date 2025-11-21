import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  fetchCommitsPaginated,
  MAX_LIMIT,
  MIN_LIMIT,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const CACHE_TTL = 10800; // 3 hours

/**
 * Get paginated commits for a GitHub user
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

    // Parse and clamp repo limit parameter
    let repoLimit = parseInt(url.searchParams.get("repo_limit") || "15", 10);
    repoLimit = Math.max(MIN_LIMIT, Math.min(repoLimit, MAX_LIMIT));

    // Parse page parameter (1-indexed)
    let page = parseInt(url.searchParams.get("page") || "1", 10);
    page = Math.max(1, Math.min(page, 10)); // Limit to 10 pages max

    // Parse per_page parameter
    let perPage = parseInt(url.searchParams.get("per_page") || "20", 10);
    perPage = Math.max(1, Math.min(perPage, 50)); // Limit to 50 per page

    // Parse since parameter (ISO date string for time range filtering)
    const since = url.searchParams.get("since") || null;

    // Parse bypass_cache parameter (for forced refresh)
    const bypassCache = url.searchParams.get("bypass_cache") === "true";

    // Check cache first (include all params in cache key)
    const cacheParams = { repo_limit: repoLimit, page, per_page: perPage };
    if (since) {
      cacheParams.since = since;
    }
    const cacheKey = getCacheKey("commits", username, cacheParams);
    if (kv && !bypassCache) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Fetch paginated commits using GraphQL
    const result = await fetchCommitsPaginated(username, repoLimit, token, page, perPage, since);

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(result), {
        expirationTtl: CACHE_TTL,
      });
    }

    return json({ ...result, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching commits:", e);

    // Provide more specific error messages
    if (e.message?.includes("User not found")) {
      throw error(404, "User not found");
    }
    if (e.message?.includes("token required")) {
      throw error(401, "GitHub token required for this endpoint");
    }

    throw error(500, e.message || "Failed to fetch commits");
  }
}
