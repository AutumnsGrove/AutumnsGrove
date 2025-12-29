/**
 * Timeline Backfill API - Proxy to Daily Summary Worker
 *
 * POST /api/timeline/trigger/backfill?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Generates summaries for a range of past dates (max 30 days)
 * Requires admin authentication
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

// Worker URL
const WORKER_URL = "https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev";

export async function POST({ url, locals, platform }) {
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

  const githubToken = platform?.env?.GITHUB_TOKEN;
  if (!githubToken) {
    throw error(500, "GitHub token not configured");
  }

  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end") || startDate;
  const modelOverride = url.searchParams.get("model");

  if (!startDate) {
    throw error(400, "Missing start date parameter");
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw error(400, "Invalid date format. Use YYYY-MM-DD");
  }

  const params = new URLSearchParams({ start: startDate, end: endDate });
  if (modelOverride) params.set("model", modelOverride);
  const workerUrl = `${WORKER_URL}/backfill?${params.toString()}`;

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw error(response.status, data.error || "Worker request failed");
    }

    return json(data);
  } catch (e) {
    console.error("Timeline backfill error:", e);
    if (e.status) throw e;
    throw error(500, "Failed to backfill summaries");
  }
}
