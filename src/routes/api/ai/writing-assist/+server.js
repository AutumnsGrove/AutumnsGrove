import { json, error } from "@sveltejs/kit";
import {
  AI_MODELS,
  MAX_CONTENT_LENGTH,
  RATE_LIMIT,
  getModelId,
  calculateCost
} from "$lib/config/ai-models.js";

export const prerender = false;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * AI Writing Assistant - Grammar, Tone, and Readability Analysis
 * POST /api/ai/writing-assist
 *
 * This is a TOOL, not a writer. It analyzes existing content and provides feedback.
 * It will NEVER generate new content or expand text.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform, locals }) {
  // Authentication check
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = platform?.env?.GIT_STATS_DB;
  const anthropicKey = platform?.env?.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return json({ error: "AI service not configured" }, { status: 503 });
  }

  // Check if AI assistant is enabled in settings
  if (db) {
    const settings = await db
      .prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?")
      .bind("ai_assistant_enabled")
      .first();

    if (!settings || settings.setting_value !== "true") {
      return json({ error: "AI Writing Assistant is disabled. Enable it in Settings." }, { status: 403 });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { content, action, model = "haiku", context } = body;

  // Validate content
  if (!content || typeof content !== "string") {
    return json({ error: "No content provided" }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return json({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 });
  }

  // Validate action
  const validActions = ["grammar", "tone", "readability", "all"];
  if (!validActions.includes(action)) {
    return json({ error: "Invalid action. Use: grammar, tone, readability, or all" }, { status: 400 });
  }

  // Rate limiting with slight random delay to prevent user enumeration
  if (db) {
    const windowStart = new Date(Date.now() - RATE_LIMIT.windowMs).toISOString();
    const recentRequests = await db
      .prepare("SELECT COUNT(*) as count FROM ai_writing_requests WHERE user_id = ? AND created_at > ?")
      .bind(locals.user.email, windowStart)
      .first();

    if (recentRequests && recentRequests.count >= RATE_LIMIT.maxRequests) {
      // Add slight random delay to prevent timing attacks
      await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
      return json({ error: "Rate limit exceeded. Try again in an hour." }, { status: 429 });
    }
  }

  // Select model from config
  const modelId = getModelId(model);

  const result = {};
  let totalTokens = { input: 0, output: 0 };

  try {
    // Grammar analysis (via AI)
    if (action === "grammar" || action === "all") {
      const grammarResult = await analyzeGrammar(content, modelId, anthropicKey);
      result.grammar = grammarResult.result;
      totalTokens.input += grammarResult.usage.input;
      totalTokens.output += grammarResult.usage.output;
    }

    // Tone analysis (via AI)
    if (action === "tone" || action === "all") {
      const toneResult = await analyzeTone(content, modelId, anthropicKey, context);
      result.tone = toneResult.result;
      totalTokens.input += toneResult.usage.input;
      totalTokens.output += toneResult.usage.output;
    }

    // Readability (local calculation - no AI needed)
    if (action === "readability" || action === "all") {
      result.readability = calculateReadability(content);
    }

    // Calculate cost using model key (haiku/sonnet), not modelId
    const cost = calculateCost(model, totalTokens.input, totalTokens.output);

    // Log usage to database
    if (db) {
      await db.prepare(`
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
    }

    return json({
      ...result,
      tokensUsed: totalTokens.input + totalTokens.output,
      cost,
      model: modelId
    });

  } catch (err) {
    console.error("AI writing assist error:", err);
    return json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

/**
 * Analyze text for grammar and spelling issues
 */
async function analyzeGrammar(content, model, apiKey) {
  const prompt = `You are a helpful proofreader. Analyze this text for grammar, spelling, punctuation, and style issues.

IMPORTANT RULES:
- ONLY identify actual errors and unclear writing
- Do NOT suggest rewording that changes meaning
- Do NOT suggest expanding or adding content
- Be helpful but not pedantic
- Focus on errors that would confuse readers

Return a JSON object with:
{
  "suggestions": [
    {
      "original": "the exact text with the issue",
      "suggestion": "the corrected text",
      "reason": "brief explanation (1 sentence max)",
      "severity": "error" | "warning" | "style"
    }
  ],
  "overallScore": 0-100
}

Use these severity levels:
- "error": Grammar/spelling mistakes
- "warning": Unclear or potentially confusing phrasing
- "style": Minor style improvements (use sparingly)

Text to analyze:
---
${content}
---

Return ONLY valid JSON. No explanation or markdown.`;

  const response = await callAnthropic(prompt, model, apiKey, 2048);

  try {
    const result = JSON.parse(response.text);
    return {
      result: {
        suggestions: result.suggestions || [],
        overallScore: result.overallScore || 85
      },
      usage: response.usage
    };
  } catch {
    return {
      result: { suggestions: [], overallScore: 85, parseError: true },
      usage: response.usage
    };
  }
}

/**
 * Analyze text tone and style
 */
async function analyzeTone(content, model, apiKey, context) {
  const audienceNote = context?.audience
    ? `The intended audience is: ${context.audience}`
    : "No specific audience indicated.";

  const titleNote = context?.title
    ? `The piece is titled: "${context.title}"`
    : "";

  const prompt = `You are analyzing the tone of a piece of writing. ${titleNote} ${audienceNote}

Analyze the overall tone and voice. Do NOT suggest rewrites or content changes.

Return a JSON object with:
{
  "analysis": "2-3 sentence summary of the overall tone and voice",
  "traits": [
    { "trait": "trait name", "score": 0-100 }
  ],
  "suggestions": ["brief observation about tone consistency (max 3)"]
}

Common traits to evaluate (pick 4-6 most relevant):
- formal, casual, friendly, professional
- technical, accessible, poetic, direct
- warm, neutral, passionate, contemplative

Text to analyze:
---
${content}
---

Return ONLY valid JSON. No explanation or markdown.`;

  const response = await callAnthropic(prompt, model, apiKey, 1024);

  try {
    const result = JSON.parse(response.text);
    return {
      result: {
        analysis: result.analysis || "Unable to analyze tone.",
        traits: result.traits || [],
        suggestions: result.suggestions || []
      },
      usage: response.usage
    };
  } catch {
    return {
      result: {
        analysis: "Tone analysis unavailable.",
        traits: [],
        suggestions: [],
        parseError: true
      },
      usage: response.usage
    };
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt, model, apiKey, maxTokens) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Anthropic API error:", errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    text: data.content[0]?.text || "",
    usage: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0
    }
  };
}

/**
 * Calculate readability metrics (local, no AI)
 */
function calculateReadability(content) {
  // Strip markdown syntax for clean text analysis
  const text = content
    .replace(/```[\s\S]*?```/g, "")         // Remove code blocks
    .replace(/`[^`]+`/g, "")                 // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links with text
    .replace(/[#*_~>]/g, "")                 // Remove markdown chars
    .replace(/^\s*[-+*]\s+/gm, "")           // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, "")           // Remove numbered list markers
    .trim();

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllables / wordCount;

  // Flesch-Kincaid Grade Level
  const fleschKincaid = Math.max(0, 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59);

  // Reading time (~200 words per minute for focused reading)
  const minutes = Math.ceil(wordCount / 200);

  // Sentence length stats
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);

  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    readingTime: `${minutes} min read`,
    wordCount,
    sentenceCount,
    sentenceStats: {
      average: Math.round(wordsPerSentence),
      longest: Math.max(...sentenceLengths, 0),
      shortest: sentenceLengths.length > 0 ? Math.min(...sentenceLengths) : 0
    },
    suggestions: generateReadabilitySuggestions(fleschKincaid, wordsPerSentence, sentenceLengths)
  };
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(matches.length, 1) : 1;
}

/**
 * Generate readability improvement suggestions
 */
function generateReadabilitySuggestions(grade, avgSentence, sentenceLengths) {
  const suggestions = [];

  if (grade > 14) {
    suggestions.push("Your writing is quite complex. Consider simplifying for broader accessibility.");
  } else if (grade > 12) {
    suggestions.push("College-level reading. Consider if this matches your audience.");
  }

  if (avgSentence > 30) {
    suggestions.push("Many sentences are quite long. Breaking them up could improve clarity.");
  } else if (avgSentence > 25) {
    suggestions.push("Some sentences are on the longer side. Variety in length can improve flow.");
  }

  const veryLong = sentenceLengths.filter(l => l > 40);
  if (veryLong.length > 0) {
    suggestions.push(`Found ${veryLong.length} sentence${veryLong.length > 1 ? "s" : ""} over 40 words.`);
  }

  if (grade < 6 && avgSentence < 10) {
    suggestions.push("Very simple sentences. This works well for accessibility or quick reads.");
  }

  // Variety suggestion
  if (sentenceLengths.length > 5) {
    const variance = calculateVariance(sentenceLengths);
    if (variance < 10) {
      suggestions.push("Sentence lengths are very uniform. Varying rhythm can make writing more engaging.");
    }
  }

  return suggestions.slice(0, 4); // Max 4 suggestions
}

/**
 * Calculate variance for sentence length variety
 */
function calculateVariance(numbers) {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
}

// Note: calculateCost is imported from $lib/config/ai-models.js
