import { env } from '../../config/env.js';
import { generateChatCompletion as nvidiaGenerate } from './nvidia.js';
import { generateChatCompletion as openrouterGenerate } from './openrouter.js';

const PROVIDER = (env.aiProvider || 'openrouter').toLowerCase();

export async function generateChatCompletion(opts) {
  if (PROVIDER === 'nvidia') {
    return nvidiaGenerate(opts);
  }
  return openrouterGenerate(opts);
}
