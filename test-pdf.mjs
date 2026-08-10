import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  // A tiny valid PDF base64 (1 page, empty)
  const dummyPdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjwwCiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMCA8PAogICAgICAgIC9UeXBlIC9Gb250CiAgICAgICAgL1N1YnR5cGUgL1R5cGUxCiAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1JdGFsaWMKICAgICAgPj4KICAgID4+CiAgPj4KICAvQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8IC9MZW5ndGggMjEgPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMCAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDE2NyAwMDAwMCBuIAowMDAwMDAwMzE0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA1CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjM4NQolJUVPRgo=";
  
  console.log("Testing gemini-3.5-flash with application/pdf inlineData...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: dummyPdfBase64
          }
        },
        "What is the text in this PDF?"
      ],
      config: {
        temperature: 0.2,
      }
    });
    console.log("✅ Success! Response:", response.text);
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

runTest();
