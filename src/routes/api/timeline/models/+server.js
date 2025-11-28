/**
 * Timeline Models API - Get available AI models
 *
 * GET /api/timeline/models - List all available models
 */

import { json, error } from '@sveltejs/kit';

const WORKER_URL = 'https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev';

// Fallback model definitions (mirrors workers/daily-summary/providers.js)
const FALLBACK_MODELS = {
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-haiku-4-5-20250514': {
        name: 'Claude 4.5 Haiku',
        quality: 'high',
        speed: 'fastest',
        inputCostPer1M: 0.80,
        outputCostPer1M: 4.00,
      },
      'claude-sonnet-4-20250514': {
        name: 'Claude 4 Sonnet',
        quality: 'highest',
        speed: 'medium',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
      },
      'claude-sonnet-4-5-20250514': {
        name: 'Claude 4.5 Sonnet',
        quality: 'highest',
        speed: 'fast',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
      },
    },
    defaultModel: 'claude-haiku-4-5-20250514',
  },
  cloudflare: {
    name: 'Cloudflare Workers AI',
    models: {
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast': {
        name: 'Llama 3.3 70B (Fast)',
        quality: 'highest',
        speed: 'medium',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      '@cf/meta/llama-3.1-70b-instruct': {
        name: 'Llama 3.1 70B',
        quality: 'high',
        speed: 'medium',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      '@cf/google/gemma-3-12b-it': {
        name: 'Gemma 3 12B',
        quality: 'high',
        speed: 'fast',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      '@cf/mistralai/mistral-small-3.1-24b-instruct': {
        name: 'Mistral Small 24B',
        quality: 'high',
        speed: 'fast',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
      '@cf/meta/llama-3.1-8b-instruct-fast': {
        name: 'Llama 3.1 8B (Fast)',
        quality: 'good',
        speed: 'fastest',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
    },
    defaultModel: '@cf/meta/llama-3.1-70b-instruct',
  },
  moonshot: {
    name: 'Moonshot AI',
    models: {
      'kimi-k2': {
        name: 'Kimi K2',
        quality: 'high',
        speed: 'medium',
        inputCostPer1M: 0.60,
        outputCostPer1M: 2.40,
      },
    },
    defaultModel: 'kimi-k2',
    notImplemented: true,
  },
};

const DEFAULT_PROVIDER = 'anthropic';
const DEFAULT_MODEL = 'claude-haiku-4-5-20250514';

function getFallbackModels() {
  const models = [];
  for (const [providerId, provider] of Object.entries(FALLBACK_MODELS)) {
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

export async function GET({ cookies }) {
  // Check admin authentication
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    throw error(401, 'Authentication required');
  }

  try {
    const response = await fetch(`${WORKER_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        return json(data);
      }
    }

    // Fall through to fallback if worker returns empty or fails
    console.warn('Worker models endpoint failed or returned empty, using fallback');
  } catch (e) {
    console.warn('Failed to fetch models from worker, using fallback:', e.message);
  }

  // Return fallback models
  const models = getFallbackModels();
  return json({
    models,
    providers: Object.entries(FALLBACK_MODELS).map(([id, p]) => ({
      id,
      name: p.name,
      notImplemented: p.notImplemented || false
    })),
    default: { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL },
    current: { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL }
  });
}
