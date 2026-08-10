import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Fetching available models...");
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      if (model.name.includes('flash') || model.name.includes('pro')) {
        console.log("-", model.name);
      }
    }
  } catch (e) {
    console.error("❌ Error fetching models:", e.message);
  }
}

runTest();
