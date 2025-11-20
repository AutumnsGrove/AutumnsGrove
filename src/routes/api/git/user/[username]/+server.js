import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getHeaders,
  GITHUB_API_BASE,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const CACHE_TTL = 10800; // 3 hours

/**
 * Get GitHub user information
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, platform }) {
  try {
    const username = validateUsername(params.username);
    const token = platform?.env?.GITHUB_TOKEN || "";
    const kv = platform?.env?.CACHE_KV;

    // Check cache first
    const cacheKey = getCacheKey("user", username);
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Fetch from GitHub API
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
      headers: getHeaders(token),
    });

    if (response.status === 404) {
      throw error(404, "User not found");
    }

    if (!response.ok) {
      throw error(response.status, `GitHub API error: ${response.statusText}`);
    }

    const userData = await response.json();

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(userData), {
        expirationTtl: CACHE_TTL,
      });
    }

    return json({ ...userData, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching user:", e);
    throw error(500, e.message || "Failed to fetch user data");
  }
}
