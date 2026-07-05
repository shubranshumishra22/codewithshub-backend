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
    resumeText,
    rewrittenResume,
    jobDescription,
  }) => `"Act as a professional Python developer and resume designer. Take the rewritten experience content and output a self-contained, executable Python script using the ReportLab library to build a high-fidelity PDF. 

Do NOT output any critique, introductory text, explanations, or commentary. Output ONLY the valid Python code. Start your response with \`\`\`python and end with \`\`\`.

The Python script must strictly follow this structure and style template:

\`\`\`python
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT

PAGE_W, PAGE_H = A4
MARGIN = 0.45 * inch
ACCENT = colors.HexColor("#371e77")
BLACK = colors.black
DARK_GRAY = colors.HexColor("#222222")

def make_styles():
    name = ParagraphStyle("Name", fontName="Helvetica-Bold", fontSize=18, leading=21,
        alignment=TA_CENTER, textColor=BLACK, spaceAfter=2)
    contact = ParagraphStyle("Contact", fontName="Helvetica", fontSize=8, leading=11,
        alignment=TA_CENTER, textColor=ACCENT, spaceAfter=4)
    section = ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=10, leading=13,
        textColor=BLACK, spaceBefore=9, spaceAfter=2, textTransform="uppercase")
    body = ParagraphStyle("Body", fontName="Helvetica", fontSize=8.5, leading=12,
        textColor=DARK_GRAY, spaceAfter=2)
    bold_body = ParagraphStyle("BoldBody", parent=body, fontName="Helvetica-Bold")
    bullet = ParagraphStyle("Bullet", fontName="Helvetica", fontSize=8.5, leading=12.5,
        leftIndent=12, firstLineIndent=0, textColor=DARK_GRAY, spaceAfter=2, bulletIndent=4)
    right = ParagraphStyle("Right", fontName="Helvetica", fontSize=8.5, leading=12,
        alignment=TA_RIGHT, textColor=ACCENT)
    summary = ParagraphStyle("Summary", fontName="Helvetica", fontSize=8.5, leading=12.5,
        textColor=DARK_GRAY, alignment=TA_JUSTIFY, spaceAfter=2)
    return dict(name=name, contact=contact, section=section, body=body,
        bold_body=bold_body, bullet=bullet, right=right, summary=summary)

def hr():
    return HRFlowable(width="100%", thickness=0.6, color=BLACK, spaceAfter=3)

def section_heading(text, s):
    return [Paragraph(text, s["section"]), hr()]

def two_col(left_para, right_para):
    w = PAGE_W - 2 * MARGIN
    lw, rw = w * 0.72, w * 0.28
    t = Table([[left_para, right_para]], colWidths=[lw, rw])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t

def bi(text, s):
    return Paragraph(f"• {text}", s["bullet"])

def build_resume(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=0.35*inch, bottomMargin=0.35*inch)
    s = make_styles()
    story = []

    # 1. Header Details (Name, Contact Info)
    # 2. Summary (Section & body paragraphs)
    # 3. Skills (Section & Body list formatted cleanly)
    # 4. Education (Section & two_col layout)
    # 5. Experience / Research (Section, two_col for headers, bi() for bullets)
    # 6. Projects (Section, two_col for titles/links, bi() for bullets)
    # 7. Awards & Certifications (Section & body text)

    doc.build(story)

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "output.pdf"
    build_resume(out_path)
\`\`\`

Resume Content to Include (incorporating these rewrites and details):
${rewrittenResume}

Target Job Details:
${jobDescription}

Generate the exact python script to construct this resume. Match the layout, tenses, style guides and formats perfectly. Output only the python block.`,
};
