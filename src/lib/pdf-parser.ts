import { Buffer } from 'buffer';

/**
 * Custom PDF parser that uses pdf-parse but avoids the test file path issue
 * @param buffer The PDF file buffer
 * @returns The extracted text from the PDF
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Import the core pdf-parse module directly
    const pdfParseCore = require('pdf-parse/lib/pdf-parse.js');
    
    // Use the core module with our buffer
    const parsed = await pdfParseCore(buffer, {
      max: 0, // Parse all pages
      version: 'v2.0.550' // Use a specific version
    });
    
    return parsed.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}