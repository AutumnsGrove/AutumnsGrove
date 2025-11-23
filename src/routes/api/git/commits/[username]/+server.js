import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  fetchCommitsPaginated,
  MAX_LIMIT,
  MIN_LIMIT,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

// Pagination constants
const CACHE_TTL = 3600; // 1 hour
const MAX_PAGES = 10; // Maximum number of pages to prevent abuse
const MAX_PER_PAGE = 50; // Maximum items per page
const DEFAULT_PER_PAGE = 20; // Default items per page

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
    page = Math.max(1, Math.min(page, MAX_PAGES));

    // Parse per_page parameter
    let perPage = parseInt(url.searchParams.get("per_page") || String(DEFAULT_PER_PAGE), 10);
    perPage = Math.max(1, Math.min(perPage, MAX_PER_PAGE));

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
      try {
        const cached = await kv.get(cacheKey, { type: "json" });
        if (cached) {
          return json({ ...cached, cached: true });
        }
      } catch (cacheError) {
        console.error(`[KV] Cache read failed for ${cacheKey}:`, cacheError);
      }
    } else if (!kv) {
      console.warn("[KV] Cache not available - CACHE_KV binding is undefined");
    }

    // Fetch paginated commits using GraphQL
    const result = await fetchCommitsPaginated(username, repoLimit, token, page, perPage, since);

    // Cache the result
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(result), {
          expirationTtl: CACHE_TTL,
        });
        console.log(`[KV] Cached ${cacheKey} with TTL ${CACHE_TTL}s`);
      } catch (cacheError) {
        console.error(`[KV] Cache write failed for ${cacheKey}:`, cacheError);
      }
    }

    return json({ ...result, cached: false });
  } catch (e) {
    if (e.status) throw e;
    // Log full error server-side for debugging
    console.error("Error fetching commits:", e);

    // Provide sanitized error messages to clients
    if (e.message?.includes("User not found")) {
      throw error(404, "User not found");
    }
    if (e.message?.includes("token required")) {
      throw error(401, "GitHub token required for this endpoint");
    }
    if (e.message?.includes("rate limit")) {
      throw error(429, "GitHub API rate limit exceeded. Please try again later.");
    }

    // Return generic message to avoid exposing internal details
    throw error(500, "Failed to fetch commits");
  }
}
