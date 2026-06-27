import { env } from '../config/env.js';

const callOpenRouter = async (model, messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenRouter API Key (OPENROUTER_API_KEY).');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://codewithshub.online',
      'X-Title': 'CodeWithShub DSA Solution Generator',
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

export const generateSolutionDetails = async (questionTitle, questionDifficulty) => {
  const modelsConfig = process.env.OPENROUTER_MODELS || 'cohere/north-mini-code:free,qwen/qwen3-coder:free,meta-llama/llama-3.3-70b-instruct:free,meta-llama/llama-3.2-3b-instruct:free';
  const models = modelsConfig.split(',').map(m => m.trim());

  const systemPrompt = `You are a professional software engineer and coding tutor.
Your job is to generate a comprehensive, accurate, and high-quality solution guide for a coding problem.

Given a coding question's title and difficulty, return a valid JSON object matching the following schema EXACTLY:
{
  "description": "A clear, detailed description of the problem, explaining what it asks for, any key parameters/constraints, and a conceptual overview of the solution approach.",
  "time_complexity": "Time Complexity (e.g., O(N) or O(N log N)), with a brief explanation of why.",
  "space_complexity": "Space Complexity (e.g., O(1) or O(N)), with a brief explanation of why.",
  "solution_cpp": "A clean, well-formatted, commented C++ solution code block. Only return code, do not use markdown code fences in this string.",
  "solution_java": "A clean, well-formatted, commented Java solution code block. Only return code, do not use markdown code fences in this string.",
  "solution_python": "A clean, well-formatted, commented Python solution code block. Only return code, do not use markdown code fences in this string.",
  "solution_javascript": "A clean, well-formatted, commented JavaScript solution code block. Only return code, do not use markdown code fences in this string."
}

Ensure all code blocks are completely syntax-correct, handle edge cases, and use idiomatic practices for each programming language. Use inline comments to explain key steps.`;

  const userPrompt = `Problem Title: ${questionTitle}
Difficulty: ${questionDifficulty}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let lastError = null;
  for (const model of models) {
    try {
      console.log(`[SolutionGenerator] Attempting solution generation using model: ${model}`);
      const result = await callOpenRouter(model, messages);
      
      // Basic check of required fields
      if (
        result &&
        result.description &&
        result.time_complexity &&
        result.space_complexity &&
        result.solution_cpp &&
        result.solution_java &&
        result.solution_python &&
        result.solution_javascript
      ) {
        return result;
      }
      console.warn(`[SolutionGenerator] Model ${model} returned JSON missing required fields.`);
    } catch (err) {
      console.error(`[SolutionGenerator] Model ${model} solution generation failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All solution generation models in the fallback chain failed.');
};
