/**
 * Long-Horizon Context Module
 *
 * Enables the daily summary AI to recognize and comment on multi-day tasks
 * by providing historical context from previous summaries.
 *
 * Key concepts:
 * - Context Brief: Condensed summary data stored for future reference
 * - Detected Focus: Pattern-matched task type (e.g., "security work", "refactoring")
 * - Continuation: When same focus detected across multiple days
 * - Focus Streak: Number of consecutive days on same task
 */

/**
 * Task detection patterns
 * Each pattern maps keywords to a human-readable task type
 */
const TASK_PATTERNS = [
  {
    pattern: /security|audit|vulnerab|xss|csrf|auth.*fix/i,
    task: "security work",
  },
  { pattern: /migration?|migrate|upgrade/i, task: "migration" },
  { pattern: /refactor|cleanup|reorganize|restructur/i, task: "refactoring" },
  { pattern: /test|coverage|spec|jest|vitest/i, task: "testing improvements" },
  { pattern: /docs?|documentation|readme|comment/i, task: "documentation" },
  { pattern: /ui|design|style|css|tailwind|layout/i, task: "UI/UX work" },
  { pattern: /api|endpoint|route|graphql|rest/i, task: "API development" },
  { pattern: /auth|login|session|oauth|jwt/i, task: "authentication" },
  {
    pattern: /perf|performance|optimiz|speed|cache/i,
    task: "performance optimization",
  },
  {
    pattern: /deploy|ci|cd|pipeline|docker|build/i,
    task: "deployment/CI work",
  },
  { pattern: /database|schema|sql|d1|migration/i, task: "database work" },
  { pattern: /bug|fix|patch|issue|error/i, task: "bug fixes" },
];

/**
 * Generate a condensed context brief from a summary
 * Used for passing historical context to future summaries
 *
 * @param {object} summary - Parsed summary from AI (brief, detailed, gutter)
 * @param {Array} commits - Array of commit objects
 * @returns {object} Context brief for storage
 */
export function generateContextBrief(summary, commits) {
  const repos = [...new Set(commits.map((c) => c.repo))];
  const linesChanged = commits.reduce(
    (sum, c) => sum + (c.additions || 0) + (c.deletions || 0),
    0,
  );

  // Extract main focus from summary content
  const mainFocus = extractMainFocus(summary);

  // Detect task type from commits and summary
  const detectedTask = detectTask(summary, commits);

  return {
    date: null, // Will be set by caller
    mainFocus,
    repos: repos.slice(0, 3), // Top 3 repos
    linesChanged,
    commitCount: commits.length,
    detectedTask,
  };
}

/**
 * Extract main focus from summary markdown
 * Looks for the brief summary or first substantive sentence
 *
 * @param {object} summary - Parsed summary object
 * @returns {string} Main focus description (1-2 sentences)
 */
function extractMainFocus(summary) {
  // Use the brief summary if available
  if (summary.brief && summary.brief.length > 20) {
    // Take first 200 chars, break at sentence if possible
    const brief = summary.brief.substring(0, 200);
    const sentenceEnd = brief.search(/[.!?]\s/);
    if (sentenceEnd > 50) {
      return brief.substring(0, sentenceEnd + 1).trim();
    }
    return brief.trim();
  }

  // Fallback: try to extract from detailed content
  if (summary.detailed) {
    const lines = summary.detailed.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      // Skip headers
      if (line.startsWith("#")) continue;
      // Skip list markers alone
      if (line.match(/^[-*+]\s*$/)) continue;
      // Find first substantial line
      if (line.length > 20 && line.length < 200) {
        return line
          .replace(/^[-*+]\s*/, "")
          .replace(/\*\*/g, "")
          .trim();
      }
    }
  }

  return "Various development tasks";
}

/**
 * Quick task detection from text only (for pre-summary detection)
 *
 * @param {string} text - Text to analyze (e.g., commit messages)
 * @returns {string|null} Detected task type or null
 */
export function detectTaskFromText(text) {
  if (!text) return null;

  const scores = TASK_PATTERNS.map(({ pattern, task }) => {
    const matches = text.match(new RegExp(pattern, "gi")) || [];
    return { task, score: matches.length };
  }).filter((s) => s.score > 0);

  if (scores.length === 0) return null;
  scores.sort((a, b) => b.score - a.score);
  return scores[0].task;
}

/**
 * Detect if commits and summary indicate a specific ongoing task type
 *
 * @param {object} summary - Parsed summary object
 * @param {Array} commits - Array of commit objects
 * @returns {string|null} Detected task type or null
 */
