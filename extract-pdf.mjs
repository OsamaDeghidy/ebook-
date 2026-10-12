import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';

const buffer = fs.readFileSync('data/source-books/science_prep1_t1.pdf');

const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
const text = result.text || '';

console.log('Pages:', result.pages?.length || 'unknown');
console.log('Text length:', text.length, 'chars');
console.log('--- First 1000 chars ---');
console.log(text.substring(0, 1000));
console.log('\n--- TOC (chars 1000-3000) ---');
console.log(text.substring(1000, 3000));
console.log('\n--- Last 500 chars ---');
console.log(text.substring(text.length - 500));

fs.writeFileSync('data/source-books/science_prep1_text.txt', text);
console.log('\nFull text saved. Size:', (text.length / 1024).toFixed(1), 'KB');

await parser.destroy();
