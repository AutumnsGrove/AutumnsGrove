/**
 * Timeline Job Status API - Get status of a specific job
 *
 * GET /api/timeline/jobs/{jobId} - Get job status and progress
 */

import { json, error } from "@sveltejs/kit";

/**
 * Check if an email is in the allowed admins list
 * @param {string} email - User's email
 * @param {string} allowedAdmins - Comma-separated list of allowed admin emails
 * @returns {boolean}
 */
function isAllowedAdmin(email, allowedAdmins) {
  if (!email || !allowedAdmins) return false;
  const allowed = allowedAdmins.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

const WORKER_URL = "https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev";

export async function GET({ params, locals, platform }) {
  // Verify admin authentication (session already verified in hooks)
  const user = locals.user;
  if (!user) {
    throw error(401, "Authentication required");
  }

  // Verify admin access
  const allowedAdmins = platform.env.ALLOWED_EMAILS || "";
  if (!isAllowedAdmin(user.email, allowedAdmins)) {
    throw error(403, "Admin access required");
  }

  const { jobId } = params;

  if (!jobId || jobId.length < 10) {
    throw error(400, "Invalid job ID");
  }

  try {
    const response = await fetch(`${WORKER_URL}/jobs/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || "Failed to fetch job status");
    }

    return json(data);
  } catch (e) {
    console.error("Job status fetch error:", e);
    if (e.status) throw e;
    throw error(500, "Failed to fetch job status");
  }
}
