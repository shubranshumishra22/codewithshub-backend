import { generateChatCompletion as nvidiaGenerate } from './nvidia.js';
import { generateChatCompletion as openrouterGenerate } from './openrouter.js';
import { generateChatCompletion as geminiGenerate } from './gemini.js';
import { PROMPTS } from './resumePrompts.js';
import { CHAT_PROMPT } from './resumeChatPrompt.js';

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

export async function analyzeBasicResume(resumeText, jobDescription) {
  const prompt1Text = PROMPTS.prompt1({ resumeText, jobDescription });

  let analysisRaw;
  try {
    analysisRaw = await nvidiaGenerate({
      modelKey: 'analysis',
      messages: [{ role: 'user', content: prompt1Text }],
      temperature: 0.2,
      maxTokens: 2048,
    });
  } catch (nvidiaErr) {
    console.warn("Nvidia completely failed. Falling back to Gemini for Analysis step.", nvidiaErr.message);
    analysisRaw = await geminiGenerate({
      modelKey: 'analysis',
      messages: [{ role: 'user', content: prompt1Text }],
      temperature: 0.2,
    });
  }

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

  return analysis;
}

export async function optimizeResume(resumeText, jobDescription, analysis) {
  const prompt2Text = PROMPTS.prompt2({
    resumeText,
    jobDescription,
    missingKeywords: analysis.missingKeywords || [],
    redFlags: analysis.redFlags || [],
  });

  let rewrittenResume;
  try {
    rewrittenResume = await openrouterGenerate({
      modelKey: 'rewrite',
      messages: [{ role: 'user', content: prompt2Text }],
      temperature: 0.3,
      maxTokens: 3072,
    });
  } catch (openRouterErr) {
    console.warn("OpenRouter completely failed. Falling back to Nvidia for Rewrite step.", openRouterErr.message);
    try {
      rewrittenResume = await nvidiaGenerate({
        modelKey: 'rewrite',
        messages: [{ role: 'user', content: prompt2Text }],
        temperature: 0.3,
        maxTokens: 3072,
      });
    } catch (nvidiaErr) {
      console.warn("Nvidia also failed. Falling back to Gemini for Rewrite step.", nvidiaErr.message);
      rewrittenResume = await geminiGenerate({
        modelKey: 'rewrite',
        messages: [{ role: 'user', content: prompt2Text }],
        temperature: 0.3,
      });
    }
  }

  const prompt3Text = PROMPTS.prompt3({
    resumeText,
    rewrittenResume,
    jobDescription,
  });

  let finalResumeRaw;
  try {
    finalResumeRaw = await geminiGenerate({
      modelKey: 'review',
      messages: [{ role: 'user', content: prompt3Text }],
      temperature: 0.2,
    });
  } catch (geminiErr) {
    console.warn("Gemini completely failed. Falling back to Nvidia for Review step.", geminiErr.message);
    try {
      finalResumeRaw = await nvidiaGenerate({
        modelKey: 'review',
        messages: [{ role: 'user', content: prompt3Text }],
        temperature: 0.2,
        maxTokens: 3072,
      });
    } catch (nvidiaErr) {
      console.warn("Nvidia also failed. Falling back to OpenRouter for Review step.", nvidiaErr.message);
      finalResumeRaw = await openrouterGenerate({
        modelKey: 'review',
        messages: [{ role: 'user', content: prompt3Text }],
        temperature: 0.2,
        maxTokens: 3072,
      });
    }
  }

  return {
    rewrittenResume,
    finalResume: finalResumeRaw,
  };
}

export async function analyzeResume(resumeText, jobDescription) {
  const analysis = await analyzeBasicResume(resumeText, jobDescription);
  const { rewrittenResume, finalResume } = await optimizeResume(resumeText, jobDescription, analysis);

  let review = {
    atsNotes: [],
    hiringManagerNotes: [],
    formattingSuggestions: [],
    explainChanges: [],
  };

  return {
    analysis,
    rewrittenResume,
    review,
    finalResume,
  };
}

export async function chatResume(currentResume, userMessage, jobDescription) {
  const promptText = CHAT_PROMPT({ currentResume, userMessage, jobDescription });

  let updatedResumeRaw;
  try {
    updatedResumeRaw = await geminiGenerate({
      modelKey: 'review', // Using review model since it uses gemini-2.5-flash which is perfect for code generation
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.2,
    });
  } catch (geminiErr) {
    console.warn("Gemini completely failed in chat. Falling back to Nvidia.", geminiErr.message);
    updatedResumeRaw = await nvidiaGenerate({
      modelKey: 'review',
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.2,
      maxTokens: 3072,
    });
  }

  return updatedResumeRaw;
}
