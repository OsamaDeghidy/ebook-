import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
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

  const instructionPrompt = `
You are the world-class Interactive Ebook Converter.
Generate a huge interactive ebook with 5 chapters based on the topic: "Quantum Physics".
Must be at least 2000 words.
`;

  console.log("Testing gemini-3.5-flash large generation...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: instructionPrompt,
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
