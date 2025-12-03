/**
 * Timeline Usage API - Get AI usage statistics and costs
 *
 * GET /api/timeline/usage?days=30 - Get usage stats for last N days
 */

import { json, error } from '@sveltejs/kit';
import { verifySession, isAllowedAdmin } from '$lib/auth/session';

const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function GET({ url, cookies, platform }) {
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
    throw error(500, 'Failed to fetch usage stats');
  }
}
