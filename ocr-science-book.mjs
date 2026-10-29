import { pdf } from 'pdf-to-img';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const PDF_PATH = 'data/source-books/science_prep1_t1.pdf';
const OUTPUT_DIR = 'data/source-books';
const IMAGES_DIR = path.join(OUTPUT_DIR, 'science_pages');

// Read config
const envKeys = process.env.GEMINI_API_KEYS?.split(',').map(k => k.trim()) || [];
const allKeys = [GEMINI_KEY, ...envKeys].filter(Boolean);
console.log(`Loaded ${allKeys.length} Gemini API keys`);

const ai = new GoogleGenAI({ apiKey: allKeys[0] });

// Ensure images dir exists
fs.mkdirSync(IMAGES_DIR, { recursive: true });

async function main() {
  // Step 1: Convert PDF pages to images (first 20 pages for now)
  console.log('Converting PDF pages to images...');
  const document = await pdf(PDF_PATH, { scale: 1.5 });

  const pageImages = [];
  let pageNum = 0;
  for await (const image of document) {
    pageNum++;
    if (pageNum > 20) break; // First 20 pages only
    pageImages.push({ pageNum, buffer: Buffer.from(image) });
    console.log(`  Page ${pageNum}: ${(image.byteLength / 1024).toFixed(0)} KB`);
  }

  console.log(`\nConverted ${pageImages.length} pages. Now reading with Gemini Vision...\n`);

  // Step 2: Read each page with Gemini Vision
  let fullText = '';
  for (const { pageNum, buffer } of pageImages) {
    const base64 = buffer.toString('base64');
    console.log(`  Reading page ${pageNum}...`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: 'استخرج كل النص الموجود في هذه الصفحة من كتاب العلوم. حافظ على الترتيب والتنسيق. إذا وجدت عناوين أو جداول أو معادلات، صِغها بوضوح. لا تضف أي تعليق من عندك — بس النص الموجود في الصورة.' },
            { inlineData: { mimeType: 'image/png', data: base64 } }
          ]
        }],
        config: { temperature: 0.1 }
      });

      const text = response.text || '';
      fullText += `\n--- صفحة ${pageNum} ---\n${text}\n`;
      console.log(`    ✓ ${text.length} chars extracted`);
    } catch (e) {
      console.error(`    ✗ Failed: ${e.message}`);
      fullText += `\n--- صفحة ${pageNum} --- [فشل في القراءة]\n`;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  // Save full text
  const outputPath = path.join(OUTPUT_DIR, 'science_prep1_text.txt');
  fs.writeFileSync(outputPath, fullText);
  console.log(`\n✓ Full text saved to ${outputPath}`);
  console.log(`  Total: ${fullText.length} chars from ${pageImages.length} pages`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
