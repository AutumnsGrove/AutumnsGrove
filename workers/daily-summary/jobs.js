/**
 * Background Job Processing Module
 *
 * Handles queued jobs for async processing of timeline summaries.
 * Uses Cloudflare Queues for reliable background processing.
 */

/**
 * Generate a simple UUID v4
 */
export function generateJobId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new background job
 * @param {D1Database} db - D1 database
 * @param {object} jobData - Job configuration
 * @returns {Promise<object>} Created job
 */
export async function createJob(db, { jobType, totalItems, metadata }) {
  const jobId = generateJobId();

  await db.prepare(`
    INSERT INTO background_jobs (id, job_type, status, progress, total_items, completed_items, metadata)
    VALUES (?, ?, 'pending', 0, ?, 0, ?)
  `).bind(jobId, jobType, totalItems, JSON.stringify(metadata)).run();

  return {
    id: jobId,
    jobType,
    status: 'pending',
    progress: 0,
    totalItems,
    completedItems: 0,
    metadata
  };
}

/**
 * Update job progress
 */
export async function updateJobProgress(db, jobId, completedItems, totalItems) {
  const progress = Math.round((completedItems / totalItems) * 100);

  await db.prepare(`
    UPDATE background_jobs
    SET completed_items = ?, progress = ?, status = 'processing', updated_at = datetime('now')
    WHERE id = ?
  `).bind(completedItems, progress, jobId).run();
}

/**
 * Mark job as completed
 */
export async function completeJob(db, jobId, result) {
  await db.prepare(`
    UPDATE background_jobs
    SET status = 'completed', progress = 100, result = ?, completed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(JSON.stringify(result), jobId).run();
}

/**
 * Mark job as failed
 */
export async function failJob(db, jobId, errorMessage) {
  await db.prepare(`
    UPDATE background_jobs
    SET status = 'failed', error_message = ?, completed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(errorMessage, jobId).run();
}

/**
 * Get job by ID
 */
export async function getJob(db, jobId) {
  const job = await db.prepare(`
    SELECT * FROM background_jobs WHERE id = ?
  `).bind(jobId).first();

  if (job) {
    job.metadata = job.metadata ? JSON.parse(job.metadata) : null;
    job.result = job.result ? JSON.parse(job.result) : null;
  }

  return job;
}

/**
 * Get recent jobs
 */
export async function getRecentJobs(db, limit = 10) {
  const jobs = await db.prepare(`
    SELECT * FROM background_jobs
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return jobs.results.map(job => ({
    ...job,
    metadata: job.metadata ? JSON.parse(job.metadata) : null,
    result: job.result ? JSON.parse(job.result) : null
  }));
}

/**
 * Clean up old completed jobs (older than 7 days)
 */
export async function cleanupOldJobs(db) {
  await db.prepare(`
    DELETE FROM background_jobs
    WHERE status IN ('completed', 'failed')
    AND created_at < datetime('now', '-7 days')
  `).run();
}

/**
 * Queue message types
 */
export const JOB_TYPES = {
  BACKFILL: 'backfill',
  SINGLE_SUMMARY: 'single_summary',
};
