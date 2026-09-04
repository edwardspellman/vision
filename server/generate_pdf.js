const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generatePdfDocumentation() {
  const mdPath = path.join(__dirname, '..', 'VISION_DOCUMENTATION.md');
  const pdfPath = path.join(__dirname, '..', 'VISION_DOCUMENTATION.pdf');

  if (!fs.existsSync(mdPath)) {
    console.error('Markdown file not found:', mdPath);
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  // Create PDF Document (A4 size)
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: 'VISION — Architecture, Features & Design Documentation',
      Author: 'Vision Core Telemetry',
      Subject: 'Technical Application Documentation'
    }
  });

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  // Background Header Bar Color
  doc.rect(0, 0, 595.28, 60).fill('#05080f');

  // Header Title
  doc.fillColor('#00ff88')
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('⚡ VISION', 40, 20, { continued: true })
     .fillColor('#ffffff')
     .text(' // Architecture & Features Documentation', { continued: false });

  doc.moveDown(2);
  doc.y = 80;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      doc.moveDown(0.4);
      return;
    }

    // Header 1: # Title
    if (trimmed.startsWith('# ')) {
      doc.moveDown(0.5);
      doc.fillColor('#00f0ff')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(trimmed.replace(/^#\s+/, ''));
      doc.moveDown(0.3);
      doc.strokeColor('#1a263d').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.4);
    }
    // Header 2: ## Subtitle
    else if (trimmed.startsWith('## ')) {
      doc.moveDown(0.6);
      doc.fillColor('#00ff88')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text(trimmed.replace(/^##\s+/, ''));
      doc.moveDown(0.3);
    }
    // Header 3: ### Subheading
    else if (trimmed.startsWith('### ')) {
      doc.moveDown(0.4);
      doc.fillColor('#ffffff')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(trimmed.replace(/^###\s+/, ''));
      doc.moveDown(0.2);
    }
    // Quote / Callout Box
    else if (trimmed.startsWith('>')) {
      doc.moveDown(0.2);
      const calloutText = trimmed.replace(/^>\s*/, '').replace(/\*\*/g, '');
      doc.rect(40, doc.y, 515, 26).fill('#0a1120').stroke('#00f0ff');
      doc.fillColor('#00f0ff')
         .fontSize(9)
         .font('Helvetica-Oblique')
         .text(calloutText, 48, doc.y - 19, { width: 500 });
      doc.moveDown(0.4);
    }
    // Table rows or Code block lines
    else if (trimmed.startsWith('|') || trimmed.startsWith('```') || trimmed.startsWith('├──') || trimmed.startsWith('└──') || trimmed.startsWith('│')) {
      doc.fillColor('#a1a1aa')
         .fontSize(8.5)
         .font('Courier')
         .text(line, { width: 515 });
    }
    // Bullet points
    else if (trimmed.startsWith('- ')) {
      const text = trimmed.replace(/^- /, '').replace(/\*\*/g, '');
      doc.fillColor('#e4e4e7')
         .fontSize(9.5)
         .font('Helvetica')
         .text('• ' + text, 50, doc.y, { width: 505 });
      doc.moveDown(0.2);
    }
    // Standard Paragraph text
    else {
      const cleanText = trimmed.replace(/\*\*/g, '');
      doc.fillColor('#d4d4d8')
         .fontSize(9.5)
         .font('Helvetica')
         .text(cleanText, 40, doc.y, { width: 515 });
      doc.moveDown(0.2);
    }
  });

  // Footer on each page
  const pageRange = doc.bufferedPageRange();
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#71717a')
       .fontSize(8)
       .font('Helvetica')
       .text(`Vision Telemetry Documentation — Page ${i + 1} of ${pageRange.count}`, 40, 810, { align: 'center', width: 515 });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log('✅ VISION_DOCUMENTATION.pdf generated successfully!');
    console.log('File Path:', pdfPath);
  });
}

generatePdfDocumentation();
