/**
 * Timeline Trigger API - Proxy to Daily Summary Worker
 *
 * POST /api/timeline/trigger - Generate summary for today
 * POST /api/timeline/trigger?date=YYYY-MM-DD - Generate summary for specific date
 *
 * Requires admin authentication
 */

import { json, error } from '@sveltejs/kit';
import { verifySession, isAllowedAdmin } from '@autumnsgrove/grove-engine/auth/session';

// Worker URL
const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function POST({ url, cookies, platform }) {
  // Verify admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  let user;
  try {
    user = await verifySession(sessionToken, platform.env.SESSION_SECRET);
    if (!user) {
      throw error(401, 'Invalid session');
    }
  } catch (e) {
    if (e.status) throw e;
    throw error(401, 'Authentication failed');
  }

  // Verify admin access
  const allowedAdmins = platform.env.ALLOWED_EMAILS || '';
  if (!isAllowedAdmin(user.email, allowedAdmins)) {
    throw error(403, 'Admin access required');
  }

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
    throw error(500, 'Failed to trigger summary generation');
  }
}
