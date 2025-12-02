import { json, error } from "@sveltejs/kit";
import {
  fetchStatsGraphQL,
  getHeaders,
  GITHUB_API_BASE,
} from "$lib/utils/github.js";
import { sanitizeObject } from "@autumnsgrove/grove-engine/utils/validation";

export const prerender = false;

/**
 * Sync endpoint for scheduled cron jobs
 * Fetches latest stats and stores in D1 for historical tracking
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform }) {
  try {
    const token = platform?.env?.GITHUB_TOKEN;
    const db = platform?.env?.GIT_STATS_DB;

    if (!token) {
      throw error(401, "GitHub token not configured");
    }

    if (!db) {
      throw error(500, "D1 database not configured");
    }

    // Get username from request or use default
    let body;
    try {
      body = sanitizeObject(await request.json());
    } catch {
      body = {};
    }

    const username = body.username || "AutumnsGrove";
    const limit = body.limit || 10;

    // Fetch current stats
    const stats = await fetchStatsGraphQL(username, limit, token);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Sync each repo to D1
    const results = [];

    for (const [repoName, commitCount] of Object.entries(
      stats.commits_by_repo,
    )) {
      try {
        // Upsert repository
        await db
          .prepare(
            `
					INSERT INTO repositories (owner, name, full_name)
					VALUES (?, ?, ?)
					ON CONFLICT(owner, name) DO UPDATE SET
						updated_at = datetime('now')
				`,
          )
          .bind(username, repoName, `${username}/${repoName}`)
          .run();

        // Get repo ID
        const repoResult = await db
          .prepare(
            `
					SELECT id FROM repositories WHERE owner = ? AND name = ?
				`,
          )
          .bind(username, repoName)
          .first();

        if (!repoResult) continue;
        const repoId = repoResult.id;

        // Insert snapshot
        await db
          .prepare(
            `
					INSERT INTO repo_snapshots (repo_id, snapshot_date, total_commits)
					VALUES (?, ?, ?)
					ON CONFLICT(repo_id, snapshot_date) DO UPDATE SET
						total_commits = excluded.total_commits
				`,
          )
          .bind(repoId, today, commitCount)
          .run();

        results.push({ repo: repoName, synced: true });
      } catch (e) {
        console.error(`Error syncing ${repoName}:`, e);
        results.push({ repo: repoName, synced: false, error: e.message });
      }
    }

    // Store recent commits
    for (const commit of stats.recent_commits) {
      try {
        // Get repo ID
        const repoResult = await db
          .prepare(
            `
					SELECT id FROM repositories WHERE owner = ? AND name = ?
				`,
          )
          .bind(username, commit.repo)
          .first();

        if (!repoResult) continue;
        const repoId = repoResult.id;

        // Insert commit
        await db
          .prepare(
            `
					INSERT OR IGNORE INTO commits (repo_id, sha, message, committed_at, additions, deletions)
					VALUES (?, ?, ?, ?, ?, ?)
				`,
          )
          .bind(
            repoId,
            commit.sha,
            commit.message,
            commit.date,
            commit.additions,
            commit.deletions,
          )
          .run();

        // Update commit activity
        const commitDate = new Date(commit.date);
        const dateStr = commitDate.toISOString().split("T")[0];
        const hour = commitDate.getUTCHours();
        const dayOfWeek = commitDate.getUTCDay();

        await db
          .prepare(
            `
					INSERT INTO commit_activity (repo_id, activity_date, hour, day_of_week, commit_count)
					VALUES (?, ?, ?, ?, 1)
					ON CONFLICT(repo_id, activity_date, hour) DO UPDATE SET
						commit_count = commit_count + 1
				`,
          )
          .bind(repoId, dateStr, hour, dayOfWeek)
          .run();
      } catch (e) {
        console.error(`Error storing commit ${commit.sha}:`, e);
      }
    }

    return json({
      success: true,
      username,
      date: today,
      repos_synced: results.filter((r) => r.synced).length,
      total_repos: results.length,
      total_commits: stats.total_commits,
      results,
    });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error in sync:", e);
    throw error(500, e.message || "Sync failed");
  }
}

// Also support GET for manual testing
export async function GET({ platform }) {
  const db = platform?.env?.GIT_STATS_DB;
  const token = platform?.env?.GITHUB_TOKEN;

  return json({
    status: "ready",
    db_configured: !!db,
    token_configured: !!token,
    message: "Use POST to trigger sync",
  });
}
