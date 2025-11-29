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
import { safeJsonParse } from '$lib/utils/json.js';

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

  // Validate year
  if (year && !/^\d{4}$/.test(year)) {
    throw error(400, 'Invalid year format');
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    if (yearNum < 1970 || yearNum > 2100) {
      throw error(400, 'Year out of range');
    }
  }

  // Validate month
  if (month && !/^(0?[1-9]|1[0-2])$/.test(month)) {
    throw error(400, 'Invalid month format');
  }

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
        gutter_content,
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
        const monthNum = parseInt(month, 10);
        const monthPadded = monthNum.toString().padStart(2, '0');
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

    // Get total count for pagination (using parameterized query to prevent SQL injection)
    let countQuery = `SELECT COUNT(*) as total FROM daily_summaries`;
    const countParams = [];
    if (year) {
      if (month) {
        const monthNum = parseInt(month, 10);
        const monthPadded = monthNum.toString().padStart(2, '0');
        countQuery += ` WHERE summary_date LIKE ?`;
        countParams.push(`${year}-${monthPadded}-%`);
      } else {
        countQuery += ` WHERE summary_date LIKE ?`;
        countParams.push(`${year}-%`);
      }
    }
    const countResult = countParams.length > 0
      ? await db.prepare(countQuery).bind(...countParams).first()
      : await db.prepare(countQuery).first();
    const total = countResult?.total || 0;

    // Parse JSON fields (using safe parsing to handle corrupted data)
    const results = summaries.results.map(s => ({
      ...s,
      repos_active: safeJsonParse(s.repos_active, []),
      gutter_content: safeJsonParse(s.gutter_content, []),
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
