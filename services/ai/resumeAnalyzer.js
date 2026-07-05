import { generateChatCompletion as nvidiaGenerate } from './nvidia.js';
import { generateChatCompletion as openrouterGenerate } from './openrouter.js';
import { generateChatCompletion as geminiGenerate } from './gemini.js';
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
    console.warn("OpenRouter completely failed (likely rate limited). Falling back to Gemini for Rewrite step.", openRouterErr.message);
    rewrittenResume = await geminiGenerate({
      modelKey: 'rewrite',
      messages: [{ role: 'user', content: prompt2Text }],
      temperature: 0.3,
    });
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

  // The new Gemini prompt outputs ONLY the final markdown resume.
  // We provide an empty review object to keep UI compatibility.
  let review = {
    atsNotes: [],
    hiringManagerNotes: [],
    formattingSuggestions: [],
    explainChanges: [],
  };
  
  // Clean up any potential markdown wrappers Gemini might add despite instructions
  let finalResume = finalResumeRaw.trim();
  if (finalResume.startsWith('```markdown')) {
      finalResume = finalResume.replace(/^```markdown\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  return {
    analysis,
    rewrittenResume, // This is now a raw list/extraction
    review,
    finalResume,
  };
}