export function detectTask(summary, commits) {
  // Combine all text for pattern matching
  const allMessages = commits.map((c) => c.message).join(" ");
  const summaryText = [summary.brief || "", summary.detailed || ""].join(" ");
  const combinedText = allMessages + " " + summaryText;

  // Score each pattern
  const scores = TASK_PATTERNS.map(({ pattern, task }) => {
    const matches = combinedText.match(new RegExp(pattern, "gi")) || [];
    return { task, score: matches.length };
  }).filter((s) => s.score > 0);

  // Return highest scoring task, or null if no matches
  if (scores.length === 0) return null;

  scores.sort((a, b) => b.score - a.score);
  return scores[0].task;
}

/**
 * Retrieve historical context for summary generation
 * Returns last 3 days of context briefs (skipping rest days)
 *
 * @param {D1Database} db - D1 database binding
 * @param {string} targetDate - Target date (YYYY-MM-DD) to get context for
 * @returns {Promise<Array>} Array of historical context objects
 */
export async function getHistoricalContext(db, targetDate) {
  const dateObj = new Date(targetDate);

  // Get past 7 days to account for gaps (weekends, etc)
  // but only return up to 3 with actual context
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const placeholders = dates.map(() => "?").join(",");
  const query = `
    SELECT summary_date, context_brief, detected_focus, brief_summary, commit_count
    FROM daily_summaries
    WHERE summary_date IN (${placeholders})
      AND commit_count > 0
    ORDER BY summary_date DESC
    LIMIT 3
  `;

  try {
    const { results } = await db
      .prepare(query)
      .bind(...dates)
      .all();

    return results
      .map((row) => ({
        date: row.summary_date,
        brief: row.context_brief ? JSON.parse(row.context_brief) : null,
        focus: row.detected_focus ? JSON.parse(row.detected_focus) : null,
        // Fallback to brief_summary if no context_brief yet (for transition period)
        briefSummary: row.brief_summary,
      }))
      .filter((r) => r.brief || r.briefSummary);
  } catch (error) {
    console.error("Failed to get historical context:", error);
    return [];
  }
}

/**
 * Detect multi-day task continuation
 *
 * @param {Array} historicalContext - Array of historical context objects
 * @param {string|null} currentFocus - Current day's detected task focus
 * @returns {object|null} Continuation info or null
 */
export function detectContinuation(historicalContext, currentFocus) {
  if (!currentFocus || historicalContext.length === 0) {
    return null;
  }

  // Check if same focus across multiple days
  let streak = 0;
  let startDate = null;

  for (const ctx of historicalContext) {
    const ctxFocus = ctx.focus?.task || ctx.brief?.detectedTask;
    if (ctxFocus === currentFocus) {
      streak++;
      startDate = ctx.date;
    } else {
      break; // Streak broken
    }
  }

  if (streak >= 1) {
    return {
      task: currentFocus,
      startDate,
      dayCount: streak + 1, // +1 for current day
    };
  }

  return null;
}

/**
 * Build detected focus object for storage
 *
 * @param {string} task - Task type string
 * @param {string} date - Current date
 * @param {Array} repos - Repos involved
 * @returns {object} Detected focus object
 */
export function buildDetectedFocus(task, date, repos) {
  if (!task) return null;

  return {
    task,
    startDate: date,
    repos: repos.slice(0, 3),
  };
}

/**
 * Format historical context for prompt inclusion
 * Creates a human-readable summary of recent activity
 *
 * @param {Array} historicalContext - Array of historical context objects
 * @returns {string} Formatted context string for prompt
 */
export function formatHistoricalContextForPrompt(historicalContext) {
  if (!historicalContext || historicalContext.length === 0) {
    return "";
  }

  const lines = historicalContext.map((ctx) => {
    const brief = ctx.brief;
    const focus = brief?.mainFocus || ctx.briefSummary || "Various work";
    const repos = brief?.repos?.join(", ") || "multiple repos";
    const loc = brief?.linesChanged || 0;
    const task = ctx.focus?.task || brief?.detectedTask;

    return `**${ctx.date}:**
- Focus: ${focus}
- Repos: ${repos}
- Lines changed: ~${loc}${task ? `\n- Detected task: ${task}` : ""}`;
  });

  return lines.join("\n\n");
}

/**
 * Format continuation info for prompt inclusion
 *
 * @param {object|null} continuation - Continuation detection result
 * @returns {string} Formatted continuation note for prompt
 */
export function formatContinuationForPrompt(continuation) {
  if (!continuation) return "";

  return `## Ongoing Task Detected

This appears to be day ${continuation.dayCount} of work on "${continuation.task}"
(started ${continuation.startDate}).

When appropriate, acknowledge this multi-day effort naturally without being
cheerleader-y. Examples:
- "Day 3 of the auth refactor. Good progress on the session handling."
- "Still working through the migration - today focused on the API layer."
- "The security audit continues with rate limiting improvements."

Avoid: "Amazing progress!" or "You're crushing it!" or any excitement about streaks.`;
}
