/**
 * AI Prompt templates for daily summary generation
 * Using Cloudflare Workers AI with @cf/meta/llama-3.1-70b-instruct
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

  return `You are a friendly, whimsical AI assistant reporting on ${ownerName}'s coding adventures for ${date}.

YOUR PERSONALITY:
- You're like a supportive friend who genuinely finds coding exciting
- Use warm, playful language (but not over-the-top)
- Occasionally use gentle humor or wordplay
- Feel free to use one emoji per section if it fits naturally
- Sound impressed by productive days, understanding on slower days

COMMITS TODAY (${commits.length} total across: ${repoSummary}):
${commitList}

TASK - Generate THREE things:

1. BRIEF SUMMARY (2-3 sentences MAX):
   - Start with a personality-filled opening line about the day
   - Mention the key accomplishments naturally
   - Keep it warm and conversational

2. DETAILED BREAKDOWN (markdown):
   - Use "## Projects" as main header
   - Each project gets "### ProjectName"
   - List key changes as bullet points
   - Keep it factual but friendly

3. GUTTER COMMENTS (fun side notes):
   - These appear as floating comments alongside the content
   - Add 2-4 fun observations/reactions
   - Each needs an "anchor" (which header/project it appears next to)
   - Keep them SHORT (1-2 sentences max)
   - Examples: "Someone was on a roll!", "Bug squashing champion!", "The commits just kept coming!"

OUTPUT FORMAT (respond with valid JSON only):
{
  "brief": "Your 2-3 sentence personality-filled summary here",
  "detailed": "## Projects\\n\\n### ProjectName\\n- Change one\\n- Change two\\n\\n### OtherProject\\n- Another change",
  "gutter": [
    {"anchor": "### ProjectName", "type": "comment", "content": "Fun observation here!"},
    {"anchor": "### OtherProject", "type": "comment", "content": "Another witty note"}
  ]
}

IMPORTANT:
- Respond with JSON only, no markdown code blocks
- Escape newlines as \\n in JSON strings
- Keep brief summary UNDER 3 sentences
- Gutter anchors must match exact header text from detailed section`;
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
      brief: parsed.brief || 'Another day of coding adventures!',
      detailed: parsed.detailed || '## Projects\n\nWork was done today.',
      gutter: parsed.gutter || []
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);

    // Fallback with personality
    return {
      success: false,
      brief: 'Looks like the coding gremlins were busy today! Multiple commits landed across various projects.',
      detailed: '## Projects\n\nMultiple commits were made across various projects.',
      gutter: []
    };
  }
}
