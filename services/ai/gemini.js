import axios from 'axios';
import { env } from '../../config/env.js';

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

export async function generateChatCompletion({
  modelKey,
  messages,
  temperature = 0.3,
}) {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Combine system messages with user messages for simpler API compatibility
  const systemPrefix = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
    
  const combinedText = messages
    .filter((m) => m.role !== 'system')
    .map((m, i) => {
      if (i === 0 && systemPrefix) {
        return `${systemPrefix}\n\n${m.content}`;
      }
      return m.content;
    })
    .join('\n\n');

  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: combinedText }],
            },
          ],
          generationConfig: {
            temperature,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        }
      );

      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      console.warn(`Gemini model ${model} failed, trying fallback...`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All Gemini fallbacks failed. Last error: ${lastError?.message}`);
}
