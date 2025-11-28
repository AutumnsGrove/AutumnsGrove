/**
 * Timeline API Endpoint
 *
 * GET /api/timeline
 *   Query params:
 *   - limit: Number of summaries to return (default 30, max 100)
 *   - offset: Pagination offset (default 0)
 *   - year: Filter by year (optional)
 *   - month: Filter by month (optional, requires year)
 *
 * Returns daily summaries for the timeline feature
 */

import { json, error } from '@sveltejs/kit';

export async function GET({ url, platform }) {
  const db = platform?.env?.GIT_STATS_DB;
  const kv = platform?.env?.CACHE_KV;

  if (!db) {
    throw error(500, 'Database not available');
  }

  // Parse query parameters
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30'), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  // Build cache key
  const cacheKey = `timeline:${limit}:${offset}:${year || ''}:${month || ''}`;

  // Check cache first
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return json({ ...data, cached: true });
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  try {
    let query = `
      SELECT
        id,
        summary_date,
        brief_summary,
        detailed_timeline,
        commit_count,
        repos_active,
        total_additions,
        total_deletions,
        ai_model,
        created_at
      FROM daily_summaries
    `;

    const params = [];

    // Add date filters if specified
    if (year) {
      if (month) {
        // Filter by year and month
        const monthPadded = month.padStart(2, '0');
        query += ` WHERE summary_date LIKE ?`;
        params.push(`${year}-${monthPadded}-%`);
      } else {
        // Filter by year only
        query += ` WHERE summary_date LIKE ?`;
        params.push(`${year}-%`);
      }
    }

    query += ` ORDER BY summary_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const summaries = await db.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM daily_summaries`;
    if (year) {
      if (month) {
        const monthPadded = month.padStart(2, '0');
        countQuery += ` WHERE summary_date LIKE '${year}-${monthPadded}-%'`;
      } else {
        countQuery += ` WHERE summary_date LIKE '${year}-%'`;
      }
    }
    const countResult = await db.prepare(countQuery).first();
    const total = countResult?.total || 0;

    // Parse repos_active JSON
    const results = summaries.results.map(s => ({
      ...s,
      repos_active: s.repos_active ? JSON.parse(s.repos_active) : [],
      is_rest_day: s.commit_count === 0
    }));

    const response = {
      summaries: results,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + results.length < total
      },
      cached: false
    };

    // Cache for 5 minutes
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 300
        });
      } catch (e) {
        console.warn('Cache write error:', e);
      }
    }

    return json(response);

  } catch (e) {
    console.error('Timeline API error:', e);
    throw error(500, 'Failed to fetch timeline data');
  }
}
