export const PROMPTS = {
  prompt1: ({
    resumeText,
    jobDescription,
  }) => `"Act as a senior recruiter for this exact company. Analyze my resume against this job description and give me a match score out of 100, the top 5 missing keywords, and the 3 red flags a hiring manager would spot in under 10 seconds."

Return ONLY valid JSON with these exact keys:
- "atsScore": number 0-100
- "missingKeywords": array of strings (top 5)
- "redFlags": array of strings (top 3)
- "skillsPresent": array of strings
- "skillsMissing": array of strings
- "experienceGaps": array of strings
- "estimatedInterviewChance": "High" | "Medium" | "Low"
- "resumeQuality": "Excellent" | "Good" | "Average" | "Poor"
- "suggestions": array of strings

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY the JSON object. No markdown.`,

  prompt2: ({
    resumeText,
    jobDescription,
    missingKeywords,
    redFlags,
  }) => `"Rewrite my experience section to naturally include those keywords and remove the red flags. Use the Google XYZ formula: Accomplish X as measured by Y by doing Z."

CRITICAL RULES:
- NEVER fabricate metrics, percentages, or numbers
- NEVER change job titles, company names, or dates
- NEVER invent projects or technologies
- Only rephrase existing content to be more impactful
- Use XYZ Formula only when a real metric exists in the original
- Without a metric, use strong action verbs (built, designed, developed, optimized)

Original Resume:
${resumeText}

Target Job:
${jobDescription}

Missing keywords to insert naturally: ${(missingKeywords || []).join(', ')}

Red flags to remove: ${(redFlags || []).join(', ')}

Return ONLY the rewritten full resume in clean markdown. No commentary.`,

  prompt3: ({
    resumeText,
    rewrittenResume,
    jobDescription,
  }) => `"Now act as an ATS filter and a hiring manager reading 200 resumes in one sitting. Scan my new resume and tell me which sections would get skipped, then rewrite them so they actually stop the scroll."

First, return a JSON analysis of what would get skipped.
Then, return the complete rewritten resume with the skipped sections fixed.

===JSON_START===
Return a JSON object with these exact keys (no markdown):
- "atsNotes": array of strings
- "hiringManagerNotes": array of strings
- "formattingSuggestions": array of strings
- "explainChanges": array of strings
===JSON_END===

===RESUME_START===
Then write the complete rewritten resume in markdown with all skipped sections improved.
===RESUME_END===

ORIGINAL RESUME:
${resumeText}

REWRITTEN DRAFT:
${rewrittenResume}

JOB DESCRIPTION:
${jobDescription}

Return the JSON section between ===JSON_START=== and ===JSON_END===, and the resume between ===RESUME_START=== and ===RESUME_END===.`,
};
