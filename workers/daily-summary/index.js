/**
 * Daily Summary Worker
 *
 * Generates AI-powered daily development summaries from GitHub commits
 * and stores them in D1 for the timeline feature.
 *
 * Triggers:
 * - Scheduled: 11:59 PM Eastern daily (cron)
 * - Manual: POST /trigger (for admin testing)
 *
 * AI Providers:
 * - Anthropic (Claude Haiku 4.5) - Default
 * - Cloudflare Workers AI (Llama, Gemma, Mistral)
 * - Moonshot AI (Kimi K2) - Future
 */

import { buildSummaryPrompt, parseAIResponse, SYSTEM_PROMPT } from './prompts.js';
import {
  generateAIResponse,
  getAllModels,
  parseModelString,
  calculateCost,
  AI_PROVIDERS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL
} from './providers.js';
import {
  getJob,
  getRecentJobs,
  cleanupOldJobs
} from './jobs.js';

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
 * Get formatted date string (YYYY-MM-DD) for today in timezone
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
 */
async function fetchCommitsForDate(username, token, dateStr) {
  const startOfDay = new Date(dateStr + 'T00:00:00Z');
  const endOfDay = new Date(dateStr + 'T23:59:59Z');
  const since = startOfDay.toISOString();

  console.log(`Fetching commits for ${dateStr}`);

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AutumnsGrove-DailySummary'
    },
    body: JSON.stringify({
      query: COMMITS_QUERY,
      variables: { username, first: 30, since }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  const commits = [];
  const repos = data.data?.user?.repositories?.nodes || [];

  for (const repo of repos) {
    const history = repo.defaultBranchRef?.target?.history?.nodes || [];

    for (const commit of history) {
      if (commit.author?.user?.login?.toLowerCase() === username.toLowerCase()) {
        const commitDate = new Date(commit.committedDate);
        if (commitDate <= endOfDay) {
          commits.push({
            sha: commit.oid.substring(0, 7),
            message: commit.message.split('\n')[0].substring(0, 100),
            date: commit.committedDate,
            repo: repo.name,
            additions: commit.additions || 0,
            deletions: commit.deletions || 0
          });
        }
      }
    }
  }

  commits.sort((a, b) => new Date(b.date) - new Date(a.date));
  return commits;
}

/**
 * Track AI usage and costs in database
 */
async function trackAIUsage(db, provider, model, inputTokens, outputTokens, cost, summaryDate, success = true, errorMessage = null) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Update aggregate usage table
    await db.prepare(`
      INSERT INTO ai_usage (usage_date, provider, model, request_count, input_tokens, output_tokens, estimated_cost_usd, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, datetime('now'))
      ON CONFLICT(usage_date, provider, model) DO UPDATE SET
        request_count = request_count + 1,
        input_tokens = input_tokens + excluded.input_tokens,
        output_tokens = output_tokens + excluded.output_tokens,
        estimated_cost_usd = estimated_cost_usd + excluded.estimated_cost_usd,
        updated_at = datetime('now')
    `).bind(today, provider, model, inputTokens, outputTokens, cost).run();

    // Insert individual request record
    await db.prepare(`
      INSERT INTO ai_requests (request_date, provider, model, purpose, input_tokens, output_tokens, estimated_cost_usd, summary_date, success, error_message)
      VALUES (?, ?, ?, 'daily_summary', ?, ?, ?, ?, ?, ?)
    `).bind(today, provider, model, inputTokens, outputTokens, cost, summaryDate, success ? 1 : 0, errorMessage).run();

  } catch (e) {
    console.error('Failed to track AI usage:', e);
  }
}

/**
 * Generate summary using configured AI provider
 */
async function generateSummary(env, commits, date, ownerName, providerModel = null) {
  const { provider, model } = parseModelString(providerModel || env.AI_MODEL || `${DEFAULT_PROVIDER}:${DEFAULT_MODEL}`);
  const prompt = buildSummaryPrompt(commits, date, ownerName);

  console.log(`Generating AI summary using ${provider}:${model}...`);

  try {
    const response = await generateAIResponse(env, provider, model, SYSTEM_PROMPT, prompt);

    // Track usage
    await trackAIUsage(
      env.DB,
      provider,
      model,
      response.inputTokens,
      response.outputTokens,
      response.cost,
      date,
      true
    );

    const result = parseAIResponse(response.content);
    result.provider = provider;
    result.model = model;
    result.cost = response.cost;
    result.inputTokens = response.inputTokens;
    result.outputTokens = response.outputTokens;

    return result;
  } catch (error) {
    // Track failed request
    await trackAIUsage(env.DB, provider, model, 0, 0, 0, date, false, error.message);
    throw error;
  }
}

/**
 * Store daily summary in D1
 */
async function storeSummary(db, date, summary, commits) {
  const reposActive = [...new Set(commits.map(c => c.repo))];
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const gutterJson = summary.gutter ? JSON.stringify(summary.gutter) : null;
  const modelString = `${summary.provider}:${summary.model}`;

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
    modelString
  ).run();
}

/**
 * Store a rest day (no commits) in D1
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
 */
