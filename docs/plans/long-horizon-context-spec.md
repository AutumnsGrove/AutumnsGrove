# Long-Horizon Context System - Technical Specification

> **Status:** Ready for Implementation
> **Estimated Effort:** 4-6 hours across multiple sessions
> **Dependencies:** Daily summary worker (completed), D1 database, Claude API

---

## Overview

Enable the daily summary AI to recognize and comment on multi-day tasks by providing historical context from previous summaries. This creates a more intelligent timeline that understands project continuity.

---

## Problem Statement

Currently, each day's summary is generated in isolation. When working on a multi-day refactoring or feature, the AI has no awareness that "this is day 7 of a security audit" or "second week of the migration."

### Current Flow
```
Day N Commits → AI → Summary (no context)
```

### Proposed Flow
```
Day N-3 Brief + Day N-2 Brief + Day N-1 Brief + Day N Commits → AI → Summary (with context)
```

---

## Architecture

### Database Schema Additions

Add to `workers/daily-summary/` schema or `src/lib/db/schema.sql`:

```sql
-- Add columns to existing daily_summaries table
ALTER TABLE daily_summaries ADD COLUMN context_brief TEXT;
ALTER TABLE daily_summaries ADD COLUMN detected_focus TEXT;
ALTER TABLE daily_summaries ADD COLUMN continuation_of TEXT;
ALTER TABLE daily_summaries ADD COLUMN focus_streak INTEGER DEFAULT 0;

-- Index for efficient context lookups
CREATE INDEX IF NOT EXISTS idx_summaries_date_context
ON daily_summaries(date DESC, context_brief);
```

### Context Brief Structure

```typescript
interface ContextBrief {
  date: string;           // YYYY-MM-DD
  mainFocus: string;      // 1-2 sentences
  repos: string[];        // Top repos touched
  linesChanged: number;   // Approximate LOC
  commitCount: number;
  detectedTask?: string;  // "security audit", "migration", etc.
}
```

### Detected Focus Structure

```typescript
interface DetectedFocus {
  task: string;           // Human-readable task name
  startDate: string;      // When this focus was first detected
  repos: string[];        // Repos involved
  keywords: string[];     // Keywords that triggered detection
  dayCount: number;       // Days on this task
}
```

---

## Implementation Plan

### Phase 1: Context Brief Generation (1-2 hours)

#### File: `workers/daily-summary/context.js`

```javascript
/**
 * Generate a condensed context brief from a summary
 * Used for passing historical context to future summaries
 */
export function generateContextBrief(summary, commits) {
  // Extract key information
  const repos = [...new Set(commits.map(c => c.repo))];
  const linesChanged = commits.reduce((sum, c) =>
    sum + (c.additions || 0) + (c.deletions || 0), 0
  );

  // Detect main focus from summary content
  const mainFocus = extractMainFocus(summary);

  return {
    date: summary.date,
    mainFocus,
    repos: repos.slice(0, 3), // Top 3 repos
    linesChanged,
    commitCount: commits.length,
    detectedTask: detectTask(summary, commits)
  };
}

/**
 * Extract main focus from summary markdown
 * Looks for first substantive sentence or header
 */
function extractMainFocus(summary) {
  const lines = summary.content.split('\n').filter(l => l.trim());

  // Skip header, get first paragraph
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.startsWith('-')) continue;
    if (line.length > 20 && line.length < 200) {
      return line.replace(/\*\*/g, '').trim();
    }
  }

  return 'Various development tasks';
}

/**
 * Detect if commits indicate a specific ongoing task
 */
function detectTask(summary, commits) {
  const taskPatterns = [
    { pattern: /security|audit|vulnerability|xss|csrf/i, task: 'security work' },
    { pattern: /migration|migrate|upgrade/i, task: 'migration' },
    { pattern: /refactor|cleanup|reorganize/i, task: 'refactoring' },
    { pattern: /test|coverage|spec/i, task: 'testing improvements' },
    { pattern: /docs|documentation|readme/i, task: 'documentation' },
    { pattern: /ui|design|style|css/i, task: 'UI/UX work' },
    { pattern: /api|endpoint|route/i, task: 'API development' },
    { pattern: /auth|login|session/i, task: 'authentication' },
    { pattern: /perf|performance|optimize/i, task: 'performance optimization' },
  ];

  // Check commit messages
  const allMessages = commits.map(c => c.message).join(' ');

  for (const { pattern, task } of taskPatterns) {
    if (pattern.test(allMessages) || pattern.test(summary.content)) {
      return task;
    }
  }

  return null;
}
```

