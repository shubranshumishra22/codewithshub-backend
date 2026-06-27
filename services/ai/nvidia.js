import axios from 'axios';
import { env } from '../../config/env.js';

const BASE_URL = env.nvidiaBaseUrl || 'https://integrate.api.nvidia.com/v1';

const MODEL_MAP = {
  analysis: env.NVIDIA_ANALYSIS_MODEL || 'meta/llama-3.1-70b-instruct',
  rewrite: env.NVIDIA_REWRITE_MODEL || 'meta/llama-3.1-70b-instruct',
  review: env.NVIDIA_REVIEW_MODEL || 'meta/llama-3.1-70b-instruct',
  generate: env.NVIDIA_GENERATE_MODEL || 'meta/llama-3.1-70b-instruct',
};

const MODEL_OVERRIDE_KEY = env.NVIDIA_MODEL_OVERRIDE;
if (MODEL_OVERRIDE_KEY) {
  Object.keys(MODEL_MAP).forEach((k) => { MODEL_MAP[k] = MODEL_OVERRIDE_KEY; });
}

export async function generateChatCompletion({
  modelKey,
  messages,
  temperature = 0.3,
  maxTokens = 2048,
}) {
  if (!env.nvidiaApiKey) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const model = MODEL_MAP[modelKey];
  if (!model) {
    throw new Error(`Unknown model key: ${modelKey}. Available keys: ${Object.keys(MODEL_MAP).join(', ')}`);
  }

  const systemPrefix = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const safeMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m, i) => {
      if (i === 0 && systemPrefix) {
        return { ...m, content: `${systemPrefix}\n\n${m.content}` };
      }
      return m;
    });

  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model,
      messages: safeMessages,
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${env.nvidiaApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 180000,
    }
  );

  const choice = response.data.choices[0];
  return choice.message?.content || choice.message?.reasoning || '';
}
