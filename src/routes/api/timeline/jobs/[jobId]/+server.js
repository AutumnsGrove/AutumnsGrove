/**
 * Timeline Job Status API - Get status of a specific job
 *
 * GET /api/timeline/jobs/{jobId} - Get job status and progress
 */

import { json, error } from '@sveltejs/kit';

const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

export async function GET({ params, cookies }) {
  // Check admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  const { jobId } = params;

  if (!jobId || jobId.length < 10) {
    throw error(400, 'Invalid job ID');
  }

  try {
    const response = await fetch(`${WORKER_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || 'Failed to fetch job status');
    }

    return json(data);
  } catch (e) {
    console.error('Job status fetch error:', e);
    if (e.status) throw e;
    throw error(500, e.message || 'Failed to fetch job status');
  }
}
