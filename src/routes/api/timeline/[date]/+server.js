/**
 * Timeline Entry API - Get/Update a specific timeline entry
 *
 * GET /api/timeline/[date] - Get a specific entry
 * PUT /api/timeline/[date] - Update entry (admin only)
 */

import { json, error } from '@sveltejs/kit';
import { verifySession } from '$lib/auth/session.js';

export async function GET({ params, platform }) {
  const db = platform?.env?.GIT_STATS_DB;
  const { date } = params;

  if (!db) {
    throw error(500, 'Database not available');
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw error(400, 'Invalid date format. Use YYYY-MM-DD');
  }

  try {
    const entry = await db.prepare(`
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
        created_at,
        updated_at
      FROM daily_summaries
      WHERE summary_date = ?
    `).bind(date).first();

    if (!entry) {
      throw error(404, 'Timeline entry not found');
    }

    return json({
      ...entry,
      repos_active: entry.repos_active ? JSON.parse(entry.repos_active) : [],
      gutter_content: entry.gutter_content ? JSON.parse(entry.gutter_content) : [],
      is_rest_day: entry.commit_count === 0
    });

  } catch (e) {
    if (e.status) throw e;
    console.error('Timeline entry fetch error:', e);
    throw error(500, 'Failed to fetch timeline entry');
  }
}

export async function PUT({ params, request, platform, cookies }) {
  const db = platform?.env?.GIT_STATS_DB;
  const kv = platform?.env?.CACHE_KV;
  const { date } = params;

  if (!db) {
    throw error(500, 'Database not available');
  }

  // Verify admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  try {
    const user = await verifySession(sessionToken, platform.env.SESSION_SECRET);
    if (!user) {
      throw error(401, 'Invalid session');
    }
  } catch (e) {
    throw error(401, 'Authentication failed');
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw error(400, 'Invalid date format. Use YYYY-MM-DD');
  }

  // Check entry exists
  const existing = await db.prepare(
    'SELECT id FROM daily_summaries WHERE summary_date = ?'
  ).bind(date).first();

  if (!existing) {
    throw error(404, 'Timeline entry not found');
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    throw error(400, 'Invalid JSON body');
  }

  // Whitelist allowed fields
  const allowedFields = ['brief_summary', 'detailed_timeline', 'gutter_content'];
  const updates = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw error(400, 'No valid fields to update');
  }

  try {
    // Build dynamic update query
    const setClauses = [];
    const values = [];

    for (const [field, value] of Object.entries(updates)) {
      setClauses.push(`${field} = ?`);
      // Handle gutter_content as JSON
      if (field === 'gutter_content' && Array.isArray(value)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }

    // Add updated_at timestamp
    setClauses.push("updated_at = datetime('now')");

    const query = `
      UPDATE daily_summaries
      SET ${setClauses.join(', ')}
      WHERE summary_date = ?
    `;

    values.push(date);

    await db.prepare(query).bind(...values).run();

    // Invalidate relevant cache entries
    if (kv) {
      try {
        // Clear timeline cache (we can't easily enumerate all keys, so clear common ones)
        const cachePatterns = [
          `timeline:30:0::`,
          `timeline:30:0:${date.slice(0, 4)}:`,
          `timeline:30:0:${date.slice(0, 4)}:${date.slice(5, 7)}`
        ];
        for (const pattern of cachePatterns) {
          await kv.delete(pattern);
        }
      } catch (e) {
        console.warn('Cache invalidation error:', e);
      }
    }

    // Fetch and return updated entry
    const updated = await db.prepare(`
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
        created_at,
        updated_at
      FROM daily_summaries
      WHERE summary_date = ?
    `).bind(date).first();

    return json({
      success: true,
      entry: {
        ...updated,
        repos_active: updated.repos_active ? JSON.parse(updated.repos_active) : [],
        gutter_content: updated.gutter_content ? JSON.parse(updated.gutter_content) : [],
        is_rest_day: updated.commit_count === 0
      }
    });

  } catch (e) {
    if (e.status) throw e;
    console.error('Timeline entry update error:', e);
    throw error(500, 'Failed to update timeline entry');
  }
}
