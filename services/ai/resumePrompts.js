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

Original Resume:
${resumeText}

Target Job:
${jobDescription}

Missing keywords to insert naturally: ${(missingKeywords || []).join(', ')}

Red flags to remove: ${(redFlags || []).join(', ')}

Extract all content from the resume and return a structured raw list of projects, experience, skills, education, and metrics, incorporating the rewrites. Do not format it as a final resume yet.`,

  prompt3: ({
    resumeText, // We will actually pass the original here if needed
    rewrittenResume,
    jobDescription,
  }) => `"Now act as an ATS filter and a hiring manager reading 200 resumes in one sitting. Scan my new resume and tell me which sections would get skipped, then rewrite them so they actually stop the scroll."

Generate a resume in the following strict format and style. This is a single-column, 
ATS-friendly technical resume for ML/Software Engineering roles. Follow these rules exactly:

STRUCTURE (in this order):
1. HEADER: Full Name (large, bold) on its own line. Below it, one line with:
   Email | Phone | LinkedIn | GitHub | Location — separated by pipes.

2. SUMMARY (3-4 sentences, no bullet points):
   - Open with role/identity + one standout metric (e.g. CGPA, GPA, or years of experience).
   - Name 2-3 specific shipped projects/systems with their single most impressive 
     quantified result each (accuracy %, scale, latency, users, revenue, etc.).
   - Mention any publications, patents, or major recognitions in one clause.
   - End with a "Targeting [specific role type] where [specific value proposition]" 
     sentence that signals intent to the recruiter.

3. SKILLS (grouped by category, NOT a single list):
   - Use 4-6 categories relevant to the field (e.g. Languages, Machine Learning, 
     Backend & APIs, Tools & Workflow, Core CS Foundations).
   - Each category: "Category Name: comma-separated list of specific tools/skills."
   - Be specific with tool names (e.g. "Scikit-learn, TensorFlow, PyTorch" not "ML libraries").

4. EDUCATION:
   - Institution name | Expected/Actual graduation date (right-aligned or same line).
   - Degree, Major | CGPA/GPA.
   - Optional: prior schooling in one compressed line.

5. EXPERIENCE / RESEARCH (if applicable):
   - Section title bold, with a right-aligned tag (e.g. "Springer Publication", 
     "Remote Internship") if relevant.
   - 2-4 bullets per entry, each following this EXACT pattern:
     "[Achieved/Reduced/Improved/Enabled/Built] [specific quantified outcome] 
      by [specific action verb + method/tool], [additional technical detail]."
   - Every bullet MUST contain at least one number (%, count, time, scale).
   - Lead with the RESULT, not the task.

6. PROJECTS (2-4 projects):
   - Project name (bold) with a right-aligned "GitHub" or "Live Demo" link label.
   - 2-3 bullets per project, same quantified-outcome-first pattern as above.
   - Mention specific frameworks, algorithms, and architecture choices, not vague terms.

7. AWARDS & CERTIFICATIONS (compressed, 1-2 lines total):
   - Format: "Award/Rank, Competition Name | Award, Competition Name"
   - Certifications: "Certifications: Platform - Course Name, Platform - Course Name"

STYLE RULES:
- No paragraphs anywhere except the summary. Everything else is bullets or 
  comma-separated fragments.
- Every achievement bullet uses the causal structure: OUTCOME (with number) 
  + "by" + ACTION (with specific tool/method named).
- Avoid soft/vague verbs (helped, worked on, responsible for). Use strong verbs: 
  Built, Shipped, Reduced, Engineered, Deployed, Automated, Improved, Delivered.
- Keep to one page. Prioritize recency and relevance over completeness.
- No personal pronouns (I, my). No objective statements (only the targeted summary).
- Consistent tense: present-tense summary, past-tense bullets throughout.

INPUT I WILL GIVE YOU:
${rewrittenResume}

OUTPUT: The resume formatted exactly per the structure and style rules above in markdown format. No extra chat or commentary.`,
};
