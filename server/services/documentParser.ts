import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
  mimeType: string;
  fileName?: string;
  metadata?: Record<string, any>;
}

/**
 * Clean & normalize raw extracted text from PDFs, DOCX, or text files
 */
export function normalizeExtractedText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // 1. Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove null bytes and non-printable control characters (except tabs and newlines)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Normalize multiple blank lines to at most two
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // 4. Remove excessive horizontal whitespace
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

  // 5. Trim lines
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return cleaned.trim();
}

/**
 * Universal Document Parser supporting PDF, DOCX, TXT, MD
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string = "document"
): Promise<ParsedDocument> {
  const lowerName = fileName.toLowerCase();
  const isDocx =
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc");

  const isPdf =
    mimeType.includes("pdf") || lowerName.endsWith(".pdf");

  let extractedText = "";
  let pageCount: number | undefined = undefined;

  try {
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (isPdf) {
      try {
        const pdfParser = new PDFParse({ data: buffer } as any);
        const parsed = await pdfParser.getText();
        extractedText = parsed.text || "";
        pageCount = parsed.numpages || undefined;
      } catch (pdfErr) {
        console.warn("[Document Parser] PDF text parsing fallback attempt:", pdfErr);
        // Fallback for simple ascii extraction if pdf parser meets corrupted fonts
        extractedText = buffer.toString("utf-8");
      }
    } else {
      // Plain text or Markdown
      extractedText = buffer.toString("utf-8");
    }
  } catch (err: any) {
    console.error(`[Document Parser] Failed to parse document (${fileName}):`, err);
    throw new Error(`فشل استخراج النصوص من المستند (${fileName}): ${err.message}`);
  }

  const normalized = normalizeExtractedText(extractedText);
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: normalized,
    pageCount,
    wordCount,
    mimeType: isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : isPdf
      ? "application/pdf"
      : "text/plain",
    fileName,
  };
}

/**
 * Recursive Pedagogical Text Splitter
 * Splits long text at natural semantic boundaries (Units, Chapters, Headings, Paragraphs)
 */
export function splitTextPedagogically(
  text: string,
  chunkSize: number = 4000,
  overlap: number = 200
): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const separators = [
    "\n# ",
    "\n## ",
    "\n### ",
    "\n\n",
    "\nالوحدة ",
    "\nالفصل ",
    "\nالدرس ",
    "\n",
    ". ",
    " ",
    "",
  ];

  function recursiveSplit(currentText: string, sepIndex: number): string[] {
    if (currentText.length <= chunkSize) {
      return [currentText];
    }
    if (sepIndex >= separators.length) {
      // Hard split
      const result: string[] = [];
      for (let i = 0; i < currentText.length; i += chunkSize - overlap) {
        result.push(currentText.slice(i, i + chunkSize));
      }
      return result;
    }

    const sep = separators[sepIndex];
    const parts = currentText.split(sep);
    const result: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const piece = currentChunk ? currentChunk + sep + part : part;

      if (piece.length <= chunkSize) {
        currentChunk = piece;
      } else {
        if (currentChunk) {
          result.push(currentChunk);
          currentChunk = "";
        }
        if (part.length > chunkSize) {
          const subSplits = recursiveSplit(part, sepIndex + 1);
          result.push(...subSplits);
        } else {
          currentChunk = part;
        }
      }
    }

    if (currentChunk) {
      result.push(currentChunk);
    }

    return result;
  }

  return recursiveSplit(text, 0);
}
