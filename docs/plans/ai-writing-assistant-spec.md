# AI Writing Assistant - Technical Specification

> **Status:** Ready for Implementation
> **Estimated Effort:** 8-12 hours across multiple sessions
> **Dependencies:** MarkdownEditor (completed), Anthropic API, D1 database

---

## Overview

Add ethical AI writing tools to help polish posts WITHOUT generating content. The AI acts as a proofreader and coach, never as a ghostwriter.

---

## Core Principles

### AI is a TOOL, never a writer

| Allowed | Forbidden |
|---------|-----------|
| Grammar/spelling fixes | "Write a post about X" |
| Tone analysis | "Expand this to 1000 words" |
| Readability scoring | Auto-completion |
| Word choice suggestions | Any full sentence generation |
| Structure feedback | Content brainstorming |

### User Control

- **All features OFF by default** (opt-in only)
- Clear indication when AI is analyzing content
- Transparent about what data is sent to Anthropic
- Easy to disable at any time

---

## Architecture

### API Endpoint

```
POST /api/ai/writing-assist
```

```typescript
interface WritingAssistRequest {
  content: string;           // Markdown content to analyze
  action: 'grammar' | 'tone' | 'readability' | 'all';
  model?: 'haiku' | 'sonnet'; // Default: haiku
  context?: {
    title?: string;
    audience?: string;       // "technical", "casual", "professional"
  };
}

interface WritingAssistResponse {
  grammar?: GrammarResult;
  tone?: ToneResult;
  readability?: ReadabilityResult;
  tokensUsed: number;
  cost: number;
  model: string;
}
```

### Result Types

```typescript
interface GrammarResult {
  suggestions: Array<{
    original: string;        // Text to replace
    suggestion: string;      // Suggested replacement
    reason: string;          // Brief explanation
    severity: 'error' | 'warning' | 'style';
    position: {
      line: number;
      start: number;
      end: number;
    };
  }>;
  overallScore: number;      // 0-100
}

interface ToneResult {
  analysis: string;          // 2-3 sentence summary
  traits: Array<{
    trait: string;           // "formal", "friendly", "technical"
    score: number;           // 0-100
  }>;
  suggestions: string[];     // Areas to consider
}

interface ReadabilityResult {
  fleschKincaid: number;     // Grade level (e.g., 8.5)
  readingTime: string;       // "5 min read"
  sentenceStats: {
    average: number;         // Average words per sentence
    longest: number;
    shortest: number;
  };
  suggestions: string[];     // "Consider breaking up long sentences"
}
```

---

## Implementation Plan

### Phase 1: Settings & Infrastructure (2 hours)

#### Add to Settings Page

File: `src/routes/admin/settings/+page.svelte`

```svelte
<section class="settings-section">
  <h2>AI Writing Assistant</h2>

  <div class="setting-item">
    <label>
      <input
        type="checkbox"
        bind:checked={settings.ai_assistant_enabled}
        onchange={saveSettings}
      />
      Enable AI Writing Assistant
    </label>
    <p class="setting-description">
      Get grammar, tone, and readability feedback powered by Claude AI.
      Your content is sent to Anthropic for analysis.
    </p>
  </div>

  {#if settings.ai_assistant_enabled}
    <div class="setting-item">
      <label for="ai-model">Preferred Model</label>
      <select id="ai-model" bind:value={settings.ai_model} onchange={saveSettings}>
        <option value="haiku">Claude Haiku (faster, cheaper)</option>
        <option value="sonnet">Claude Sonnet (higher quality)</option>
      </select>
    </div>

    <div class="ai-usage-stats">
      <h4>Usage This Month</h4>
      <p>Requests: {aiUsage.requests}</p>
      <p>Tokens: {aiUsage.tokens.toLocaleString()}</p>
      <p>Cost: ${aiUsage.cost.toFixed(4)}</p>
    </div>
  {/if}
</section>
```

#### Database Schema

Add to `src/lib/db/schema.sql`:

```sql
-- Track AI writing assistant usage
CREATE TABLE IF NOT EXISTS ai_writing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT NOT NULL,           -- 'grammar', 'tone', 'readability', 'all'
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost REAL,
  post_slug TEXT,                 -- Optional: which post was analyzed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_writing_created ON ai_writing_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_writing_user ON ai_writing_requests(user_id);
```

### Phase 2: API Endpoint (2 hours)

#### File: `src/routes/api/ai/writing-assist/+server.js`

