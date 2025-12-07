/**
 * AI Provider Abstraction Layer
 *
 * Supports multiple AI providers with unified interface:
 * - Anthropic (Claude models)
 * - Cloudflare Workers AI (Llama, Gemma, Mistral)
 * - Moonshot AI (Kimi K2) - stub for future implementation
 */

// =============================================================================
// Model Definitions & Pricing
// =============================================================================

export const AI_PROVIDERS = {
  anthropic: {
    name: "Anthropic",
    models: {
      "claude-haiku-4-5-20250514": {
        name: "Claude 4.5 Haiku",
        quality: "high",
        speed: "fastest",
        inputCostPer1M: 0.8,
        outputCostPer1M: 4.0,
        cacheWritePer1M: 1.0, // Cache write cost
        cacheReadPer1M: 0.08, // Cache read cost (90% discount)
      },
      "claude-sonnet-4-20250514": {
        name: "Claude 4 Sonnet",
        quality: "highest",
        speed: "medium",
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWritePer1M: 3.75,
        cacheReadPer1M: 0.3,
      },
      "claude-sonnet-4-5-20250514": {
        name: "Claude 4.5 Sonnet",
        quality: "highest",
        speed: "fast",
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWritePer1M: 3.75,
        cacheReadPer1M: 0.3,
      },
    },
    defaultModel: "claude-haiku-4-5-20250514",
  },

  cloudflare: {
    name: "Cloudflare Workers AI",
    models: {
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
        name: "Llama 3.3 70B (Fast)",
        quality: "highest",
        speed: "medium",
        inputCostPer1M: 0, // Free with Workers AI
        outputCostPer1M: 0,
      },
      "@cf/meta/llama-3.1-70b-instruct": {
        name: "Llama 3.1 70B",
        quality: "high",
        speed: "medium",
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      "@cf/google/gemma-3-12b-it": {
        name: "Gemma 3 12B",
        quality: "high",
        speed: "fast",
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      "@cf/mistralai/mistral-small-3.1-24b-instruct": {
        name: "Mistral Small 24B",
        quality: "high",
        speed: "fast",
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      "@cf/meta/llama-3.1-8b-instruct-fast": {
        name: "Llama 3.1 8B (Fast)",
        quality: "good",
        speed: "fastest",
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
    },
    defaultModel: "@cf/meta/llama-3.1-70b-instruct",
  },

  // Stub for future Moonshot AI integration
  moonshot: {
    name: "Moonshot AI",
    models: {
      "kimi-k2": {
        name: "Kimi K2",
        quality: "high",
        speed: "medium",
        inputCostPer1M: 0.6, // Placeholder - update when known
        outputCostPer1M: 2.4, // Placeholder - update when known
      },
    },
    defaultModel: "kimi-k2",
    // TODO: Implement when ready
    notImplemented: true,
  },
};

// Default provider and model (Cloudflare is free, no API key needed)
export const DEFAULT_PROVIDER = "cloudflare";
export const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// =============================================================================
// Cost Calculation
// =============================================================================

/**
 * Calculate estimated cost for a request
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @param {number} inputTokens - Number of input tokens (uncached)
 * @param {number} outputTokens - Number of output tokens
 * @param {object} cacheStats - Optional cache statistics { cacheReadTokens, cacheWriteTokens }
 * @returns {number} Estimated cost in USD
 */
export function calculateCost(
  provider,
  model,
  inputTokens,
  outputTokens,
  cacheStats = {},
) {
  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) return 0;

  const modelConfig = providerConfig.models[model];
  if (!modelConfig) return 0;

  // Base input cost (uncached tokens)
  const inputCost = (inputTokens / 1_000_000) * modelConfig.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * modelConfig.outputCostPer1M;

  // Cache costs (if applicable)
  let cacheCost = 0;
  if (cacheStats.cacheReadTokens && modelConfig.cacheReadPer1M) {
    cacheCost +=
      (cacheStats.cacheReadTokens / 1_000_000) * modelConfig.cacheReadPer1M;
  }
  if (cacheStats.cacheWriteTokens && modelConfig.cacheWritePer1M) {
    cacheCost +=
      (cacheStats.cacheWriteTokens / 1_000_000) * modelConfig.cacheWritePer1M;
  }

  return inputCost + outputCost + cacheCost;
}

/**
 * Rough token estimation (4 chars ≈ 1 token)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// =============================================================================
// Provider Implementations
// =============================================================================

/**
 * Call Anthropic Claude API with prompt caching
 *
 * Uses prompt caching to reduce costs on repeated calls with the same system prompt.
 * Cache TTL is 5 minutes by default (or 1 hour with ttl: "1h"), refreshed on each use.
 * Prompt caching is now GA - just use cache_control in the content, no beta header needed.
 */
async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  // Calculate if system prompt is large enough to benefit from caching
  // Minimum: 1024 tokens for Sonnet/Opus, 2048 for Haiku
  const systemTokens = estimateTokens(systemPrompt);
  const isHaiku = model.includes("haiku");
  const minCacheTokens = isHaiku ? 2048 : 1024;
  const useCache = systemTokens >= minCacheTokens;

  // Build system content - use array format for cache control
  const systemContent = useCache
    ? [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ]
    : systemPrompt;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Prompt caching is now GA - no beta header needed
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,
      temperature: 0.5,
      system: systemContent,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  // Extract cache stats from response
  const usage = data.usage || {};
  const cacheReadTokens = usage.cache_read_input_tokens || 0;
  const cacheWriteTokens = usage.cache_creation_input_tokens || 0;
  const uncachedTokens = usage.input_tokens || 0;

  // Log cache performance
  if (useCache) {
    console.log(
      `Anthropic cache stats: read=${cacheReadTokens}, write=${cacheWriteTokens}, uncached=${uncachedTokens}`,
    );
  }

  return {
    content: data.content[0].text,
    inputTokens: uncachedTokens + cacheReadTokens + cacheWriteTokens,
    outputTokens: usage.output_tokens || estimateTokens(data.content[0].text),
    // Include cache stats for cost tracking
    cacheReadTokens,
    cacheWriteTokens,
    cacheUsed: useCache && (cacheReadTokens > 0 || cacheWriteTokens > 0),
  };
}

/**
 * Call Cloudflare Workers AI
 */
async function callCloudflare(aiBinding, model, systemPrompt, userPrompt) {
  const response = await aiBinding.run(model, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2048,
    temperature: 0.5,
  });

  // Workers AI doesn't return token counts, estimate them
  const inputTokens = estimateTokens(systemPrompt + userPrompt);
  const outputTokens = estimateTokens(response.response);

  return {
    content: response.response,
    inputTokens,
    outputTokens,
  };
}

