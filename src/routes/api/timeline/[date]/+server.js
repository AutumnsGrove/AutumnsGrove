/**
 * Timeline Entry API - Get/Update a specific timeline entry
 *
 * GET /api/timeline/[date] - Get a specific entry
 * PUT /api/timeline/[date] - Update entry (admin only)
 */

import { json, error } from '@sveltejs/kit';
import { verifySession } from '$lib/auth/session.js';
import { safeJsonParse } from '$lib/utils/json.js';

// Validation constants
const MAX_BRIEF_SUMMARY_LENGTH = 500;
const MAX_DETAILED_TIMELINE_LENGTH = 50000;

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
      repos_active: safeJsonParse(entry.repos_active, []),
      gutter_content: safeJsonParse(entry.gutter_content, []),
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
  // Note: verifySession returns a user only for valid sessions. In this app,
  // only admins can create sessions (via OAuth with allowed emails list),
  // so a valid session implies admin privileges.
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

  // Whitelist allowed fields and validate
  const allowedFields = ['brief_summary', 'detailed_timeline', 'gutter_content'];
  const updates = {};

  for (const field of allowedFields) {
    if (field in body) {
      const value = body[field];

      // Validate field-specific constraints
      if (field === 'brief_summary') {
        if (typeof value !== 'string') {
          throw error(400, 'brief_summary must be a string');
        }
        if (value.length > MAX_BRIEF_SUMMARY_LENGTH) {
          throw error(400, `brief_summary exceeds maximum length of ${MAX_BRIEF_SUMMARY_LENGTH} characters`);
        }
      }

      if (field === 'detailed_timeline') {
        if (typeof value !== 'string') {
          throw error(400, 'detailed_timeline must be a string');
        }
        if (value.length > MAX_DETAILED_TIMELINE_LENGTH) {
          throw error(400, `detailed_timeline exceeds maximum length of ${MAX_DETAILED_TIMELINE_LENGTH} characters`);
        }
      }

      if (field === 'gutter_content') {
        if (!Array.isArray(value)) {
          throw error(400, 'gutter_content must be an array');
        }
        // Validate array items have expected structure (line, type, content)
        for (const item of value) {
          if (typeof item !== 'object' || item === null) {
            throw error(400, 'gutter_content items must be objects');
          }
        }
      }

      updates[field] = value;
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
    // Cache key format: timeline:{limit}:{offset}:{year}:{month}
    // See /api/timeline/+server.js for cache key generation.
    // KV doesn't support wildcard deletion, so we clear the most common patterns.
    // This covers: default view (30 items), year filter, and year+month filter.
    // Note: Entries with different limit/offset may show stale data until TTL expires (5 min).
    if (kv) {
      try {
        const year = date.slice(0, 4);
        const month = date.slice(5, 7);
        const cachePatterns = [
          `timeline:30:0::`,                    // Default view (no filters)
          `timeline:30:0:${year}:`,             // Year filter
          `timeline:30:0:${year}:${month}`      // Year + month filter
        ];
        for (const pattern of cachePatterns) {
          await kv.delete(pattern);
        }
        console.log(`Cache invalidated for date ${date}: ${cachePatterns.length} keys`);
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
        repos_active: safeJsonParse(updated.repos_active, []),
        gutter_content: safeJsonParse(updated.gutter_content, []),
        is_rest_day: updated.commit_count === 0
      }
    });

  } catch (e) {
    if (e.status) throw e;
    console.error('Timeline entry update error:', e);
    throw error(500, 'Failed to update timeline entry');
  }
}
