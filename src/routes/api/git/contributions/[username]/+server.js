import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getGraphQLHeaders,
  getCacheKey,
} from "$lib/utils/github";
import {
  logAPI,
  logGitHub,
  logCache,
  logError,
} from "@autumnsgrove/groveengine/server";

export const prerender = false;

/**
 * Get contribution calendar data directly from GitHub
 * Returns the same data GitHub uses for their contribution graph
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, url, platform }) {
  const startTime = Date.now();
  const endpoint = `/api/git/contributions/${params.username}`;

  try {
    const username = validateUsername(params.username);
    const token = platform?.env?.GITHUB_TOKEN;
    const kv = platform?.env?.CACHE_KV;

    if (!token) {
      throw error(401, "GitHub token not configured");
    }

    // Parse bypass_cache parameter (for forced refresh)
    const bypassCache = url.searchParams.get("bypass_cache") === "true";

    // Check cache (1 hour)
    const cacheKey = getCacheKey("contributions", username);
    if (kv && !bypassCache) {
      try {
        const cached = await kv.get(cacheKey, { type: "json" });
        if (cached) {
          logCache("get", cacheKey, { hit: true, ttl: 3600 });
          const duration = Date.now() - startTime;
          logAPI(endpoint, "GET", 200, { duration, cached: true, username });
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

    // GraphQL query for contribution calendar
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: getGraphQLHeaders(token),
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    // Log GitHub API call with rate limit info
    const rateLimit = {
      limit: response.headers.get("x-ratelimit-limit"),
      remaining: response.headers.get("x-ratelimit-remaining"),
      reset: response.headers.get("x-ratelimit-reset"),
    };
    logGitHub(`GraphQL: contributionCalendar for ${username}`, {
      rateLimit,
      status: response.status,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logGitHub(`GraphQL error: ${errorText}`, {
        error: true,
        status: response.status,
        username,
      });
      throw error(response.status, `GitHub API error: ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw error(400, data.errors[0].message);
    }

    const calendar =
      data.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      throw error(404, "User not found or no contribution data");
    }

    // Flatten weeks into activity array for the heatmap
    const activity = [];
    for (const week of calendar.weeks) {
      for (const day of week.contributionDays) {
        if (day.contributionCount > 0) {
          activity.push({
            activity_date: day.date,
            commit_count: day.contributionCount,
          });
        }
      }
    }

    const result = {
      username,
      total_contributions: calendar.totalContributions,
      weeks: calendar.weeks,
      activity,
    };

    // Cache for 1 hour
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(result), {
          expirationTtl: 3600,
        });
        console.log(`[KV] Cached ${cacheKey} with TTL 3600s`);
        logCache("set", cacheKey, {
          ttl: 3600,
          size: JSON.stringify(result).length,
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
      total_contributions: result.total_contributions,
      activity_days: result.activity.length,
    });
    return json({ ...result, cached: false });
  } catch (e) {
    const duration = Date.now() - startTime;
    if (e.status) {
      logAPI(endpoint, "GET", e.status, {
        duration,
        error: e.body?.message || e.message,
      });
      throw e;
    }
    console.error("Error fetching contributions:", e);
    logError(`Failed to fetch contributions for ${params.username}`, e, {
      endpoint,
      username: params.username,
    });
    logAPI(endpoint, "GET", 500, { duration, error: e.message });
    throw error(500, e.message || "Failed to fetch contributions");
  }
}
