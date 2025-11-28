/**
 * Timeline Trigger API - Proxy to Daily Summary Worker
 *
 * POST /api/timeline/trigger - Generate summary for today
 * POST /api/timeline/trigger?date=YYYY-MM-DD - Generate summary for specific date
 *
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

  // Verify session is valid (simple check - in production, verify JWT)
  // For now, just check that it exists

  const githubToken = platform?.env?.GITHUB_TOKEN;
  if (!githubToken) {
    throw error(500, 'GitHub token not configured');
  }

  const targetDate = url.searchParams.get('date');
  const modelOverride = url.searchParams.get('model');

  let workerUrl = `${WORKER_URL}/trigger`;
  const params = new URLSearchParams();
  if (targetDate) params.set('date', targetDate);
  if (modelOverride) params.set('model', modelOverride);
  if (params.toString()) workerUrl += `?${params.toString()}`;

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
    console.error('Timeline trigger error:', e);
    if (e.status) throw e;
    throw error(500, e.message || 'Failed to trigger summary generation');
  }
}
