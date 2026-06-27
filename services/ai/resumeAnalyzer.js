import { generateChatCompletion } from './index.js';
import { PROMPTS } from './resumePrompts.js';

function safeJsonParse(text) {
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function analyzeResume(resumeText, jobDescription) {
  const prompt1Text = PROMPTS.prompt1({ resumeText, jobDescription });

  const analysisRaw = await generateChatCompletion({
    modelKey: 'analysis',
    messages: [{ role: 'user', content: prompt1Text }],
    temperature: 0.2,
    maxTokens: 2048,
  });

  const analysis = safeJsonParse(analysisRaw) || {
    atsScore: 0,
    missingKeywords: [],
    redFlags: [],
    skillsPresent: [],
    skillsMissing: [],
    experienceGaps: [],
    estimatedInterviewChance: 'Low',
    resumeQuality: 'Average',
    suggestions: [],
    _parseError: analysisRaw,
  };

  const prompt2Text = PROMPTS.prompt2({
    resumeText,
    jobDescription,
    missingKeywords: analysis.missingKeywords || [],
    redFlags: analysis.redFlags || [],
  });

  const rewrittenResume = await generateChatCompletion({
    modelKey: 'rewrite',
    messages: [{ role: 'user', content: prompt2Text }],
    temperature: 0.3,
    maxTokens: 3072,
  });

  const prompt3Text = PROMPTS.prompt3({
    resumeText,
    rewrittenResume,
    jobDescription,
  });

  const prompt3Raw = await generateChatCompletion({
    modelKey: 'review',
    messages: [{ role: 'user', content: prompt3Text }],
    temperature: 0.2,
    maxTokens: 4096,
  });

  let review = {
    atsNotes: [],
    hiringManagerNotes: [],
    formattingSuggestions: [],
    explainChanges: [],
  };
  let finalResume = rewrittenResume;

  const jsonMatch = prompt3Raw.match(/===JSON_START===\s*([\s\S]*?)\s*===JSON_END===/);
  if (jsonMatch) {
    const parsed = safeJsonParse(jsonMatch[1]);
    if (parsed) review = { ...review, ...parsed };
  }

  const resumeMatch = prompt3Raw.match(/===RESUME_START===\s*([\s\S]*?)\s*===RESUME_END===/);
  if (resumeMatch) {
    finalResume = resumeMatch[1].trim();
  }

  return {
    analysis,
    rewrittenResume,
    review,
    finalResume,
  };
}
