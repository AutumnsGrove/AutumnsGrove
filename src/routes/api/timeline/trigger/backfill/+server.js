/**
 * Timeline Backfill API - Proxy to Daily Summary Worker
 *
 * POST /api/timeline/trigger/backfill?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Generates summaries for a range of past dates (max 30 days)
 * Requires admin authentication
 */

import { json, error } from '@sveltejs/kit';

// Worker URL
const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function POST({ url, cookies, platform }) {
  // Check admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  const githubToken = platform?.env?.GITHUB_TOKEN;
  if (!githubToken) {
    throw error(500, 'GitHub token not configured');
  }

  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end') || startDate;

  if (!startDate) {
    throw error(400, 'Missing start date parameter');
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw error(400, 'Invalid date format. Use YYYY-MM-DD');
  }

  const workerUrl = `${WORKER_URL}/backfill?start=${startDate}&end=${endDate}`;

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || 'Worker request failed');
    }

    return json(data);
  } catch (e) {
    console.error('Timeline backfill error:', e);
    if (e.status) throw e;
    throw error(500, e.message || 'Failed to backfill summaries');
  }
}
