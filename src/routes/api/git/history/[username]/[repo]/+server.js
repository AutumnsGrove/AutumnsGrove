import { json, error } from "@sveltejs/kit";
import { validateUsername, getCacheKey } from "$lib/utils/github.js";

export const prerender = false;

/**
 * Get historical data for a repository
 * Returns commit trends, activity patterns, and TODO progress
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, url, platform }) {
  try {
    const username = validateUsername(params.username);
    const repo = params.repo;
    const db = platform?.env?.GIT_STATS_DB;
    const kv = platform?.env?.CACHE_KV;

    if (!db) {
      throw error(500, "D1 database not configured");
    }

    // Get date range from query params
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Check cache
    const cacheKey = getCacheKey("history", username, { repo, days });
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Get repo ID
    const repoResult = await db
      .prepare(
        `
			SELECT id FROM repositories WHERE owner = ? AND name = ?
		`,
      )
      .bind(username, repo)
      .first();

    if (!repoResult) {
      return json({
        repo,
        owner: username,
        message: "No historical data found. Run sync first.",
        snapshots: [],
        activity: [],
        commits: [],
      });
    }

    const repoId = repoResult.id;

    // Fetch snapshots
    const snapshots = await db
      .prepare(
        `
			SELECT snapshot_date, total_commits, total_additions, total_deletions, stars, forks, open_issues
			FROM repo_snapshots
			WHERE repo_id = ? AND snapshot_date >= ?
			ORDER BY snapshot_date ASC
		`,
      )
      .bind(repoId, startDateStr)
      .all();

    // Fetch commit activity for heatmap
    const activity = await db
      .prepare(
        `
			SELECT activity_date, hour, day_of_week, commit_count
			FROM commit_activity
			WHERE repo_id = ? AND activity_date >= ?
			ORDER BY activity_date ASC
		`,
      )
      .bind(repoId, startDateStr)
      .all();

    // Fetch recent commits
    const commits = await db
      .prepare(
        `
			SELECT sha, message, author, committed_at, additions, deletions
			FROM commits
			WHERE repo_id = ? AND committed_at >= ?
			ORDER BY committed_at DESC
			LIMIT 100
		`,
      )
      .bind(repoId, startDateStr)
      .all();

    // Fetch TODO snapshots
    const todos = await db
      .prepare(
        `
			SELECT snapshot_date, total_todos, completed_todos, code_todos, markdown_todos
			FROM todo_snapshots
			WHERE repo_id = ? AND snapshot_date >= ?
			ORDER BY snapshot_date ASC
		`,
      )
      .bind(repoId, startDateStr)
      .all();

    const result = {
      repo,
      owner: username,
      days,
      startDate: startDateStr,
      snapshots: snapshots.results || [],
      activity: activity.results || [],
      commits: commits.results || [],
      todos: todos.results || [],
    };

    // Cache for 30 minutes
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 1800,
      });
    }

    return json({ ...result, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching history:", e);
    throw error(500, e.message || "Failed to fetch history");
  }
}
