import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType } from 'docx';
import { analyzeResume } from '../services/ai/resumeAnalyzer.js';

async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  await parser.load();
  const data = await parser.getText();
  return data.text || '';
}

async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractText(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf' || mimetype === 'application/pdf') {
    return extractTextFromPDF(filePath);
  }
  if (ext === '.docx' || ext === '.doc' || mimetype.includes('word')) {
    return extractTextFromDOCX(filePath);
  }
  throw new Error(`Unable to extract text from file: ${filePath}`);
}

export async function uploadResumeFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const resumeText = await extractText(filePath, req.file.mimetype);
    const pages = req.file.originalname.endsWith('.pdf')
      ? Math.max(1, Math.ceil(resumeText.length / 3000))
      : 1;

    return res.json({
      filename: req.file.originalname,
      pages,
      textLength: resumeText.length,
      resumeText,
    });
  } catch (err) {
    return res.status(422).json({ error: `Failed to extract text: ${err.message}` });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export async function analyzeResumeHandler(req, res) {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'resumeText and jobDescription are required.' });
  }

  if (resumeText.length < 50) {
    return res.status(422).json({ error: 'Resume text appears too short. Please upload a valid resume.' });
  }

  if (jobDescription.length < 20) {
    return res.status(422).json({ error: 'Job description is too short. Please provide a full job description.' });
  }

  const result = await analyzeResume(resumeText, jobDescription);

  return res.json(result);
}

function renderInlineMarkdown(doc, text, startX, startY, options = {}) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  let first = true;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    let font = 'Helvetica';
    let content = part;

    if (part.startsWith('**') && part.endsWith('**')) {
      font = 'Helvetica-Bold';
      content = part.slice(2, -2);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      font = 'Helvetica-Oblique';
      content = part.slice(1, -1);
    }

    let hasMore = false;
    for (let j = i + 1; j < parts.length; j++) {
      if (parts[j].length > 0) hasMore = true;
    }

    let partOptions = { ...options, continued: hasMore };

    if (first && startX !== null && startY !== null) {
      doc.font(font).text(content, startX, startY, partOptions);
      first = false;
    } else {
      doc.font(font).text(content, partOptions);
    }
  }
}

function markdownToPdf(resumeMd, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="optimized-resume.pdf"');
  doc.pipe(res);

  const lines = resumeMd.split('\n');
  let isHeader = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (!isHeader) doc.moveDown(0.3);
      continue;
    }

    if (line.match(/^[-*_]{3,}$/)) continue;

    if (isHeader && i === 0) {
      line = line.replace(/[*#]/g, '').trim();
      doc.fontSize(22).font('Helvetica-Bold').text(line, { align: 'center' });
      doc.moveDown(0.2);
      continue;
    }

    if (isHeader && (i === 1 || i === 2) && line.includes('|')) {
      line = line.replace(/[*#]/g, '').trim();
      doc.fontSize(9).font('Helvetica').text(line, { align: 'center' });
      doc.moveDown(0.8);
      isHeader = false;
      continue;
    }

    if (line.startsWith('#') || line.match(/^\*\*[A-Z\s]+\*\*$/)) {
      const heading = line.replace(/[*#]/g, '').trim().toUpperCase();
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').text(heading, { align: 'left' });
      
      const y = doc.y;
      doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
      doc.moveDown(0.3);
      doc.fillColor('black'); // Reset stroke color to black fill
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const bulletText = line.replace(/^[-*•]\s*/, '');
      doc.fontSize(9.5).fillColor('black');
      
      const y = doc.y;
      doc.circle(45, y + 4, 1.5).fillAndStroke('black', 'black');
      
      renderInlineMarkdown(doc, bulletText, 55, y, { align: 'justify', width: 500 });
      continue;
    }

    if (line.includes(' | ')) {
      const parts = line.split(' | ');
      const rightText = parts.pop();
      const leftText = parts.join(' | ');
      
      const startY = doc.y;
      doc.fontSize(10).fillColor('black');
      renderInlineMarkdown(doc, leftText, 40, startY, { continued: false });
      doc.font('Helvetica').text(rightText, 40, startY, { align: 'right', width: 515 });
      continue;
    }

    doc.fontSize(9.5).fillColor('black');
    renderInlineMarkdown(doc, line, 40, doc.y, { align: 'justify', width: 515 });
  }

  doc.end();
}

function markdownToDocx(md) {
  const lines = md.split('\n');
  const children = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }
    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^# /, ''),
          heading: 'Heading1',
          spacing: { after: 200 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^## /, ''),
          heading: 'Heading2',
          spacing: { after: 160 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^### /, ''),
          heading: 'Heading3',
          spacing: { after: 120 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${trimmed.replace(/^[-*] /, '')}`, size: 20 })],
          indent: { left: 400 },
          spacing: { after: 80 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 20 })],
          spacing: { after: 100 },
        })
      );
    }
  }

  return Document.fromJs({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({ children: [] }),
        },
        footers: {
          default: new Footer({ children: [] }),
        },
        children,
      },
    ],
  });
}

export async function downloadResume(req, res) {
  const { resumeText, format } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'resumeText is required.' });
  }

  try {
    if (format === 'pdf') {
      markdownToPdf(resumeText, res);
    } else if (format === 'docx') {
      const doc = markdownToDocx(resumeText);
      const buffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="optimized-resume.docx"');
      res.send(buffer);
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="optimized-resume.txt"');
      res.send(resumeText);
    }
  } catch (err) {
    return res.status(500).json({ error: `Failed to generate file: ${err.message}` });
  }
}