### Phase 2: Context Retrieval (1 hour)

#### Add to `workers/daily-summary/index.js`

```javascript
/**
 * Retrieve historical context for summary generation
 * Returns last 3 days of context briefs
 */
async function getHistoricalContext(env, targetDate) {
  const dateObj = new Date(targetDate);

  // Get past 3 days
  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const placeholders = dates.map(() => '?').join(',');
  const query = `
    SELECT date, context_brief, detected_focus
    FROM daily_summaries
    WHERE date IN (${placeholders})
    ORDER BY date DESC
  `;

  const { results } = await env.DB.prepare(query)
    .bind(...dates)
    .all();

  return results.map(row => ({
    date: row.date,
    brief: row.context_brief ? JSON.parse(row.context_brief) : null,
    focus: row.detected_focus ? JSON.parse(row.detected_focus) : null
  })).filter(r => r.brief);
}

/**
 * Detect multi-day task continuation
 */
function detectContinuation(historicalContext, currentFocus) {
  if (!currentFocus || historicalContext.length === 0) {
    return null;
  }

  // Check if same focus across multiple days
  let streak = 0;
  let startDate = null;

  for (const ctx of historicalContext) {
    if (ctx.focus?.task === currentFocus) {
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
      dayCount: streak + 1 // +1 for current day
    };
  }

  return null;
}
```

### Phase 3: Enhanced Prompt (1-2 hours)

#### Update `workers/daily-summary/prompts.js`

```javascript
/**
 * Build prompt with historical context
 */
export function buildContextAwarePrompt(commits, historicalContext, continuation) {
  let contextSection = '';

  if (historicalContext.length > 0) {
    contextSection = `
## Recent Activity Context

Here's what was happening in the past few days:

${historicalContext.map(ctx => `
**${ctx.date}:**
- Focus: ${ctx.brief.mainFocus}
- Repos: ${ctx.brief.repos.join(', ')}
- Lines changed: ~${ctx.brief.linesChanged}
${ctx.focus ? `- Detected task: ${ctx.focus.task}` : ''}
`).join('\n')}
`;
  }

  let continuationNote = '';
  if (continuation) {
    continuationNote = `
## Ongoing Task Detected

This appears to be day ${continuation.dayCount} of work on "${continuation.task}"
(started ${continuation.startDate}).

When appropriate, acknowledge this multi-day effort naturally without being
cheerleader-y. Examples:
- "Day 3 of the auth refactor. Good progress on the session handling."
- "Still working through the migration - today focused on the API layer."
- "The security audit continues with rate limiting improvements."

Avoid: "Amazing progress!" or "You're crushing it!"
`;
  }

  return `
${SYSTEM_PROMPT}

${contextSection}

${continuationNote}

## Today's Commits (${commits.length} total)

${formatCommitsForPrompt(commits)}

Generate a summary for today. Remember:
- 6/10 professional, 4/10 fun (not cheerleader)
- If this is part of a multi-day task, acknowledge it naturally
- Focus on what was actually accomplished, not process
`;
}
```

### Phase 4: Save Context with Summary (30 minutes)

#### Update summary save logic

