import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key found in .env");
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Testing gemini-2.5-flash...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, are you working?',
    });
    console.log("✅ Success! Response:", response.text);
  } catch (e) {
    console.error("❌ Error with gemini-2.5-flash:", e.message);
    
    console.log("\nTesting fallback to gemini-1.5-flash...");
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'Hello, are you working?',
      });
      console.log("✅ Success! Response:", response.text);
    } catch (err2) {
      console.error("❌ Error with gemini-1.5-flash:", err2.message);
    }
  }
}

runTest();
