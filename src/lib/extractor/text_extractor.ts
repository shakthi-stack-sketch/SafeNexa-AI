import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  wordCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PDFParseClass: any = null;
function getPDFParseClass() {
  if (!PDFParseClass) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParsePkg = require('pdf-parse');
    PDFParseClass = pdfParsePkg.PDFParse || pdfParsePkg.default || pdfParsePkg;
  }
  return PDFParseClass;
}

/**
 * Extracts plain text from PDF, DOCX, or TXT file buffers.
 * Handles encoding, extracts structured content, and flags scanned/empty documents.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (extension === 'txt') {
    try {
      const text = buffer.toString('utf-8').trim();
      if (!text) {
        return {
          text: '',
          wordCount: 0,
          fileType: 'txt',
          error: 'The uploaded text file is empty.',
        };
      }
      return {
        text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        fileType: 'txt',
      };
    } catch (err: unknown) {
      console.error('Error reading TXT buffer:', err);
      return {
        text: '',
        wordCount: 0,
        fileType: 'txt',
        error: 'Unable to decode text file. Please ensure UTF-8 encoding.',
      };
    }
  }

  if (extension === 'pdf') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parser: any = null;
    try {
      const Cls = getPDFParseClass();
      parser = new Cls({ data: buffer });
      const textResult = await parser.getText();
      const text = (textResult?.text || '').trim();

      // Detect if PDF has no extractable text (e.g. scanned image PDF)
      if (!text || text.length < 15) {
        return {
          text: '',
          wordCount: 0,
          fileType: 'pdf',
          error: 'Text could not be extracted from this document. OCR is required for scanned reports.',
        };
      }

      return {
        text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        fileType: 'pdf',
      };
    } catch (err: unknown) {
      console.error('Error parsing PDF buffer:', err);
      return {
        text: '',
        wordCount: 0,
        fileType: 'pdf',
        error: 'Text could not be extracted from this document. OCR is required for scanned reports.',
      };
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  if (extension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || '').trim();

      if (!text) {
        return {
          text: '',
          wordCount: 0,
          fileType: 'docx',
          error: 'The uploaded DOCX document contains no readable text.',
        };
      }

      return {
        text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        fileType: 'docx',
      };
    } catch (err: unknown) {
      console.error('Error parsing DOCX buffer:', err);
      return {
        text: '',
        wordCount: 0,
        fileType: 'docx',
        error: 'Unable to extract text from DOCX file. File may be corrupted.',
      };
    }
  }

  return {
    text: '',
    wordCount: 0,
    fileType: 'txt',
    error: `Unsupported file format (.${extension}). Supported types: PDF, DOCX, TXT.`,
  };
}
