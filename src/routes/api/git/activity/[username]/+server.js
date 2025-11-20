import { json, error } from "@sveltejs/kit";
import { validateUsername, getCacheKey } from "$lib/utils/github.js";

export const prerender = false;

/**
 * Get aggregated commit activity for heatmap display
 * Returns daily commit counts across all repos for the past year
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, url, platform }) {
  try {
    const username = validateUsername(params.username);
    const db = platform?.env?.GIT_STATS_DB;
    const kv = platform?.env?.CACHE_KV;

    if (!db) {
      throw error(500, "D1 database not configured");
    }

    // Get date range (default 365 days for full year heatmap)
    const days = parseInt(url.searchParams.get("days") || "365", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Check cache
    const cacheKey = getCacheKey("activity", username, { days });
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Get all repos for this user
    const repos = await db
      .prepare(`SELECT id, name FROM repositories WHERE owner = ?`)
      .bind(username)
      .all();

    if (!repos.results || repos.results.length === 0) {
      return json({
        username,
        message: "No repositories found. Run sync first.",
        activity: [],
        total_commits: 0,
      });
    }

    const repoIds = repos.results.map((r) => r.id);

    // Fetch aggregated commit activity across all repos
    const activity = await db
      .prepare(
        `
        SELECT
          activity_date,
          SUM(commit_count) as commit_count
        FROM commit_activity
        WHERE repo_id IN (${repoIds.map(() => "?").join(",")})
          AND activity_date >= ?
        GROUP BY activity_date
        ORDER BY activity_date ASC
      `,
      )
      .bind(...repoIds, startDateStr)
      .all();

    // Also get total commits
    const totalResult = await db
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM commits
        WHERE repo_id IN (${repoIds.map(() => "?").join(",")})
          AND committed_at >= ?
      `,
      )
      .bind(...repoIds, startDateStr)
      .first();

    const result = {
      username,
      days,
      startDate: startDateStr,
      activity: activity.results || [],
      total_commits: totalResult?.total || 0,
      repos_count: repos.results.length,
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
    console.error("Error fetching activity:", e);
    throw error(500, e.message || "Failed to fetch activity");
  }
}
