/**
 * AI Prompt templates for daily summary generation
 * Using Cloudflare Workers AI with @cf/meta/llama-3.1-70b-instruct
 */

/**
 * Generate the prompt for summarizing daily commits
 * @param {Array} commits - Array of commit objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} The formatted prompt
 */
export function buildSummaryPrompt(commits, date) {
  const commitList = commits.map((c, i) =>
    `${i + 1}. [${c.repo}] ${c.message} (+${c.additions}/-${c.deletions})`
  ).join('\n');

  return `You are summarizing a developer's GitHub activity for ${date}.

COMMITS TODAY (${commits.length} total):
${commitList}

TASK:
1. Write a brief 1-2 sentence summary of what was accomplished today
2. Write a detailed markdown breakdown grouped by project

OUTPUT FORMAT (respond with valid JSON only):
{
  "brief": "Short summary here (1-2 sentences, no markdown)",
  "detailed": "## Projects\\n\\n### ProjectName\\n- What was done\\n- Another thing\\n\\n### OtherProject\\n- Changes made"
}

Respond with JSON only. No markdown code blocks.`;
}

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

    return {
      success: true,
      brief: parsed.brief || 'Development work completed.',
      detailed: parsed.detailed || '## Summary\n\nWork was done today.'
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);

    // Fallback: try to extract any useful text
    return {
      success: false,
      brief: 'Development work completed today.',
      detailed: '## Summary\n\nMultiple commits were made across various projects.'
    };
  }
}
