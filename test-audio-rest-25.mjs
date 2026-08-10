import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("No API key");
  process.exit(1);
}

async function testAudio() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [
      { parts: [{ text: "Hello! This is a test of the audio generation capabilities using the REST API." }] }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Aoede" }
        }
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.error) {
      console.error("Error from API:", data.error);
    } else {
      let foundAudio = false;
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData && p.inlineData.mimeType.startsWith("audio/")) {
          console.log("SUCCESS! Received audio blob of size:", p.inlineData.data.length);
          foundAudio = true;
        }
      }
      if (!foundAudio) {
        console.log("No audio found in response:", JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testAudio();