```javascript
async function saveSummary(env, date, summary, commits) {
  // Generate context brief for future use
  const contextBrief = generateContextBrief(summary, commits);
  const detectedFocus = contextBrief.detectedTask ? {
    task: contextBrief.detectedTask,
    startDate: date,
    repos: contextBrief.repos
  } : null;

  // Get continuation info
  const historicalContext = await getHistoricalContext(env, date);
  const continuation = detectContinuation(
    historicalContext,
    contextBrief.detectedTask
  );

  // Calculate streak
  const focusStreak = continuation ? continuation.dayCount : 0;

  await env.DB.prepare(`
    INSERT INTO daily_summaries (
      date, content, model, tokens_used, cost,
      context_brief, detected_focus, continuation_of, focus_streak
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      content = excluded.content,
      context_brief = excluded.context_brief,
      detected_focus = excluded.detected_focus,
      continuation_of = excluded.continuation_of,
      focus_streak = excluded.focus_streak,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    date,
    summary.content,
    summary.model,
    summary.tokensUsed,
    summary.cost,
    JSON.stringify(contextBrief),
    detectedFocus ? JSON.stringify(detectedFocus) : null,
    continuation ? continuation.startDate : null,
    focusStreak
  ).run();
}
```

### Phase 5: Anthropic Prompt Caching (Optional, 1 hour)

Use Anthropic's prompt caching for cost reduction:

```javascript
/**
 * Use prompt caching for repeated context
 * Saves 50-70% on input tokens for historical context
 */
async function generateWithCaching(anthropic, historicalContext, commits) {
  // Static system prompt - highly cacheable
  const systemPrompt = {
    type: 'text',
    text: SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' }
  };

  // Historical context - cacheable if unchanged
  const contextBlock = historicalContext.length > 0 ? {
    type: 'text',
    text: formatHistoricalContext(historicalContext),
    cache_control: { type: 'ephemeral' }
  } : null;

  // Current commits - always fresh
  const commitsBlock = {
    type: 'text',
    text: formatCommitsForPrompt(commits)
  };

  const messages = [{
    role: 'user',
    content: [
      contextBlock,
      commitsBlock
    ].filter(Boolean)
  }];

  return await anthropic.messages.create({
    model: 'claude-haiku-4-5-20250929',
    max_tokens: 2048,
    system: [systemPrompt],
    messages
  });
}
```

---

## API Changes

### New Endpoint: GET /api/timeline/context/[date]

Returns context information for debugging:

```javascript
// Response
{
  date: "2025-12-01",
  contextBrief: { ... },
  detectedFocus: { task: "security work", ... },
  continuation: { task: "security work", dayCount: 3, startDate: "2025-11-29" },
  focusStreak: 3
}
```

---

## Timeline UI Enhancements

### Show Multi-Day Task Indicators

```svelte
{#if summary.focus_streak > 1}
  <div class="multi-day-indicator">
    Day {summary.focus_streak} of {summary.detected_focus?.task}
  </div>
{/if}
```

### CSS

```css
.multi-day-indicator {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--grove-green-subtle);
  color: var(--grove-green);
  border-radius: 12px;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
```

---

## Testing Strategy

### Unit Tests
1. Context brief generation from various summary types
2. Task detection patterns
3. Continuation detection logic
4. Streak calculation

### Integration Tests
1. Full flow: commits → context retrieval → prompt building → save
2. Prompt caching behavior
3. Edge cases: first day (no context), gaps in dates

### Manual Testing
1. Generate summaries for 5+ consecutive days
2. Verify multi-day task detection
3. Check tone of continuation comments
4. Validate cost savings from caching

---

## Rollout Plan

1. **Day 1:** Deploy schema changes, start collecting context_brief
2. **Day 2-3:** Collect historical data
3. **Day 4:** Enable context-aware prompts
4. **Day 7:** Enable prompt caching after baseline established

---

## Cost Analysis

### Without Caching
- ~800 input tokens for commits
- ~300 input tokens for historical context
- ~500 output tokens
- Cost: ~$0.0016 per summary

### With Prompt Caching
- System prompt cached (90% read from cache)
- Historical context cached when unchanged
- Estimated savings: 50-70% on input tokens
- Cost: ~$0.0008 per summary

### Monthly Projection (30 summaries)
- Without caching: ~$0.048/month
- With caching: ~$0.024/month

---

## Future Enhancements (Out of Scope)

- Weekly/monthly rollup summaries
- Project-level context (beyond daily)
- Team collaboration awareness
- Integration with GitHub milestones/projects
- Automatic task naming suggestions

---

## Files to Modify

1. `workers/daily-summary/index.js` - Main worker logic
2. `workers/daily-summary/prompts.js` - Prompt construction
3. `src/lib/db/schema.sql` - Add new columns
4. `src/routes/timeline/+page.svelte` - UI enhancements
5. Create: `workers/daily-summary/context.js` - Context utilities

---

*Last updated: December 2025*
