import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
  const pdfPath = "C:/Users/Osama/.gemini/antigravity/brain/e501a45c-d994-4e30-a5bc-da55d112aa36/.user_uploaded/media__1785547458510.pdf";
  if (!fs.existsSync(pdfPath)) {
    console.error("PDF not found at", pdfPath);
    return;
  }
  
  const fileBuffer = fs.readFileSync(pdfPath);
  const fileBase64 = fileBuffer.toString('base64');
  console.log(`Loaded PDF, size: ${fileBuffer.length} bytes`);

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            summary: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  };

  try {
    console.log("Sending request to Gemini...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { inlineData: { mimeType: 'application/pdf', data: fileBase64 } },
        'قم بتحليل هذا الكتاب واستخرج عنواناً وفصولاً له.'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2
      }
    });
    console.log('✅ Success!');
    console.log(response.text.substring(0, 500) + '...');
  } catch(e) {
    console.error('❌ Error:', e.message);
    if (e.response) {
       console.error(e.response);
    }
  }
}
run();
