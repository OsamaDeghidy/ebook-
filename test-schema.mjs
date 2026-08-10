import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  // Use test PDF from user upload if possible, else just text
  // Let's test with just the schema first
  const ebookResponseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            originalContent: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { concept: { type: Type.STRING }, explanation: { type: Type.STRING } },
                required: ["concept", "explanation"]
              }
            },
            summary: { type: Type.STRING },
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctOptionIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctOptionIndex", "explanation"]
              }
            },
            mindMap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  parentId: { type: Type.STRING, nullable: true },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "description"]
              }
            },
            videos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, url: { type: Type.STRING }, description: { type: Type.STRING } },
                required: ["title", "url", "description"]
              }
            }
          },
          required: ["title", "originalContent", "concepts", "summary", "content", "imagePrompt", "quiz", "mindMap", "videos"]
        }
      }
    },
    required: ["title", "description", "chapters"]
  };

  console.log("Testing gemini-3.5-flash with schema...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate a tiny test ebook about Photosynthesis.',
      config: {
        responseMimeType: "application/json",
        responseSchema: ebookResponseSchema,
        temperature: 0.2,
      }
    });
    console.log("✅ Success! Response length:", response.text.length);
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

runTest();