```javascript
import Anthropic from '@anthropic-ai/sdk';

export async function POST({ request, platform, locals }) {
  // Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if AI assistant is enabled in settings
  const settings = await platform.env.POSTS_DB
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind('ai_assistant_enabled')
    .first();

  if (!settings || settings.value !== 'true') {
    return new Response(JSON.stringify({ error: 'AI assistant is disabled' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { content, action, model = 'haiku', context } = await request.json();

  // Validate content length
  const MAX_CONTENT_LENGTH = 50000; // ~10k words
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return new Response(JSON.stringify({
      error: content ? 'Content too long' : 'No content provided'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Rate limiting: max 20 requests per hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentRequests = await platform.env.POSTS_DB
    .prepare('SELECT COUNT(*) as count FROM ai_writing_requests WHERE user_id = ? AND created_at > ?')
    .bind(locals.user.email, hourAgo)
    .first();

  if (recentRequests.count >= 20) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const anthropic = new Anthropic({
    apiKey: platform.env.ANTHROPIC_API_KEY
  });

  const modelId = model === 'sonnet'
    ? 'claude-sonnet-4-20250514'
    : 'claude-haiku-4-5-20250929';

  const result = {};
  let totalTokens = { input: 0, output: 0 };

  try {
    if (action === 'grammar' || action === 'all') {
      const grammarResult = await analyzeGrammar(anthropic, modelId, content);
      result.grammar = grammarResult.result;
      totalTokens.input += grammarResult.usage.input_tokens;
      totalTokens.output += grammarResult.usage.output_tokens;
    }

    if (action === 'tone' || action === 'all') {
      const toneResult = await analyzeTone(anthropic, modelId, content, context);
      result.tone = toneResult.result;
      totalTokens.input += toneResult.usage.input_tokens;
      totalTokens.output += toneResult.usage.output_tokens;
    }

    if (action === 'readability' || action === 'all') {
      // Readability is calculated locally, not via AI
      result.readability = calculateReadability(content);
    }

    // Calculate cost
    const cost = calculateCost(modelId, totalTokens.input, totalTokens.output);

    // Log usage
    await platform.env.POSTS_DB.prepare(`
      INSERT INTO ai_writing_requests (user_id, action, model, input_tokens, output_tokens, cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      locals.user.email,
      action,
      modelId,
      totalTokens.input,
      totalTokens.output,
      cost
    ).run();

    return new Response(JSON.stringify({
      ...result,
      tokensUsed: totalTokens.input + totalTokens.output,
      cost,
      model: modelId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI writing assist error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function analyzeGrammar(anthropic, model, content) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Analyze this text for grammar, spelling, and style issues. Return a JSON object with:
- suggestions: array of {original, suggestion, reason, severity: "error"|"warning"|"style"}
- overallScore: 0-100 quality score

Be helpful but not pedantic. Focus on actual errors and unclear writing.
Do NOT rewrite content or suggest expanding text. Only fix errors.

Text to analyze:
---
${content}
---

Return ONLY valid JSON, no explanation.`
    }]
  });

  const jsonText = response.content[0].text;
  return {
    result: JSON.parse(jsonText),
    usage: response.usage
  };
}

async function analyzeTone(anthropic, model, content, context) {
  const audienceNote = context?.audience
    ? `The intended audience is: ${context.audience}`
    : '';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze the tone of this text. ${audienceNote}

Return a JSON object with:
- analysis: 2-3 sentence summary of the overall tone
- traits: array of {trait, score: 0-100} for traits like "formal", "friendly", "technical", "conversational"
- suggestions: array of brief suggestions for tone consistency (max 3)

Do NOT suggest rewriting or expanding. Just analyze what's there.

Text:
---
${content}
---

Return ONLY valid JSON.`
    }]
  });

  return {
    result: JSON.parse(response.content[0].text),
    usage: response.usage
  };
}

function calculateReadability(content) {
  // Strip markdown
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~]/g, '')
    .trim();

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const wordsPerSentence = words.length / Math.max(sentences.length, 1);
  const syllablesPerWord = syllables / Math.max(words.length, 1);

  // Flesch-Kincaid Grade Level
  const fleschKincaid = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  // Reading time (~200 words per minute)
  const minutes = Math.ceil(words.length / 200);

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);

  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    readingTime: `${minutes} min read`,
    sentenceStats: {
      average: Math.round(wordsPerSentence),
      longest: Math.max(...sentenceLengths, 0),
      shortest: Math.min(...sentenceLengths, 0)
    },
    suggestions: generateReadabilitySuggestions(fleschKincaid, wordsPerSentence)
  };
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function generateReadabilitySuggestions(grade, avgSentence) {
  const suggestions = [];

  if (grade > 12) {
    suggestions.push('Consider simplifying some complex sentences for broader accessibility');
  }
  if (avgSentence > 25) {
    suggestions.push('Some sentences are quite long. Consider breaking them up');
  }
  if (grade < 6) {
    suggestions.push('Text is very simple. Consider if this matches your intended audience');
  }

  return suggestions;
}

