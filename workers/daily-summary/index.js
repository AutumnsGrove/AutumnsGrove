/**
 * Daily Summary Worker
 *
 * Generates AI-powered daily development summaries from GitHub commits
 * and stores them in D1 for the timeline feature.
 *
 * Triggers:
 * - Scheduled: 11:59 PM Eastern daily (cron)
 * - Manual: POST /trigger (for admin testing)
 */

import { buildSummaryPrompt, parseAIResponse } from './prompts.js';

// GraphQL query to fetch commits for a specific date range
const COMMITS_QUERY = `
query($username: String!, $first: Int!, $since: GitTimestamp!) {
  user(login: $username) {
    repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        name
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, since: $since) {
                nodes {
                  oid
                  message
                  committedDate
                  additions
                  deletions
                  author {
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

/**
 * Get the start of today in the configured timezone
 * @param {string} timezone - IANA timezone string
 * @returns {Date} Start of day in UTC
 */
function getStartOfDay(timezone) {
  const now = new Date();

  // Get current date parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;

  // Create date string and parse it back
  const dateStr = `${year}-${month}-${day}T00:00:00`;

  // Create a date in the target timezone, then convert to UTC
  const localDate = new Date(dateStr);

  // Calculate timezone offset for the start of day
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate - tzDate;

  return new Date(localDate.getTime() + offset);
}

/**
 * Get formatted date string (YYYY-MM-DD) for today in timezone
 * @param {string} timezone - IANA timezone string
 * @returns {string} Date in YYYY-MM-DD format
 */
function getTodayDateString(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

/**
 * Fetch commits for a specific date from GitHub
 * @param {string} username - GitHub username
 * @param {string} token - GitHub API token
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of commit objects
 */
async function fetchCommitsForDate(username, token, dateStr) {
  // Calculate start and end of the target date (using UTC for consistency)
  const startOfDay = new Date(dateStr + 'T00:00:00Z');
  const endOfDay = new Date(dateStr + 'T23:59:59Z');

  const since = startOfDay.toISOString();
  const until = endOfDay.toISOString();

  console.log(`Fetching commits for ${dateStr}: ${since} to ${until}`);

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AutumnsGrove-DailySummary'
    },
    body: JSON.stringify({
      query: COMMITS_QUERY,
      variables: {
        username,
        first: 30,
        since
      }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  // Extract and flatten commits
  const commits = [];
  const repos = data.data?.user?.repositories?.nodes || [];

  for (const repo of repos) {
    const history = repo.defaultBranchRef?.target?.history?.nodes || [];

    for (const commit of history) {
      // Only include commits by this user
      if (commit.author?.user?.login?.toLowerCase() === username.toLowerCase()) {
        // Filter by end date (GitHub API only supports 'since', not 'until')
        const commitDate = new Date(commit.committedDate);
        if (commitDate <= endOfDay) {
          commits.push({
            sha: commit.oid.substring(0, 7),
            message: commit.message.split('\n')[0].substring(0, 100), // First line, max 100 chars
            date: commit.committedDate,
            repo: repo.name,
            additions: commit.additions || 0,
            deletions: commit.deletions || 0
          });
        }
      }
    }
  }

  // Sort by date (newest first)
  commits.sort((a, b) => new Date(b.date) - new Date(a.date));

  return commits;
}

/**
 * Generate summary using Cloudflare Workers AI
 * @param {object} ai - AI binding
 * @param {Array} commits - Array of commit objects
 * @param {string} date - Date string
 * @param {string} ownerName - Name of the developer
 * @returns {Promise<object>} Summary object with brief, detailed, and gutter fields
 */
async function generateSummary(ai, commits, date, ownerName) {
  const prompt = buildSummaryPrompt(commits, date, ownerName);

  console.log(`Generating AI summary for ${ownerName}...`);

  const response = await ai.run('@cf/meta/llama-3.1-70b-instruct', {
    messages: [
      {
        role: 'system',
        content: 'You are a friendly, whimsical AI assistant that summarizes development activity with personality. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 2048, // Increased for gutter content
    temperature: 0.5 // Slightly higher for more personality
  });

  return parseAIResponse(response.response);
}

/**
 * Store daily summary in D1
 * @param {object} db - D1 database binding
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {object} summary - Summary data
 * @param {Array} commits - Original commits array
 */
async function storeSummary(db, date, summary, commits) {
  const reposActive = [...new Set(commits.map(c => c.repo))];
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

  // Convert gutter content to JSON string
  const gutterJson = summary.gutter ? JSON.stringify(summary.gutter) : null;

  await db.prepare(`
    INSERT INTO daily_summaries (
      summary_date, brief_summary, detailed_timeline, gutter_content,
      commit_count, repos_active, total_additions, total_deletions,
      ai_model, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(summary_date) DO UPDATE SET
      brief_summary = excluded.brief_summary,
      detailed_timeline = excluded.detailed_timeline,
      gutter_content = excluded.gutter_content,
      commit_count = excluded.commit_count,
      repos_active = excluded.repos_active,
      total_additions = excluded.total_additions,
      total_deletions = excluded.total_deletions,
      ai_model = excluded.ai_model,
      updated_at = datetime('now')
  `).bind(
    date,
    summary.brief,
    summary.detailed,
    gutterJson,
    commits.length,
    JSON.stringify(reposActive),
    totalAdditions,
    totalDeletions,
    '@cf/meta/llama-3.1-70b-instruct'
  ).run();
}

/**
 * Store a rest day (no commits) in D1
 * @param {object} db - D1 database binding
 * @param {string} date - Date in YYYY-MM-DD format
 */
async function storeRestDay(db, date) {
  await db.prepare(`
    INSERT INTO daily_summaries (
      summary_date, brief_summary, detailed_timeline,
      commit_count, repos_active, total_additions, total_deletions,
      ai_model, updated_at
    ) VALUES (?, NULL, NULL, 0, '[]', 0, 0, NULL, datetime('now'))
    ON CONFLICT(summary_date) DO UPDATE SET
      brief_summary = NULL,
      detailed_timeline = NULL,
      commit_count = 0,
      repos_active = '[]',
      total_additions = 0,
      total_deletions = 0,
      ai_model = NULL,
      updated_at = datetime('now')
  `).bind(date).run();
}

/**
 * Main summary generation logic
 * @param {object} env - Environment bindings
 * @param {string} targetDate - Optional specific date (YYYY-MM-DD) to generate summary for
 */
async function generateDailySummary(env, targetDate = null) {
  const username = env.GITHUB_USERNAME || 'AutumnsGrove';
  const ownerName = env.OWNER_NAME || 'the developer';
  const timezone = env.TIMEZONE || 'America/New_York';
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN secret not configured');
  }

  // Use target date if provided, otherwise use today
  const summaryDate = targetDate || getTodayDateString(timezone);

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(summaryDate)) {
    throw new Error(`Invalid date format: ${summaryDate}. Expected YYYY-MM-DD`);
  }

  console.log(`Generating summary for ${summaryDate} (${timezone})`);

  // Fetch commits for the target date
  const commits = await fetchCommitsForDate(username, token, summaryDate);
  console.log(`Found ${commits.length} commits for ${summaryDate}`);

  if (commits.length === 0) {
    // Rest day - store null summary
    await storeRestDay(env.DB, summaryDate);
    return {
      success: true,
      date: summaryDate,
      type: 'rest_day',
      message: `No commits on ${summaryDate} - stored as rest day`
    };
  }

  // Generate AI summary
  const summary = await generateSummary(env.AI, commits, summaryDate, ownerName);

  // Store in D1
  await storeSummary(env.DB, summaryDate, summary, commits);

  return {
    success: true,
    date: summaryDate,
    type: 'summary',
    commit_count: commits.length,
    repos: [...new Set(commits.map(c => c.repo))],
    brief: summary.brief
  };
}

/**
 * CORS headers for API responses
 */
function getCorsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://autumnsgrove.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

export default {
  /**
   * HTTP fetch handler - for manual triggers and health checks
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: corsHeaders
        });
      }

      // Manual trigger endpoint (for admin testing)
      // POST /trigger - Generate summary for today
      // POST /trigger?date=YYYY-MM-DD - Generate summary for specific date
      if (url.pathname === '/trigger' && request.method === 'POST') {
        // Verify authorization - require any valid bearer token
        // The calling admin API has already authenticated the user via session
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized - Bearer token required' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // Check for specific date parameter
        const targetDate = url.searchParams.get('date');
        const result = await generateDailySummary(env, targetDate);
        return new Response(JSON.stringify(result), {
          headers: corsHeaders
        });
      }

      // Backfill endpoint - Generate summaries for a range of past dates
      // POST /backfill?start=YYYY-MM-DD&end=YYYY-MM-DD
      if (url.pathname === '/backfill' && request.method === 'POST') {
        // Verify authorization - require any valid bearer token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized - Bearer token required' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        const startDate = url.searchParams.get('start');
        const endDate = url.searchParams.get('end') || startDate;

        if (!startDate) {
          return new Response(JSON.stringify({ error: 'Missing start date parameter' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Validate date formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
          return new Response(JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Generate summaries for each date in range
        const results = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Limit to 30 days max to prevent abuse
        const maxDays = 30;
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > maxDays) {
          return new Response(JSON.stringify({ error: `Maximum ${maxDays} days allowed per request` }), {
            status: 400,
            headers: corsHeaders
          });
        }

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          try {
            const result = await generateDailySummary(env, dateStr);
            results.push(result);
          } catch (error) {
            results.push({
              date: dateStr,
              success: false,
              error: error.message
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          processed: results.length,
          results
        }), {
          headers: corsHeaders
        });
      }

      // Get latest summary (for quick status check)
      if (url.pathname === '/latest' && request.method === 'GET') {
        const latest = await env.DB.prepare(`
          SELECT * FROM daily_summaries
          ORDER BY summary_date DESC
          LIMIT 1
        `).first();

        return new Response(JSON.stringify(latest || { message: 'No summaries yet' }), {
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  /**
   * Scheduled handler - runs on cron trigger
   */
  async scheduled(event, env, ctx) {
    console.log('Scheduled trigger fired:', event.cron);

    try {
      const result = await generateDailySummary(env);
      console.log('Summary generated:', result);
    } catch (error) {
      console.error('Scheduled job failed:', error);
      // Don't throw - we don't want the worker to report failure
      // Logging is sufficient for debugging
    }
  }
};
