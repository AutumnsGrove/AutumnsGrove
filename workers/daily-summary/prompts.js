/**
 * AI Prompt templates for daily summary generation
 *
 * Voice Guidelines:
 * - Professional/Technical: 6/10 (clear, competent, factual)
 * - Warmth/Personality: 4/10 (genuine but understated)
 * - NO cheerleader energy ("killing it", "crushing it", "amazing work!")
 * - Think: thoughtful developer journal, not motivational poster
 */

/**
 * Generate the prompt for summarizing daily commits
 * @param {Array} commits - Array of commit objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} ownerName - Name of the developer (e.g., "Autumn")
 * @returns {string} The formatted prompt
 */
export function buildSummaryPrompt(commits, date, ownerName = 'the developer') {
  const commitList = commits.map((c, i) =>
    `${i + 1}. [${c.repo}] ${c.message} (+${c.additions}/-${c.deletions})`
  ).join('\n');

  // Group commits by repo for context
  const repoGroups = {};
  commits.forEach(c => {
    if (!repoGroups[c.repo]) repoGroups[c.repo] = [];
    repoGroups[c.repo].push(c.message);
  });
  const repoSummary = Object.entries(repoGroups)
    .map(([repo, msgs]) => `${repo}: ${msgs.length} commits`)
    .join(', ');

  // Determine gutter comment count based on activity (1-5)
  const gutterCount = Math.min(5, Math.max(1, Math.ceil(commits.length / 3)));

  return `You are writing a daily development summary for ${ownerName}'s personal coding journal on ${date}.

VOICE & TONE:
- Write like a thoughtful developer reflecting on their own work
- Professional clarity (6/10) with genuine warmth (4/10)
- Factual and specific about what was done
- Quietly satisfied on productive days, understanding on light days
- NEVER use phrases like: "killing it", "crushing it", "amazing work", "fantastic", "awesome job"
- AVOID exclamation marks except sparingly when genuinely warranted
- Think: late-night reflection over tea, not motivational speech

COMMITS TODAY (${commits.length} total across: ${repoSummary}):
${commitList}

GENERATE THREE OUTPUTS:

1. BRIEF SUMMARY (2-3 sentences, no more):
   Write a grounded summary of what mattered today.
   - Start with what was actually worked on, not how you feel about it
   - Be specific about the nature of the work
   - End with a quiet observation if one feels natural
   Example tone: "Focused on the authentication flow today, sorting out edge cases around session expiry. Also touched up some timeline styling. Steady progress."

2. DETAILED BREAKDOWN (markdown):
   - Header: "## Projects"
   - Each project: "### ProjectName" (exactly as shown in commits)
   - Bullet points for key changes
   - Be factual and clear, not effusive
   - Group related commits logically

3. GUTTER COMMENTS (${gutterCount} margin notes):
   These are small observations that float alongside the content.
   - Generate exactly ${gutterCount} comments
   - Each must have an "anchor" matching a "### ProjectName" from the detailed section
   - Keep them SHORT (10 words max, ideally under 8)
   - Thoughtful, not cheerful
   - Good: "This took longer than expected." / "Cleanup work pays off." / "Subtle but important."
   - Bad: "Great work on this!" / "You're doing amazing!" / "Keep it up!"

OUTPUT FORMAT (respond with valid JSON only):
{
  "brief": "Your 2-3 sentence summary here",
  "detailed": "## Projects\\n\\n### ProjectName\\n- Change one\\n- Change two",
  "gutter": [
    {"anchor": "### ProjectName", "type": "comment", "content": "Short observation"}
  ]
}

IMPORTANT:
- Respond with JSON only, no markdown code blocks
- Escape newlines as \\n in JSON strings
- Gutter anchors must EXACTLY match headers from detailed section
- Match the number of gutter comments to ${gutterCount}`;
}

/**
 * System prompt for the AI - sets overall personality
 */
export const SYSTEM_PROMPT = `You write daily development summaries for a personal coding journal.

Your voice is:
- Clear and technically competent
- Genuinely warm but never performative
- Like a developer writing notes for their future self
- Queer-friendly, authentic, unpretentious

You never sound like a cheerleader or motivational speaker. You sound like someone who genuinely cares about their craft and finds quiet satisfaction in steady progress.

Always respond with valid JSON only.`;

/**
 * Parse the AI response into structured data
 * @param {string} response - Raw AI response text
 * @returns {object} Parsed summary object
 */
export function parseAIResponse(response) {
  try {
    // Try to extract JSON from the response
    // Sometimes models wrap JSON in markdown code blocks
    let jsonStr = response.trim();

    // Remove markdown code block if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate gutter items have required fields
    const validGutter = (parsed.gutter || []).filter(item =>
      item.anchor && item.content && typeof item.content === 'string'
    ).map(item => ({
      anchor: item.anchor,
      type: item.type || 'comment',
      content: item.content.trim()
    }));

    return {
      success: true,
      brief: parsed.brief || 'Worked on a few things today.',
      detailed: parsed.detailed || '## Projects\n\nSome progress was made.',
      gutter: validGutter
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);

    // Fallback - keep it simple and authentic
    return {
      success: false,
      brief: 'Some work happened today. The summary got a bit tangled, but the commits tell the story.',
      detailed: '## Projects\n\nWork continued across various projects.',
      gutter: []
    };
  }
}