function calculateCost(model, inputTokens, outputTokens) {
  const rates = {
    'claude-haiku-4-5-20250929': { input: 0.80 / 1000000, output: 4.00 / 1000000 },
    'claude-sonnet-4-20250514': { input: 3.00 / 1000000, output: 15.00 / 1000000 }
  };

  const rate = rates[model] || rates['claude-haiku-4-5-20250929'];
  return inputTokens * rate.input + outputTokens * rate.output;
}
```

### Phase 3: Editor Integration (2-3 hours)

#### Add to MarkdownEditor.svelte

```svelte
<script>
  // Add to existing state
  let aiEnabled = $state(false);
  let aiPanelOpen = $state(false);
  let aiLoading = $state(false);
  let aiResults = $state(null);

  // Load AI preference from settings
  onMount(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const settings = await res.json();
      aiEnabled = settings.ai_assistant_enabled === 'true';
    }
  });

  async function runAIAnalysis(action = 'all') {
    if (!aiEnabled) return;

    aiLoading = true;
    aiPanelOpen = true;

    try {
      const res = await fetch('/api/ai/writing-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          action,
          context: { title: frontmatter.title }
        })
      });

      if (res.ok) {
        aiResults = await res.json();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Analysis failed');
      }
    } catch (err) {
      toast.error('Failed to connect to AI service');
    } finally {
      aiLoading = false;
    }
  }

  function applyGrammarFix(suggestion) {
    // Find and replace in content
    content = content.replace(suggestion.original, suggestion.suggestion);
    // Remove from suggestions list
    aiResults.grammar.suggestions = aiResults.grammar.suggestions.filter(
      s => s !== suggestion
    );
  }
</script>

