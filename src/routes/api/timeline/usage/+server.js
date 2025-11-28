/**
 * Timeline Usage API - Get AI usage statistics and costs
 *
 * GET /api/timeline/usage?days=30 - Get usage stats for last N days
 */

import { json, error } from '@sveltejs/kit';

const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function GET({ url, cookies }) {
  // Check admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  const days = url.searchParams.get('days') || '30';

  try {
    const response = await fetch(`${WORKER_URL}/usage?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || 'Failed to fetch usage stats');
    }

    return json(data);
  } catch (e) {
    console.error('Usage fetch error:', e);
    if (e.status) throw e;
    throw error(500, e.message || 'Failed to fetch usage stats');
  }
}
