/**
 * AI Prompt templates for daily summary generation
 *
 * Voice Guidelines:
 * - Professional/Technical: 7/10 (clear, competent, factual)
 * - Warmth/Personality: 3/10 (genuine but understated)
 * - NO cheerleader energy whatsoever
 * - Think: developer's changelog, not motivational poster
 * - Start with WHAT was done, never how impressive it was
 */

/**
 * Format continuation note for the AI prompt
 * @param {object} continuation - Continuation detection result
 * @returns {string} Formatted continuation instruction
 */
function formatContinuationNote(continuation) {
  if (!continuation) return "";

  return `ONGOING TASK DETECTED:
This appears to be day ${continuation.dayCount} of "${continuation.task}" (started ${continuation.startDate}).

When appropriate, acknowledge this multi-day effort naturally in the summary—without being cheerleader-y.
GOOD: "Day 3 of the auth refactor. Session handling is coming together."
GOOD: "Still working through the migration—today focused on the API layer."
BAD: "Amazing progress on the streak!" / "Keep it up!"`;
}

/**
 * Generate the prompt for summarizing daily commits
 * @param {Array} commits - Array of commit objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} ownerName - Name of the developer (e.g., "Autumn")
 * @param {object} context - Historical context for long-horizon awareness
 * @param {string} context.historicalContext - Formatted string of recent days' activity
 * @param {object|null} context.continuation - Multi-day task continuation info
 * @returns {string} The formatted prompt
 */
export function buildSummaryPrompt(
  commits,
  date,
  ownerName = "the developer",
  context = {},
) {
  const commitList = commits
    .map(
      (c, i) =>
        `${i + 1}. [${c.repo}] ${c.message} (+${c.additions}/-${c.deletions})`,
    )
    .join("\n");

  // Group commits by repo for context
  const repoGroups = {};
  commits.forEach((c) => {
    if (!repoGroups[c.repo]) repoGroups[c.repo] = [];
    repoGroups[c.repo].push(c.message);
  });
  const repoSummary = Object.entries(repoGroups)
    .map(([repo, msgs]) => `${repo}: ${msgs.length} commits`)
    .join(", ");

  // Determine gutter comment count based on activity (1-5)
  const gutterCount = Math.min(5, Math.max(1, Math.ceil(commits.length / 3)));

  return `You are writing a daily development summary for ${ownerName}'s personal coding journal on ${date}.

STRICT RULES - VIOLATIONS WILL BE REJECTED:

1. NEVER start with exclamations about productivity or impressiveness
   BANNED OPENERS: "Wow", "What a day", "Busy day", "Productive day", "Another great day", "Impressive", "${ownerName} crushed it", "${ownerName} was on fire", "Big day"

2. NEVER use cheerleader phrases anywhere in the summary
   BANNED: "crushed it", "killed it", "on a roll", "on fire", "smashed it", "nailed it", "knocked it out", "fantastic", "amazing", "awesome", "incredible", "impressive", "whopping", "tons of", "a ton of", "what a", "clear they were", "serious progress"

3. NO emojis. Zero. None.

4. MINIMAL exclamation marks (max 1 total, and only if genuinely warranted)

5. START the brief summary with the WORK ITSELF:
   GOOD: "Refactored the auth system..." / "The timeline got some attention..." / "Worked across several projects..."
   BAD: "Wow, what a productive day!" / "Autumn tackled a ton of updates!" / "${ownerName} was on a coding roll!"

VOICE: Write like a developer's changelog or a quiet journal entry. Matter-of-fact about the work. Not impressed by yourself—just noting what happened.
${
  context.historicalContext
    ? `
RECENT CONTEXT (for awareness, not recapping):
${context.historicalContext}
`
    : ""
}${
    context.continuation
      ? `
${formatContinuationNote(context.continuation)}
`
      : ""
  }
COMMITS TODAY (${commits.length} total across: ${repoSummary}):
${commitList}

GENERATE THREE OUTPUTS:

1. BRIEF SUMMARY (2-3 sentences):
   - First sentence: what was the main focus (name the actual work)
   - Second sentence: what else happened or how it connects
   - Optional third: a grounded observation (not praise)

   GOOD EXAMPLES:
   - "The authentication flow got most of the attention today, particularly around session edge cases. Also cleaned up some timeline styling."
   - "Split focus between GroveEngine refactoring and some maintenance work on the dashboard. The refactor is coming together."
   - "Mostly small fixes across several projects. Sometimes that's how it goes."

   BAD EXAMPLES (DO NOT WRITE LIKE THIS):
   - "Wow, what a productive day! ${ownerName} tackled a ton of updates across multiple projects!"
   - "${ownerName} crushed it today with 40+ commits!"
   - "It's clear they were on a mission to get things done!"

2. DETAILED BREAKDOWN (markdown):
   - Header: "## Projects"
   - Each project: "### ProjectName" (exactly as shown in commits)
   - Bullet points for key changes (factual, not effusive)
   - Group related commits logically

3. GUTTER COMMENTS (${gutterCount} margin notes):
   Short observations for the sidebar (10 words max, ideally under 8).
   - GOOD: "This one was tricky." / "Incremental progress." / "Long overdue cleanup." / "The auth saga continues."
   - BAD: "Great work!" / "Someone was on a roll!" / "Crushing it!" / "Keep it up!"

OUTPUT FORMAT (valid JSON only):
{
  "brief": "Your 2-3 sentence summary here",
  "detailed": "## Projects\\n\\n### ProjectName\\n- Change one\\n- Change two",
  "gutter": [
    {"anchor": "### ProjectName", "type": "comment", "content": "Short observation"}
  ]
}

REQUIREMENTS:
- JSON only, no markdown code blocks
- Escape newlines as \\n
- Gutter anchors must EXACTLY match "### ProjectName" headers
- Exactly ${gutterCount} gutter comments`;
}

/**
 * System prompt for the AI - sets overall personality
 */
export const SYSTEM_PROMPT = `You write daily development summaries for a personal coding journal.

Your voice is:
- Matter-of-fact and technically clear
- Like a developer writing notes for their future self
- Describing what happened, not how impressive it was

CRITICAL RESTRICTIONS:
- Never use cheerleader language (crushed it, on a roll, amazing, etc.)
- Never start summaries with exclamations about productivity
- Never use emojis
- Start with the actual work, not commentary about the work

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
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate gutter items have required fields
    const validGutter = (parsed.gutter || [])
      .filter(
        (item) =>
          item.anchor && item.content && typeof item.content === "string",
      )
      .map((item) => ({
        anchor: item.anchor,
        type: item.type || "comment",
        content: item.content.trim(),
      }));

    return {
      success: true,
      brief: parsed.brief || "Worked on a few things today.",
      detailed: parsed.detailed || "## Projects\n\nSome progress was made.",
      gutter: validGutter,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    console.error("Raw response:", response);

    // Fallback - keep it simple and authentic
    return {
      success: false,
      brief:
        "Some work happened today. The summary got a bit tangled, but the commits tell the story.",
      detailed: "## Projects\n\nWork continued across various projects.",
      gutter: [],
    };
  }
}