<!-- Add to toolbar -->
{#if aiEnabled}
  <button
    class="toolbar-btn ai-btn"
    onclick={() => aiPanelOpen = !aiPanelOpen}
    title="AI Writing Assistant"
    class:active={aiPanelOpen}
  >
    <svg><!-- AI icon --></svg>
    AI
  </button>
{/if}

<!-- AI Panel -->
{#if aiPanelOpen && aiEnabled}
  <div class="ai-panel" transition:slide>
    <div class="ai-panel-header">
      <h3>Writing Assistant</h3>
      <button onclick={() => aiPanelOpen = false}>Close</button>
    </div>

    <div class="ai-actions">
      <button onclick={() => runAIAnalysis('grammar')} disabled={aiLoading}>
        Check Grammar
      </button>
      <button onclick={() => runAIAnalysis('tone')} disabled={aiLoading}>
        Analyze Tone
      </button>
      <button onclick={() => runAIAnalysis('readability')} disabled={aiLoading}>
        Readability
      </button>
      <button onclick={() => runAIAnalysis('all')} disabled={aiLoading}>
        Full Analysis
      </button>
    </div>

    {#if aiLoading}
      <div class="ai-loading">
        <span class="spinner"></span>
        Analyzing...
      </div>
    {/if}

    {#if aiResults}
      <!-- Grammar Results -->
      {#if aiResults.grammar}
        <div class="ai-section">
          <h4>Grammar ({aiResults.grammar.overallScore}/100)</h4>
          {#each aiResults.grammar.suggestions as suggestion}
            <div class="suggestion {suggestion.severity}">
              <p class="original">"{suggestion.original}"</p>
              <p class="fix">Suggestion: "{suggestion.suggestion}"</p>
              <p class="reason">{suggestion.reason}</p>
              <button onclick={() => applyGrammarFix(suggestion)}>
                Apply Fix
              </button>
            </div>
          {:else}
            <p class="no-issues">No issues found!</p>
          {/each}
        </div>
      {/if}

      <!-- Tone Results -->
      {#if aiResults.tone}
        <div class="ai-section">
          <h4>Tone Analysis</h4>
          <p>{aiResults.tone.analysis}</p>
          <div class="traits">
            {#each aiResults.tone.traits as trait}
              <div class="trait">
                <span>{trait.trait}</span>
                <div class="trait-bar" style="width: {trait.score}%"></div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Readability Results -->
      {#if aiResults.readability}
        <div class="ai-section">
          <h4>Readability</h4>
          <p>Grade Level: {aiResults.readability.fleschKincaid}</p>
          <p>Reading Time: {aiResults.readability.readingTime}</p>
          <p>Avg Sentence: {aiResults.readability.sentenceStats.average} words</p>
          {#each aiResults.readability.suggestions as suggestion}
            <p class="suggestion-text">{suggestion}</p>
          {/each}
        </div>
      {/if}

      <!-- Usage Info -->
      <div class="ai-usage">
        <small>
          Tokens: {aiResults.tokensUsed} |
          Cost: ${aiResults.cost.toFixed(4)}
        </small>
      </div>
    {/if}
  </div>
{/if}
```

### Phase 4: Command Palette Integration (30 minutes)

Add AI commands to existing command palette:

```javascript
// Add to command palette options
const aiCommands = [
  {
    name: 'AI: Check Grammar',
    action: () => runAIAnalysis('grammar'),
    shortcut: null,
    visible: () => aiEnabled
  },
  {
    name: 'AI: Analyze Tone',
    action: () => runAIAnalysis('tone'),
    visible: () => aiEnabled
  },
  {
    name: 'AI: Check Readability',
    action: () => runAIAnalysis('readability'),
    visible: () => aiEnabled
  },
  {
    name: 'AI: Full Analysis',
    action: () => runAIAnalysis('all'),
    visible: () => aiEnabled
  },
  {
    name: 'AI: Toggle Panel',
    action: () => aiPanelOpen = !aiPanelOpen,
    visible: () => aiEnabled
  }
];
```

---

## CSS Styling

```css
.ai-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  background: var(--editor-sidebar-bg);
  border-left: 1px solid var(--border-color);
  padding: 1rem;
  overflow-y: auto;
  z-index: 50;
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.ai-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.ai-actions button {
  padding: 0.5rem;
  background: var(--grove-green-subtle);
  border: 1px solid var(--grove-green);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.ai-actions button:hover:not(:disabled) {
  background: var(--grove-green);
  color: white;
}

.ai-section {
  margin-bottom: 1.5rem;
}

.ai-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.suggestion {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.suggestion.error {
  border-left: 3px solid var(--color-danger);
}

.suggestion.warning {
  border-left: 3px solid #f0ad4e;
}

.suggestion.style {
  border-left: 3px solid var(--grove-green);
}

.suggestion .original {
  text-decoration: line-through;
  color: var(--text-muted);
  font-style: italic;
}

.suggestion .fix {
  color: var(--grove-green);
  font-weight: 500;
}

.suggestion .reason {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0.25rem 0;
}

.trait {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

.trait-bar {
  height: 4px;
  background: var(--grove-green);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.ai-usage {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
}

.no-issues {
  color: var(--grove-green);
  font-style: italic;
}
```

---

## Cost Estimates

| Usage Level | Monthly Requests | Monthly Cost |
|-------------|------------------|--------------|
| Light (10 posts, 3 checks each) | 30 | ~$0.02 |
| Medium (30 posts, 5 checks each) | 150 | ~$0.08 |
| Heavy (50 posts, 10 checks each) | 500 | ~$0.25 |

---

## Security Considerations

1. **Authentication Required** - All endpoints require valid session
2. **Rate Limiting** - 20 requests/hour per user
3. **Content Limits** - Max 50,000 characters per request
4. **Settings Check** - Feature must be explicitly enabled
5. **No Storage** - Content is not stored, only sent for analysis

---

## Testing Checklist

### Unit Tests
- [ ] Readability calculation accuracy
- [ ] Syllable counting
- [ ] Cost calculation
- [ ] JSON parsing from AI responses

### Integration Tests
- [ ] Full analysis flow
- [ ] Rate limiting enforcement
- [ ] Settings toggle
- [ ] Grammar fix application

### Manual Tests
- [ ] Various content lengths
- [ ] Markdown with code blocks
- [ ] Non-English text handling
- [ ] Error states

---

## Files to Create/Modify

1. **Create:** `src/routes/api/ai/writing-assist/+server.js`
2. **Modify:** `src/lib/components/admin/MarkdownEditor.svelte`
3. **Modify:** `src/routes/admin/settings/+page.svelte`
4. **Modify:** `src/lib/db/schema.sql`

---

## Future Enhancements (Out of Scope)

- Inline highlighting of issues
- Custom style rules
- Writing pattern analysis over time
- Multi-language support
- Integration with external style guides

---

*Last updated: December 2025*