/**
 * Stub for Moonshot AI (Kimi K2)
 * TODO: Implement when API access is available
 */
async function callMoonshot(apiKey, model, systemPrompt, userPrompt) {
  throw new Error(
    "Moonshot AI integration not yet implemented. Please use Anthropic or Cloudflare.",
  );

  // Future implementation will look something like:
  // const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     model: model,
  //     messages: [
  //       { role: 'system', content: systemPrompt },
  //       { role: 'user', content: userPrompt },
  //     ],
  //     max_tokens: 2048,
  //     temperature: 0.5,
  //   }),
  // });
  //
  // const data = await response.json();
  // return {
  //   content: data.choices[0].message.content,
  //   inputTokens: data.usage?.prompt_tokens || 0,
  //   outputTokens: data.usage?.completion_tokens || 0,
  // };
}

// =============================================================================
// Unified Interface
// =============================================================================

/**
 * Generate AI response using configured provider
 * @param {object} env - Environment bindings
 * @param {string} provider - Provider ID ('anthropic', 'cloudflare', 'moonshot')
 * @param {string} model - Model ID
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @returns {Promise<object>} Response with content and token counts
 */
export async function generateAIResponse(
  env,
  provider,
  model,
  systemPrompt,
  userPrompt,
) {
  const providerConfig = AI_PROVIDERS[provider];

  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (providerConfig.notImplemented) {
    throw new Error(`Provider ${provider} is not yet implemented`);
  }

  if (!providerConfig.models[model]) {
    console.warn(`Unknown model ${model} for ${provider}, using default`);
    model = providerConfig.defaultModel;
  }

  let result;

  switch (provider) {
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY secret not configured");
      }
      result = await callAnthropic(
        env.ANTHROPIC_API_KEY,
        model,
        systemPrompt,
        userPrompt,
      );
      break;

    case "cloudflare":
      if (!env.AI) {
        throw new Error("Cloudflare AI binding not configured");
      }
      result = await callCloudflare(env.AI, model, systemPrompt, userPrompt);
      break;

    case "moonshot":
      if (!env.MOONSHOT_API_KEY) {
        throw new Error("MOONSHOT_API_KEY secret not configured");
      }
      result = await callMoonshot(
        env.MOONSHOT_API_KEY,
        model,
        systemPrompt,
        userPrompt,
      );
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  // Calculate cost (include cache stats if available)
  const cacheStats = {
    cacheReadTokens: result.cacheReadTokens || 0,
    cacheWriteTokens: result.cacheWriteTokens || 0,
  };
  const cost = calculateCost(
    provider,
    model,
    result.inputTokens,
    result.outputTokens,
    cacheStats,
  );

  return {
    ...result,
    provider,
    model,
    cost,
  };
}

/**
 * Get all available models across all providers
 * @returns {Array} Array of model objects with provider info
 */
export function getAllModels() {
  const models = [];

  for (const [providerId, provider] of Object.entries(AI_PROVIDERS)) {
    for (const [modelId, model] of Object.entries(provider.models)) {
      models.push({
        id: modelId,
        provider: providerId,
        providerName: provider.name,
        name: model.name,
        quality: model.quality,
        speed: model.speed,
        inputCostPer1M: model.inputCostPer1M,
        outputCostPer1M: model.outputCostPer1M,
        isDefault: providerId === DEFAULT_PROVIDER && modelId === DEFAULT_MODEL,
        notImplemented: provider.notImplemented || false,
      });
    }
  }

  return models;
}

/**
 * Parse a model string that may include provider prefix
 * e.g., "anthropic:claude-haiku-4-5-20250514" or just "claude-haiku-4-5-20250514"
 * @param {string} modelString - Model string to parse
 * @returns {object} { provider, model }
 */
export function parseModelString(modelString) {
  if (!modelString) {
    return { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
  }

  // Check if it includes provider prefix
  if (modelString.includes(":")) {
    const [provider, model] = modelString.split(":");
    return { provider, model };
  }

  // Try to find the model in any provider
  for (const [providerId, provider] of Object.entries(AI_PROVIDERS)) {
    if (provider.models[modelString]) {
      return { provider: providerId, model: modelString };
    }
  }

  // Default to Anthropic for unknown models
  return { provider: DEFAULT_PROVIDER, model: modelString };
}
