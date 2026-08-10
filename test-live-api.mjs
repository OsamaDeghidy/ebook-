import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("No API key found in .env");
  process.exit(1);
}

// 1. WebSocket Endpoint for Gemini Live API
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
console.log("Connecting to Gemini Live API...");

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log("Connected! Sending setup message...");
  // 2. Setup Message
  const setupMsg = {
    setup: {
      model: 'models/gemini-2.0-flash', // Use the multimodal live model
      generationConfig: {
        responseModalities: ["AUDIO"], // We want spoken audio response
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede" // Valid Gemini voices: Puck, Charon, Kore, Fenrir, Aoede
            }
          }
        }
      }
    }
  };
  ws.send(JSON.stringify(setupMsg));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.setupComplete) {
    console.log("Setup Complete! Sending test text prompt...");
    // 3. Send the actual query
    const clientContent = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text: "Hello! Can you speak to me and introduce yourself as a teacher?" }]
          }
        ],
        turnComplete: true
      }
    };
    ws.send(JSON.stringify(clientContent));
  } else if (msg.serverContent) {
    const modelTurn = msg.serverContent.modelTurn;
    if (modelTurn) {
      for (const part of modelTurn.parts) {
        if (part.inlineData) {
          console.log(`Received Audio Chunk! (Mime: ${part.inlineData.mimeType}, Size: ${part.inlineData.data.length} chars)`);
        }
        if (part.text) {
          console.log(`Received Text: ${part.text}`);
        }
      }
    }
    if (msg.serverContent.turnComplete) {
      console.log("Turn complete! The AI finished speaking.");
      ws.close();
    }
  } else {
    console.log("Received other message:", JSON.stringify(msg).substring(0, 100));
  }
});

ws.on('error', (err) => {
  console.error("WebSocket Error:", err);
});

ws.on('close', (code, reason) => {
  console.log("WebSocket Closed. Code:", code, "Reason:", reason.toString());
});
