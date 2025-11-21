import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getGraphQLHeaders,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

/**
 * Get contribution calendar data directly from GitHub
 * Returns the same data GitHub uses for their contribution graph
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

    // Parse bypass_cache parameter (for forced refresh)
    const bypassCache = url.searchParams.get("bypass_cache") === "true";

    // Check cache (1 hour)
    const cacheKey = getCacheKey("contributions", username);
    if (kv && !bypassCache) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
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

    if (!response.ok) {
      const errorText = await response.text();
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
      await kv.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 3600,
      });
    }

    return json({ ...result, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching contributions:", e);
    throw error(500, e.message || "Failed to fetch contributions");
  }
}
