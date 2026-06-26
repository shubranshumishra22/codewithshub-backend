import { env } from '../config/env.js';

const callOpenRouter = async (model, messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY || env.openrouterApiKey;
  if (!apiKey) {
    throw new Error('Missing OpenRouter API Key (OPENROUTER_API_KEY).');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://risingbrain.org',
      'X-Title': 'DSA Quest Logic Validator',
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenRouter');
  }

  return JSON.parse(content.trim());
};

export const translatePseudocode = async (questionTitle, questionDifficulty, pseudocode) => {
  const modelsConfig = process.env.OPENROUTER_MODELS || 'cohere/north-mini-code:free,qwen/qwen3-coder:free,meta-llama/llama-3.3-70b-instruct:free,meta-llama/llama-3.2-3b-instruct:free';
  const models = modelsConfig.split(',').map(m => m.trim());
  
  const systemPrompt = `You are a literal pseudocode-to-code translator. You are NOT a code reviewer and you must NOT fix bugs, off-by-one errors, wrong loop bounds, missing edge cases, or any other logical mistakes in the user's pseudocode. Your only job is to produce python code that does exactly what the pseudocode says, preserving any bugs faithfully, even if you can tell what the user "meant."

If a line is genuinely ambiguous (not just imprecise), pick the most literal, minimal-assumption interpretation and add a short note about it to "assumptions" — do not silently resolve ambiguity in the direction that makes the code correct.

Return ONLY valid JSON matching this schema: { "code": string, "language": string, "assumptions": string[], "untranslatable": boolean }. Set "untranslatable" to true only if the pseudocode is too incomplete to produce any code (e.g., just a function signature with no body).`;

  const userPrompt = `Problem: ${questionTitle}
Difficulty: ${questionDifficulty}
Pseudocode:
${pseudocode}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let lastError = null;
  for (const model of models) {
    try {
      console.log(`[LogicCheck] Attempting translation using model: ${model}`);
      const result = await callOpenRouter(model, messages);
      return result;
    } catch (err) {
      console.error(`[LogicCheck] Model ${model} translation failed:`, err.message);
      lastError = err;
    }
  }
  
  throw lastError || new Error('All translation models in the fallback chain failed.');
};

export const generateTestCases = async (questionTitle, questionDifficulty) => {
  const modelsConfig = process.env.OPENROUTER_MODELS || 'cohere/north-mini-code:free,qwen/qwen3-coder:free,meta-llama/llama-3.3-70b-instruct:free,meta-llama/llama-3.2-3b-instruct:free';
  const models = modelsConfig.split(',').map(m => m.trim());

  const systemPrompt = `You are a test case generator for coding questions. Given a coding question's title and difficulty, generate 3 diverse and valid test cases.
For each test case, provide:
- "input": a list/array of arguments to be passed directly to the function (e.g. for twoSum(nums, target) it should be [[2,7,11,15], 9]).
- "expected": the expected return value (e.g. [0, 1]).

Return ONLY a valid JSON object matching this schema:
{
  "test_cases": [
    {
      "input": array,
      "expected": any
    }
  ]
}`;

  const userPrompt = `Problem: ${questionTitle}
Difficulty: ${questionDifficulty}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let lastError = null;
  for (const model of models) {
    try {
      console.log(`[LogicCheck] Attempting test case generation using model: ${model}`);
      const result = await callOpenRouter(model, messages);
      if (result.test_cases && Array.isArray(result.test_cases)) {
        return result.test_cases;
      }
      if (Array.isArray(result)) {
        return result;
      }
    } catch (err) {
      console.error(`[LogicCheck] Model ${model} test case generation failed:`, err.message);
      lastError = err;
    }
  }

  // Safe fallback if LLM is completely down
  console.warn('[LogicCheck] Using hardcoded generic fallback test cases.');
  return [
    { input: [[1, 2, 3], 5], expected: null },
    { input: [[2, 7, 11, 15], 9], expected: [0, 1] }
  ];
};
