/**
 * AI Model Configuration
 *
 * This file contains all AI model IDs and pricing information.
 * Update this file when Anthropic releases new models or changes pricing.
 *
 * Last verified: December 3, 2025
 * Anthropic pricing page: https://www.anthropic.com/pricing
 *
 * TODO: Verify pricing quarterly (next check: March 2026)
 */

export const AI_MODELS = {
  // Fast model for quick analysis
  haiku: {
    id: "claude-haiku-4-5-20251022",
    name: "Claude Haiku 4.5",
    description: "Fast and cost-effective",
    // Pricing per million tokens (as of Dec 2025)
    pricing: {
      input: 1.00,   // $1.00 per million input tokens
      output: 5.00,  // $5.00 per million output tokens
    },
  },

  // More thorough model for deeper analysis
  sonnet: {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "More thorough analysis",
    // Pricing per million tokens (as of Dec 2025)
    pricing: {
      input: 3.00,   // $3.00 per million input tokens
      output: 15.00, // $15.00 per million output tokens
    },
  },
};

// Default model for the writing assistant
export const DEFAULT_MODEL = "haiku";

// Maximum content length for analysis (characters)
export const MAX_CONTENT_LENGTH = 50000;

// Rate limit settings
export const RATE_LIMIT = {
  maxRequests: 20,     // Maximum requests
  windowMs: 60 * 60 * 1000, // Per hour (in milliseconds)
};

/**
 * Get model ID by key
 * @param {string} key - Model key (haiku, sonnet)
 * @returns {string} Full model ID
 */
export function getModelId(key) {
  return AI_MODELS[key]?.id || AI_MODELS[DEFAULT_MODEL].id;
}

/**
 * Calculate cost for token usage
 * @param {string} modelKey - Model key (haiku, sonnet)
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Cost in USD
 */
export function calculateCost(modelKey, inputTokens, outputTokens) {
  const model = AI_MODELS[modelKey] || AI_MODELS[DEFAULT_MODEL];
  const { pricing } = model;

  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;
}
