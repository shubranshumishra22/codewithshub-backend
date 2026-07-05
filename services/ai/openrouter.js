import axios from 'axios';
import { env } from '../../config/env.js';

const BASE_URL = 'https://openrouter.ai/api/v1';

const MODEL_MAP = {
  analysis: env.OPENROUTER_ANALYSIS_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  rewrite: env.OPENROUTER_REWRITE_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  review: env.OPENROUTER_REVIEW_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  generate: env.OPENROUTER_GENERATE_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
};

const MODEL_OVERRIDE = env.OPENROUTER_MODEL_OVERRIDE;
if (MODEL_OVERRIDE) {
  Object.keys(MODEL_MAP).forEach((k) => { MODEL_MAP[k] = MODEL_OVERRIDE; });
}

const FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free'
];

export async function generateChatCompletion({
  modelKey,
  messages,
  temperature = 0.3,
  maxTokens = 2048,
}) {
  if (!env.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const model = MODEL_MAP[modelKey];
  if (!model) {
    throw new Error(`Unknown model key: ${modelKey}`);
  }

  const modelsToTry = [model, ...FALLBACK_MODELS];
  let lastError = null;

  for (const modelToTry of modelsToTry) {
    try {
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          model: modelToTry,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${env.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.clientUrl || 'http://localhost:5173',
            'X-Title': 'CodeWithShub Resume AI',
          },
          timeout: 120000,
        }
      );

      const choice = response.data.choices[0];
      return choice.message?.content || choice.message?.reasoning || '';
    } catch (err) {
      console.warn(`OpenRouter model ${modelToTry} failed, trying fallback...`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All OpenRouter fallbacks failed. Last error: ${lastError?.message}`);
}
