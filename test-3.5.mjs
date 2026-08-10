import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Testing gemini-3.5-flash...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Hello, are you working?',
    });
    console.log("✅ Success! Response:", response.text);
  } catch (e) {
    console.error("❌ Error with gemini-3.5-flash:", e.message);
  }
}

runTest();
