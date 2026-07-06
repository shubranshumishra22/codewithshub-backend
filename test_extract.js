import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import path from 'path';

async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  await parser.load();
  const data = await parser.getText();
  return data.text || '';
}

const pdfPath = '/Users/shubranshushekhar/Downloads/optimized-resume (3).pdf';
if (fs.existsSync(pdfPath)) {
  console.log("PDF exists, parsing...");
  extractTextFromPDF(pdfPath)
    .then(text => console.log("SUCCESS! Text length:", text.length))
    .catch(err => console.error("FAILED to parse PDF:", err));
} else {
  console.error("Test PDF not found at:", pdfPath);
}
