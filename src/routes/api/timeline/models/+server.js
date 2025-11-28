/**
 * Timeline Models API - Get available AI models
 *
 * GET /api/timeline/models - List all available models
 */

import { json, error } from '@sveltejs/kit';

const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function GET({ cookies }) {
  // Check admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  try {
    const response = await fetch(`${WORKER_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || 'Failed to fetch models');
    }

    return json(data);
  } catch (e) {
    console.error('Models fetch error:', e);
    if (e.status) throw e;
    throw error(500, e.message || 'Failed to fetch models');
  }
}
