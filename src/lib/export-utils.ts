import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import jsPDF from 'jspdf';

/**
 * Export text to DOCX format with professional formatting
 */
export async function exportToDocx(text: string, filename: string = 'humanized-text.docx'): Promise<Buffer> {
  // Split text into paragraphs
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
  
  // Create document with professional styling
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            text: 'Humanized Text',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),
          
          // Content paragraphs
          ...paragraphs.map(paragraph => 
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 24, // 12pt
                  font: 'Calibri',
                }),
              ],
              spacing: {
                after: 200,
                line: 360, // 1.5 line spacing
              },
              alignment: AlignmentType.JUSTIFIED,
            })
          ),
        ],
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export text to PDF format with professional formatting
 */
export function exportToPdf(text: string, filename: string = 'humanized-text.pdf'): Buffer {
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set font and styling
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  // Set margins
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = pageWidth - (margin * 2);

  // Split text into lines that fit the page width
  const lines = doc.splitTextToSize(text, textWidth);

  let yPosition = margin + 20; // Start below title
  let currentPage = 1;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = 'Humanized Text';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, margin);
  
  // Reset font for body text
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // Add content line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      currentPage++;
      yPosition = margin;
    }

    // Add the line
    doc.text(line, margin, yPosition);
    yPosition += 7; // Line height
  }

  // Add page numbers
  for (let page = 1; page <= currentPage; page++) {
    doc.setPage(page);
    doc.setFontSize(10);
    doc.text(`Page ${page} of ${currentPage}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
  }

  // Return the PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Export text to TXT format (simple text file)
 */
export function exportToTxt(text: string): Buffer {
  return Buffer.from(text, 'utf-8');
}

/**
 * Get file extension for different export formats
 */
export function getFileExtension(format: 'txt' | 'pdf' | 'docx'): string {
  switch (format) {
    case 'txt': return '.txt';
    case 'pdf': return '.pdf';
    case 'docx': return '.docx';
    default: return '.txt';
  }
}

/**
 * Get MIME type for different export formats
 */
export function getMimeType(format: 'txt' | 'pdf' | 'docx'): string {
  switch (format) {
    case 'txt': return 'text/plain';
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'text/plain';
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(format: 'txt' | 'pdf' | 'docx', prefix: string = 'humanized'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = getFileExtension(format);
  return `${prefix}-${timestamp}${extension}`;
}
