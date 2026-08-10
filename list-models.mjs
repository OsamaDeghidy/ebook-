import fetch from "node-fetch";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();
    console.log("Available models:");
    data.models.forEach(m => {
      if (m.name.includes("2.0") || m.name.includes("flash") || m.name.includes("live") || m.name.includes("bidi")) {
        console.log(m.name);
      }
    });
  } catch (e) {
    console.error(e);
  }
}
listModels();
