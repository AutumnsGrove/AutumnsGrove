import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getHeaders,
  GITHUB_API_BASE,
  MAX_REPOS_PAGES,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const CACHE_TTL = 10800; // 3 hours

/**
 * Get repositories for a GitHub user
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, platform }) {
  try {
    const username = validateUsername(params.username);
    const token = platform?.env?.GITHUB_TOKEN || "";
    const kv = platform?.env?.CACHE_KV;

    // Check cache first
    const cacheKey = getCacheKey("repos", username);
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ repos: cached, cached: true });
      }
    }

    const allRepos = [];
    let page = 1;
    const perPage = 100;

    while (page <= MAX_REPOS_PAGES) {
      const response = await fetch(
        `${GITHUB_API_BASE}/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`,
        {
          headers: getHeaders(token),
        },
      );

      if (!response.ok) {
        throw error(
          response.status,
          `Failed to fetch repos: ${response.statusText}`,
        );
      }

      const repos = await response.json();
      if (!repos || repos.length === 0) {
        break;
      }

      allRepos.push(...repos);
      page++;
    }

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(allRepos), {
        expirationTtl: CACHE_TTL,
      });
    }

    return json({ repos: allRepos, count: allRepos.length, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching repos:", e);
    throw error(500, e.message || "Failed to fetch repositories");
  }
}
