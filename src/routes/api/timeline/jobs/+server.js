/**
 * Timeline Jobs API - Get recent background jobs
 *
 * GET /api/timeline/jobs - List recent jobs
 */

import { json, error } from '@sveltejs/kit';
import { verifySession, isAllowedAdmin } from '@autumnsgrove/groveengine/auth/session';

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

  const githubToken = platform?.env?.GITHUB_TOKEN;
  if (!githubToken) {
    throw error(500, 'GitHub token not configured');
  }

  const limit = url.searchParams.get('limit') || '10';

  try {
    const response = await fetch(`${WORKER_URL}/jobs?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || 'Failed to fetch jobs');
    }

    return json(data);
  } catch (e) {
    console.error('Jobs fetch error:', e);
    if (e.status) throw e;
    throw error(500, 'Failed to fetch jobs');
  }
}