async function generateDailySummary(env, targetDate = null, modelOverride = null) {
  const username = env.GITHUB_USERNAME || 'AutumnsGrove';
  const ownerName = env.OWNER_NAME || 'the developer';
  const timezone = env.TIMEZONE || 'America/New_York';
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN secret not configured');
  }

  const summaryDate = targetDate || getTodayDateString(timezone);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(summaryDate)) {
    throw new Error(`Invalid date format: ${summaryDate}. Expected YYYY-MM-DD`);
  }

  console.log(`Generating summary for ${summaryDate}`);

  const commits = await fetchCommitsForDate(username, token, summaryDate);
  console.log(`Found ${commits.length} commits for ${summaryDate}`);

  if (commits.length === 0) {
    await storeRestDay(env.DB, summaryDate);
    return {
      success: true,
      date: summaryDate,
      type: 'rest_day',
      message: `No commits on ${summaryDate} - stored as rest day`
    };
  }

  const providerModel = modelOverride || env.AI_MODEL;
  const summary = await generateSummary(env, commits, summaryDate, ownerName, providerModel);
  await storeSummary(env.DB, summaryDate, summary, commits);

  return {
    success: true,
    date: summaryDate,
    type: 'summary',
    commit_count: commits.length,
    repos: [...new Set(commits.map(c => c.repo))],
    brief: summary.brief,
    provider: summary.provider,
    model: summary.model,
    cost: summary.cost,
    tokens: {
      input: summary.inputTokens,
      output: summary.outputTokens
    }
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
   * HTTP fetch handler
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', defaultProvider: DEFAULT_PROVIDER }), {
          headers: corsHeaders
        });
      }

      // Get available AI models
      if (url.pathname === '/models' && request.method === 'GET') {
        const models = getAllModels();
        const { provider, model } = parseModelString(env.AI_MODEL);

        return new Response(JSON.stringify({
          models,
          providers: Object.entries(AI_PROVIDERS).map(([id, p]) => ({
            id,
            name: p.name,
            notImplemented: p.notImplemented || false
          })),
          default: { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL },
          current: { provider, model }
        }), { headers: corsHeaders });
      }

      // Get AI usage stats with costs
      if (url.pathname === '/usage' && request.method === 'GET') {
        const days = parseInt(url.searchParams.get('days') || '30');

        // Get aggregate usage
        const usage = await env.DB.prepare(`
          SELECT usage_date, provider, model, request_count, input_tokens, output_tokens, estimated_cost_usd
          FROM ai_usage
          WHERE usage_date >= date('now', '-' || ? || ' days')
          ORDER BY usage_date DESC, provider, model
        `).bind(days).all();

        // Get recent individual requests
        const requests = await env.DB.prepare(`
          SELECT request_date, request_time, provider, model, purpose, input_tokens, output_tokens, estimated_cost_usd, summary_date, success
          FROM ai_requests
          WHERE request_date >= date('now', '-' || ? || ' days')
          ORDER BY request_time DESC
          LIMIT 100
        `).bind(days).all();

        // Calculate totals
        const totals = { byProvider: {}, byModel: {}, totalRequests: 0, totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0 };

        for (const row of usage.results) {
          totals.byProvider[row.provider] = (totals.byProvider[row.provider] || 0) + row.estimated_cost_usd;
          totals.byModel[row.model] = (totals.byModel[row.model] || 0) + row.estimated_cost_usd;
          totals.totalRequests += row.request_count;
          totals.totalCost += row.estimated_cost_usd;
          totals.totalInputTokens += row.input_tokens;
          totals.totalOutputTokens += row.output_tokens;
        }

        // Calculate daily costs for charting
        const dailyCosts = {};
        for (const row of usage.results) {
          dailyCosts[row.usage_date] = (dailyCosts[row.usage_date] || 0) + row.estimated_cost_usd;
        }

        return new Response(JSON.stringify({
          days,
          usage: usage.results,
          requests: requests.results,
          totals,
          dailyCosts: Object.entries(dailyCosts).map(([date, cost]) => ({ date, cost })).sort((a, b) => a.date.localeCompare(b.date))
        }), { headers: corsHeaders });
      }

      // Manual trigger endpoint
      if (url.pathname === '/trigger' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        const targetDate = url.searchParams.get('date');
        const modelOverride = url.searchParams.get('model');
        const result = await generateDailySummary(env, targetDate, modelOverride);

        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // Backfill endpoint
      if (url.pathname === '/backfill' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        const startDate = url.searchParams.get('start');
        const endDate = url.searchParams.get('end') || startDate;
        const modelOverride = url.searchParams.get('model');

        if (!startDate) {
          return new Response(JSON.stringify({ error: 'Missing start date parameter' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
          return new Response(JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const results = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const maxDays = 30;
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (daysDiff > maxDays) {
          return new Response(JSON.stringify({ error: `Maximum ${maxDays} days allowed per request` }), {
            status: 400,
            headers: corsHeaders
          });
        }

        let totalCost = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          try {
            const result = await generateDailySummary(env, dateStr, modelOverride);
            results.push(result);
            if (result.cost) totalCost += result.cost;
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
          totalCost,
          results
        }), { headers: corsHeaders });
      }

      // Get latest summary
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

      // ======================================================================
      // Background Job Endpoints (kept for future use)
      // Note: Cloudflare Queues require paid plan. Consider D1+cron as alternative.
      // ======================================================================

      // Get job status by ID
      if (url.pathname.startsWith('/jobs/') && request.method === 'GET') {
        const jobId = url.pathname.replace('/jobs/', '');

        if (!jobId || jobId.length < 10) {
          return new Response(JSON.stringify({ error: 'Invalid job ID' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const job = await getJob(env.DB, jobId);

        if (!job) {
          return new Response(JSON.stringify({ error: 'Job not found' }), {
            status: 404,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify(job), { headers: corsHeaders });
      }

      // Get recent jobs list
      if (url.pathname === '/jobs' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: corsHeaders
          });
        }

        const limit = parseInt(url.searchParams.get('limit') || '10');
        const jobs = await getRecentJobs(env.DB, Math.min(limit, 50));

        return new Response(JSON.stringify({ jobs }), { headers: corsHeaders });
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

      // Clean up old jobs periodically
      await cleanupOldJobs(env.DB);
    } catch (error) {
      console.error('Scheduled job failed:', error);
    }
  }
};
