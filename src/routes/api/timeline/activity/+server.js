/**
 * Timeline Activity API - Get activity summary for visualizations
 *
 * GET /api/timeline/activity
 *   Query params:
 *   - days: Number of days to return (default 14, max 90)
 *
 * Returns daily activity data optimized for charts
 */

import { json, error } from '@sveltejs/kit';

export async function GET({ url, platform }) {
  const db = platform?.env?.GIT_STATS_DB;
  const kv = platform?.env?.CACHE_KV;

  if (!db) {
    throw error(500, 'Database not available');
  }

  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '14'), 1), 90);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Cache key
  const cacheKey = `activity:${days}:${endDateStr}`;

  // Check cache first
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return json({ ...JSON.parse(cached), cached: true });
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  try {
    // Get activity data from daily summaries
    const query = `
      SELECT
        summary_date as date,
        commit_count as commits,
        total_additions as additions,
        total_deletions as deletions,
        repos_active
      FROM daily_summaries
      WHERE summary_date >= ? AND summary_date <= ?
      ORDER BY summary_date ASC
    `;

    const result = await db.prepare(query).bind(startDateStr, endDateStr).all();

    // Build a map of dates with activity
    const activityMap = {};
    for (const row of result.results) {
      activityMap[row.date] = {
        date: row.date,
        commits: row.commits,
        additions: row.additions,
        deletions: row.deletions,
        repos: row.repos_active ? JSON.parse(row.repos_active) : []
      };
    }

    // Fill in all days (including rest days)
    const activity = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      activity.push(activityMap[dateStr] || {
        date: dateStr,
        commits: 0,
        additions: 0,
        deletions: 0,
        repos: []
      });
      current.setDate(current.getDate() + 1);
    }

    // Calculate totals
    const totals = activity.reduce((acc, day) => ({
      commits: acc.commits + day.commits,
      additions: acc.additions + day.additions,
      deletions: acc.deletions + day.deletions,
      activeDays: acc.activeDays + (day.commits > 0 ? 1 : 0)
    }), { commits: 0, additions: 0, deletions: 0, activeDays: 0 });

    // Get repo breakdown
    const repoCommits = {};
    for (const day of activity) {
      for (const repo of day.repos) {
        repoCommits[repo] = (repoCommits[repo] || 0) + 1;
      }
    }
    const repos = Object.entries(repoCommits)
      .map(([name, days]) => ({ name, days }))
      .sort((a, b) => b.days - a.days);

    const response = {
      activity,
      totals,
      repos,
      days,
      range: {
        start: startDateStr,
        end: endDateStr
      }
    };

    // Cache for 10 minutes
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 600
        });
      } catch (e) {
        console.warn('Cache write error:', e);
      }
    }

    return json(response);

  } catch (e) {
    console.error('Activity API error:', e);
    throw error(500, 'Failed to fetch activity data');
  }
}
