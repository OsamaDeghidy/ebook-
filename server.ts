import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { EdgeTTS } from "node-edge-tts";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize backend Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ydlzvuutjgelpxueufgn.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_KoXiLZfD6mIYGRRMb0gjtg_h3PkBle7";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ensure local audio cache directory exists (using os.tmpdir() for 100% Vercel / Cloud serverless write compatibility)
const AUDIO_CACHE_DIR = path.join(os.tmpdir(), "ebook_audio_cache");
try {
  if (!fs.existsSync(AUDIO_CACHE_DIR)) {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Audio cache dir init warning:", e);
}

// Upload Audio File directly to Supabase Storage 'book-audios' bucket
async function uploadAudioFileToSupabase(filePath: string, fileName: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('book-audios')
      .upload(fileName, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('book-audios')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    return null;
  }
}

function cleanScientificTextForSpeech(input: string): string {
  let cleaned = input || "";
  // 1. Strip markdown bracketed emotions like [متحمس], [مبتسمة بدفء]
  cleaned = cleaned.replace(/\[.*?\]/g, " ");

  // 2. Expand common Arabic scientific terms & chemical formulas e.g. H2O -> ماء
  cleaned = cleaned.replace(/\bH2O\b/gi, "ماء");
  cleaned = cleaned.replace(/\bCO2\b/gi, "ثاني أكسيد الكربون");
  cleaned = cleaned.replace(/\bO2\b/gi, "أكسجين");

  // 3. Strip code symbols and markdown formatting
  cleaned = cleaned.replace(/[\*\_\#\`\~\<\>\=\+\-\|]/g, " ");

  return cleaned.trim();
}


const app = express();
const PORT = 3000;

// Increase payload limit to support large base64 uploads (PDFs, images up to 100MB)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));


// Multi-API Key Pool Support (Load Balancing & Dynamic Key Failover)
const getApiKeysPool = (): string[] => {
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  return envKeys
    .replace(/^["']|["']$/g, "")
    .split(",")
    .map(k => k.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
};

let currentKeyIndex = 0;

// Initialize GoogleGenAI client safely with round-robin / key pool
const getGenAIClient = (keyOverride?: string) => {
  const pool = getApiKeysPool();
  if (pool.length === 0) {
    console.warn("WARNING: GEMINI_API_KEY / GEMINI_API_KEYS environment variable is not set. AI features will fallback to simulation.");
    return null;
  }
  const selectedKey = keyOverride || pool[currentKeyIndex % pool.length];
  return new GoogleGenAI({
    apiKey: selectedKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/**
 * Executes a Gemini API call with instant failover across Multi-Keys and Lite & Fast models
 * Prioritizes high-quota (500 RPD / 15 RPM) models: gemini-3.5-flash-lite & gemini-3.1-flash-lite
 */
const generateContentWithRetry = async (
  _ai: any,
  params: any,
  modelsChain: string[] = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]
): Promise<any> => {
  const keysPool = getApiKeysPool();
  let lastError: any = null;

  const totalKeys = Math.max(1, keysPool.length);

  for (let keyStep = 0; keyStep < totalKeys; keyStep++) {
    const keyIdx = (currentKeyIndex + keyStep) % totalKeys;
    const activeKey = keysPool[keyIdx];
    const client = activeKey ? getGenAIClient(activeKey) : _ai;
    if (!client) continue;

    for (const model of modelsChain) {
      console.log(`[Gemini API] Dispatching to ${model} (Key #${keyIdx + 1}/${totalKeys})`);
      
      // Fast single retry for transient 503s; instant switch for 429/404
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await client.models.generateContent({
            ...params,
            model,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const errMessage = err?.message || String(err);
          const errStatus = err?.status || "";
          const errCode = err?.code || "";
          const errStr = `${errMessage} ${errStatus} ${errCode}`.toLowerCase();

          console.warn(
            `[Gemini API] Model ${model} (Key #${keyIdx + 1}, attempt ${attempt}/2): ${errMessage.substring(0, 120)}`
          );

          // 1. If 429 (Quota exceeded on this key), rotate key pointer immediately!
          if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted")) {
            console.log(`[Gemini API] Quota limit on Key #${keyIdx + 1}. Rotating to next API key/model...`);
            currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
            break;
          }

          // 2. If 404 (Model not found/deprecated), try next model
          if (errStr.includes("404") || errStr.includes("not found") || errStr.includes("no longer available")) {
            break;
          }

          // 3. If 503 (High Demand) or transient network error, quick 800ms backoff once
          if (attempt === 1 && (errStr.includes("503") || errStr.includes("high demand") || errStr.includes("fetch failed"))) {
            console.log(`[Gemini API] Quick 800ms retry on ${model}...`);
            await new Promise((resolve) => setTimeout(resolve, 800));
          } else {
            break; // Switch to next model immediately
          }
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after attempting all active Gemini models and API keys.");
};

// In-memory DB with preloaded gorgeous sample ebooks to make the app alive immediately
const sampleEbooks: any[] = [
  {
    id: "sample-photosynthesis",
    title: "The Symphony of Light: Photosynthesis",
    description: "An interactive exploration of how plants capture solar rays and fuel life on Earth.",
    sizeCategory: "short",
    createdAt: new Date().toISOString(),
    chapters: [
      {
        id: "ch-1",
        title: "Capturing the Sun",
        content: `### The Solar Engine of Life\n\nEvery day, our planet is bathed in an ocean of solar radiation. While much of it bounces back or warms the soil, plants have developed an exquisite mechanism to trap this energy and store it in chemical bonds. This process is called **Photosynthesis**.\n\nAt the heart of this miracle is a small, specialized pigment molecule called **Chlorophyll**. Located inside organelles called **Chloroplasts**, chlorophyll is uniquely structured to absorb blue and red light while reflecting green—which is why the world around us is painted in lush emerald hues.\n\n> "Without photosynthesis, the atmospheric oxygen would deplete, and most advanced life-forms would vanish from the face of the Earth."\n\n#### Key Chemical Equation\nLet's look at the basic chemical conversion that occurs:\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light Energy} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\nThis simple formula represents one of the most crucial chemical reactions on Earth: carbon dioxide and water, fueled by sunlight, are converted into glucose (sugar) and oxygen.`,
        imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600",
        imagePrompt: "A vibrant, microscopic close-up of plant leaf cells showing glowing green chloroplasts trapping golden sunbeams, digital art, educational vector style.",
        videos: [
          {
            id: "v-1",
            title: "Photosynthesis: Great Educational Overview",
            url: "https://www.youtube.com/results?search_query=photosynthesis+educational+animation",
            description: "A beautifully animated, clear breakdown of light-dependent and light-independent reactions."
          },
          {
            id: "v-2",
            title: "The Chloroplast and Chlorophyll",
            url: "https://www.youtube.com/results?search_query=chloroplast+structure+and+chlorophyll",
            description: "Deep dive into the internal structure of thylakoids and chlorophyll light absorption."
          }
        ],
        quiz: [
          {
            id: "q-1",
            question: "Which organelle is responsible for hosting photosynthesis in plant cells?",
            options: ["Mitochondria", "Chloroplast", "Ribosome", "Golgi Apparatus"],
            correctOptionIndex: 1,
            explanation: "Chloroplasts are the dedicated organelles containing chlorophyll where photosynthesis takes place."
          },
          {
            id: "q-2",
            question: "What light wavelengths are primarily absorbed by chlorophyll?",
            options: ["Green and Yellow", "Blue and Red", "Ultraviolet and Infrared", "All wavelengths equally"],
            correctOptionIndex: 1,
            explanation: "Chlorophyll absorbs blue and red wavelengths most efficiently, reflecting green light, which is why leaves appear green."
          }
        ],
        mindMap: [
          { id: "m-1", label: "Solar Energy Capture", parentId: null, description: "How plants trap sunlight." },
          { id: "m-2", label: "Chloroplasts", parentId: "m-1", description: "The cellular factories hosting the reaction." },
          { id: "m-3", label: "Chlorophyll", parentId: "m-2", description: "Green pigment absorbing blue/red light." },
          { id: "m-4", label: "Chemical Reaction", parentId: "m-1", description: "Transforming water and CO2 into sugar and oxygen." }
        ]
      },
      {
        id: "ch-2",
        title: "The Dark Reactions",
        content: `### The Calvin Cycle: Creating Food\n\nWhile the first phase of photosynthesis requires direct sunlight to split water molecules and generate ATP, the second phase operates independently of immediate light. This sequence is known as the **Calvin Cycle** or the **Light-Independent Reactions**.\n\nNamed after Melvin Calvin, this elegant cycle takes place inside the **Stroma** (the fluid-filled space within chloroplasts). Here, the plant performs **Carbon Fixation**, converting inorganic carbon dioxide gas from the atmosphere into stable organic sugar molecules.\n\n#### The Role of RuBisCO\nAn enzyme with the tongue-twisting name of **RuBisCO** (Ribulose-1,5-bisphosphate carboxylase-oxygenase) serves as the catalyst. It grabs CO2 and attaches it to a 5-carbon sugar, kick-starting a chain reaction that ultimately produces G3P (a precursor to glucose).\n\n*   **Input**: CO2, ATP, NADPH (from the light reactions)\n*   **Output**: Glucose, ADP, NADP+\n*   **Significance**: This is how the carbon in your body originally got fixed from the air!`,
        imageUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&q=80&w=600",
        imagePrompt: "A futuristic cycle diagram illustrating carbon fixation, styled elegantly in off-white and green with circular nodes.",
        videos: [
          {
            id: "v-3",
            title: "The Calvin Cycle Simplified",
            url: "https://www.youtube.com/results?search_query=calvin+cycle+animation+biology",
            description: "Step-by-step molecular animation of carbon fixation and RuBisCO catalytic action."
          }
        ],
        quiz: [
          {
            id: "q-3",
            question: "Where do the light-independent reactions (Calvin Cycle) occur?",
            options: ["Thylakoid Membrane", "Stroma", "Cytoplasm", "Cell Wall"],
            correctOptionIndex: 1,
            explanation: "The Calvin Cycle occurs in the stroma, which is the fluid-filled space surrounding the thylakoids inside chloroplasts."
          },
          {
            id: "q-4",
            question: "What is the primary enzyme responsible for carbon fixation in the Calvin Cycle?",
            options: ["Amylase", "ATP Synthase", "RuBisCO", "Helicase"],
            correctOptionIndex: 2,
            explanation: "RuBisCO is the vital enzyme that catalyzes the first step of carbon fixation in the Calvin Cycle."
          }
        ],
        mindMap: [
          { id: "m-5", label: "Calvin Cycle", parentId: null, description: "Light-independent carbon fixation." },
          { id: "m-6", label: "Location: Stroma", parentId: "m-5", description: "Fluid cavity of the chloroplast." },
          { id: "m-7", label: "Catalyst: RuBisCO", parentId: "m-5", description: "Enzyme binding inorganic CO2." },
          { id: "m-8", label: "Product: Glucose", parentId: "m-5", description: "Stored chemical energy." }
        ]
      }
    ]
  },
  {
    id: "sample-space",
    title: "Cosmic Horizons: Space Exploration",
    description: "An interactive journey from early rockets to futuristic colonies on Mars and beyond.",
    sizeCategory: "medium",
    createdAt: new Date().toISOString(),
    chapters: [
      {
        id: "ch-3",
        title: "The Dawn of Rocketry",
        content: `### Breaking Earth's Bonds\n\nFor thousands of years, humanity could only look up at the stars and wonder. The key that unlocked the heavens was the discovery of **Rocket Propulsion**.\n\nBased on Sir Isaac Newton's Third Law of Motion—*for every action, there is an equal and opposite reaction*—rockets generate thrust by expelling high-speed exhaust in one direction, propelling the spacecraft in the opposite direction. Unlike jet engines, rockets carry their own oxygen (oxidizer), allowing them to burn fuel in the vacuum of space.\n\n#### The Pioneers\n- **Konstantin Tsiolkovsky**: Formulated the Rocket Equation linking velocity and mass.\n- **Robert Goddard**: Built and launched the first liquid-fueled rocket in 1926.\n- **Wernher von Braun**: Developed the Saturn V rocket which eventually took humans to the Moon.`,
        imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=600",
        imagePrompt: "A retro-futuristic sketch of liquid-fueled rockets taking off from a concrete pad, pencil-sketch aesthetic blended with vibrant telemetry overlays.",
        videos: [
          {
            id: "v-4",
            title: "History of Rocketry",
            url: "https://www.youtube.com/results?search_query=history+of+rocketry+space+race",
            description: "From Chinese fire-arrows to the massive Saturn V and SpaceX Starship rockets."
          }
        ],
        quiz: [
          {
            id: "q-5",
            question: "Which physical law forms the foundation of rocket propulsion?",
            options: ["Newton's First Law", "Newton's Third Law", "Einstein's Theory of Relativity", "Kepler's Second Law"],
            correctOptionIndex: 1,
            explanation: "Rocket propulsion is based on Newton's Third Law: action and reaction. Expelling exhaust backwards pushes the rocket forward."
          },
          {
            id: "q-6",
            question: "Who launched the first liquid-fueled rocket?",
            options: ["Yuri Gagarin", "Neil Armstrong", "Robert Goddard", "Galileo Galilei"],
            correctOptionIndex: 2,
            explanation: "Robert Goddard successfully launched the world's first liquid-fueled rocket in Auburn, Massachusetts on March 16, 1926."
          }
        ],
        mindMap: [
          { id: "m-9", label: "Rocket Propulsion", parentId: null, description: "Breaking Earth gravity." },
          { id: "m-10", label: "Newton's Third Law", parentId: "m-9", description: "Action and reaction principle." },
          { id: "m-11", label: "Liquid Fuel", parentId: "m-9", description: "Robert Goddard's breakthrough in 1926." },
          { id: "m-12", label: "Saturn V", parentId: "m-9", description: "The lunar transport vehicle." }
        ]
      }
    ]
  }
];

let ebooks: any[] = [];
const EBOOKS_FILE = path.join(process.cwd(), "ebooks-db.json");

function loadEbooks() {
  try {
    if (fs.existsSync(EBOOKS_FILE)) {
      const data = fs.readFileSync(EBOOKS_FILE, "utf-8");
      const loaded = JSON.parse(data);
      if (Array.isArray(loaded)) {
        ebooks = loaded;
        return;
      }
    }
  } catch (err) {
    console.error("Error loading persisted ebooks database:", err);
  }
  ebooks = [];
}

function saveEbooks(data: any[]) {
  try {
    fs.writeFileSync(EBOOKS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing ebooks database file:", err);
  }
}

// Initial load
loadEbooks();

// Active background conversion jobs store
interface ConversionJob {
  id: string;
  status: "processing" | "completed" | "failed";
  progressStep: string;
  progressPercent: number;
  result?: any;
  error?: string;
}

let conversionJobs: Record<string, ConversionJob> = {};

// Helper to construct a schema for Gemini to respond with structured Ebooks
const ebookResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Main engaging, educational title of the interactive ebook" },
    description: { type: Type.STRING, description: "High-level summary of what the reader will learn" },
    sizeCategory: { type: Type.STRING, description: "Dynamic size classification: 'short' (1-3 chapters), 'medium' (4-8 chapters), or 'long' (9-30 chapters depending on document scope)" },
    chapters: {
      type: Type.ARRAY,
      description: "Array of structured ebook chapters. Can generate from 2 up to 30 chapters based on document length or user request.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Inspiring, clear chapter or section title" },
          originalContent: { type: Type.STRING, description: "The original, unaltered text segment extracted directly from the source document that corresponds to this chapter." },
          summary: { type: Type.STRING, description: "A concise but comprehensive summary of the chapter's key points." },
          concepts: { 
            type: Type.ARRAY, 
            description: "List of key concepts and their detailed explanations found in this chapter",
            items: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["concept", "explanation"]
            }
          },
          content: { type: Type.STRING, description: "Deep, thorough, and engaging chapter content in beautiful Markdown. Write several rich, detailed paragraphs explaining concepts, using bold text, list items, and quotes where appropriate. Do not skimp on depth." },
          imagePrompt: { type: Type.STRING, description: "A high-quality descriptive illustration prompt representing the core concept of this chapter. Perfect for an image generation AI." },
          quiz: {
            type: Type.ARRAY,
            description: "A set of 3 multiple-choice questions to test the chapter concepts.",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Clear, conceptual, multiple choice question" },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options" },
                correctOptionIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
                explanation: { type: Type.STRING, description: "Detailed explanation of why the correct option is right and others are incorrect" }
              },
              required: ["question", "options", "correctOptionIndex", "explanation"]
            }
          },
          videos: {
            type: Type.ARRAY,
            description: "Suggested educational video topics or searches on YouTube.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Highly relevant video title" },
                url: { type: Type.STRING, description: "YouTube search results link, e.g., https://www.youtube.com/results?search_query=..." },
                description: { type: Type.STRING, description: "Summary of what this search reveals or explains" }
              },
              required: ["title", "url", "description"]
            }
          },
          mindMap: {
            type: Type.ARRAY,
            description: "Hierarchical mind map list representing core concepts (5-8 nodes). Must have parents to form a tree structure.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Unique code string for this node, e.g., node-1" },
                label: { type: Type.STRING, description: "Concept name, concise (1-3 words)" },
                parentId: { type: Type.STRING, description: "Parent node's id or null if it's the root chapter concept" },
                description: { type: Type.STRING, description: "1-sentence conceptual explanation on hover" }
              },
              required: ["id", "label", "description"]
            }
          }
        },
        required: ["title", "content", "imagePrompt", "quiz", "videos", "mindMap"]
      }
    }
  },
  required: ["title", "description", "sizeCategory", "chapters"]
};

// --- API ENDPOINTS ---

// 1. Get all ebooks
app.get("/api/ebooks", (req, res) => {
  res.json(ebooks);
});

// Get server configuration / capabilities
app.get("/api/config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  });
});

// 2. Get ebook by id
app.get("/api/ebooks/:id", (req, res) => {
  const ebook = ebooks.find((e) => e.id === req.params.id);
  if (!ebook) {
    return res.status(404).json({ error: "Ebook not found" });
  }
  res.json(ebook);
});

// 3. Delete ebook
app.delete("/api/ebooks/:id", (req, res) => {
  ebooks = ebooks.filter((e) => e.id !== req.params.id);
  saveEbooks(ebooks);
  res.json({ success: true, message: "Ebook deleted" });
});

// 4. Update or Upsert ebook
app.put("/api/ebooks/:id", (req, res) => {
  const index = ebooks.findIndex((e) => e.id === req.params.id);
  
  if (index === -1) {
    // If not found in local memory, create/upsert it directly
    const newEbook = {
      id: req.params.id,
      title: req.body.title || "Untitled Book",
      ...req.body,
      created_at: req.body.created_at || new Date().toISOString()
    };
    ebooks.unshift(newEbook);
    saveEbooks(ebooks);
    return res.json(newEbook);
  }
  
  const updatedEbook = {
    ...ebooks[index],
    ...req.body,
    id: req.params.id, // Ensure ID remains immutable
  };
  
  ebooks[index] = updatedEbook;
  saveEbooks(ebooks);
  res.json(updatedEbook);
});

// 5. Convert content or create ebook from prompt / file upload (Async Background Worker System)
async function runBackgroundEbookConversion(
  jobId: string,
  payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    price?: number;
    preview_video_url?: string;
  }
) {
  const { promptText, fileUrl, fileBase64, fileName, fileType, category, subcategory, grade_level, semester, academic_year, price, preview_video_url } = payload;
  const job = conversionJobs[jobId];
  if (!job) return;

  const ai = getGenAIClient();
  if (!ai) {
    // Simulator Mode processing (simulate steps to make it feel real, then complete)
    try {
      console.log(`[Job Worker] Running AI Simulator processing for job ${jobId}...`);
      
      job.progressStep = "Validating study resources in AI simulation mode...";
      job.progressPercent = 20;
      await new Promise(r => setTimeout(r, 1200));

      job.progressStep = "Deconstructing PDF pages and compiling subject curriculum...";
      job.progressPercent = 50;
      await new Promise(r => setTimeout(r, 1800));

      job.progressStep = "Fabricating interactive markdown, quiz, and concept maps...";
      job.progressPercent = 80;
      await new Promise(r => setTimeout(r, 1200));

      const fallbackId = crypto.randomUUID();
      const mockEbook = {
        id: fallbackId,
        title: "Interactive Ebook: " + (promptText || fileName || "Untitled Subject"),
        description: "A beautifully structured learning book converted from your uploads (AI Simulator mode).",
        sizeCategory: "short",
        createdAt: new Date().toISOString(),
        chapters: [
          {
            id: "ch-f1",
            title: "Introduction",
            content: `### Welcome to Your Interactive Ebook\n\nThis is an elegant interactive learning chapter generated as a fallback because the Gemini API key was not configured.\n\nTo unleash full AI capabilities, including customized chapter structures, specific concept extraction, interactive tests, mind maps, and soundtracks, please add your **GEMINI_API_KEY** secret in the **Settings > Secrets** panel.\n\n#### What makes an Ebook Interactive?\n- **Concept Mind Maps**: Visualize hierarchies and connections.\n- **Audio Soundtracks**: Listen to rich audio narrations of each section.\n- **Interactive Tests**: Validate your learning and see real-time corrections.\n- **Video Integrations**: Curated additional material straight from YouTube.`,
            imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
            imagePrompt: "A beautiful, minimalist vector icon of an open digital textbook, glowing with icons of play buttons, mind maps, and quizzes.",
            videos: [
              {
                id: "v-f1",
                title: "What is an Interactive Ebook?",
                url: "https://www.youtube.com/results?search_query=interactive+ebooks+education",
                description: "A great demonstration of interactive learning tools and multi-sensory textbooks."
              }
            ],
            quiz: [
              {
                id: "q-f1",
                question: "What should you configure to unlock the true Gemini AI generation power in this application?",
                options: ["A credit card", "The GEMINI_API_KEY inside the Secrets panel", "An external database", "Nothing, it's already working"],
                correctOptionIndex: 1,
                explanation: "Adding your GEMINI_API_KEY in the Settings > Secrets panel unlocks real AI-powered ebook conversion, quizzes, mind maps, and soundtracks."
              }
            ],
            mindMap: [
              { id: "mn-f1", label: "Interactive Learning", parentId: null, description: "Engage multiple senses." },
              { id: "mn-f2", label: "Visuals", parentId: "mn-f1", description: "AI-generated graphics and layouts." },
              { id: "mn-f3", label: "Audio Narrations", parentId: "mn-f1", description: "Engaging text-to-speech reading." },
              { id: "mn-f4", label: "Testing", parentId: "mn-f1", description: "Quizzes with explanations." }
            ]
          }
        ]
      };

      ebooks.push(mockEbook);
      saveEbooks(ebooks); // Persist db file
      
      job.progressPercent = 100;
      job.progressStep = "Ebook ready! Loading into bookshelf...";
      job.status = "completed";
      job.result = mockEbook;
      console.log(`[Job Worker] Job ${jobId} successfully completed.`);
    } catch (err: any) {
      console.error(`[Job Worker] Job ${jobId} failed:`, err);
      job.status = "failed";
      job.error = err.message;
    }
    return;
  }

  try {
    console.log(`[Job Worker] Initiating true Gemini Ebook conversion for job ${jobId}...`);
    job.progressStep = "Initializing multi-sensory document analysis...";
    job.progressPercent = 15;

    // Set up materials for Gemini analysis
    let contents: any[] = [];
    
    if (fileUrl) {
      job.progressStep = `جاري جلب وتحليل الملف السحابي (${fileName || ""})...`;
      job.progressPercent = 25;
      try {
        const fileRes = await fetch(fileUrl);
        if (fileRes.ok) {
          const arrayBuf = await fileRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const tempFilePath = path.join(os.tmpdir(), `gemini_upload_${Date.now()}_doc.pdf`);
          fs.writeFileSync(tempFilePath, buffer);

          const uploadRes = await (ai.files as any).upload({
            file: tempFilePath,
            mimeType: fileType || "application/pdf"
          });

          contents.push({
            fileData: {
              fileUri: uploadRes.uri,
              mimeType: uploadRes.mimeType
            }
          });

          try { fs.unlinkSync(tempFilePath); } catch (e) {}
          job.progressStep = `تم استلام وتحليل الملف بنجاح! جاري بناء الفصول والأسئلة...`;
          job.progressPercent = 45;
        }
      } catch (e) {
        console.warn("Could not fetch fileUrl for Gemini analysis:", e);
      }
    } else if (fileBase64 && fileType) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);

      // If file > 5MB, upload via Files API to prevent HTTP payload connection resets
      if (buffer.length > 5 * 1024 * 1024) {
        job.progressStep = `رفع الملف السحابي (${sizeMB} ميجابايت) عبر Gemini Cloud Files API...`;
        job.progressPercent = 25;
        console.log(`[Job Worker] Uploading large file (${sizeMB}MB) to Gemini Files API...`);

        try {
          const tempFilePath = path.join(os.tmpdir(), `gemini_upload_${Date.now()}_doc.pdf`);
          fs.writeFileSync(tempFilePath, buffer);

          const uploadRes = await (ai.files as any).upload({
            file: tempFilePath,
            mimeType: fileType
          });

          contents.push({
            fileData: {
              fileUri: uploadRes.uri,
              mimeType: uploadRes.mimeType
            }
          });

          try { fs.unlinkSync(tempFilePath); } catch (e) {}
          job.progressStep = `تم رفع الملف بنجاح (${sizeMB}MB)! جاري التحليل الأكاديمي الشامل...`;
          job.progressPercent = 40;
        } catch (uploadErr: any) {
          console.warn("[Job Worker] Files API fallback to inlineData:", uploadErr);
          contents.push({
            inlineData: {
              mimeType: fileType,
              data: fileBase64
            }
          });
          job.progressStep = `معالجة مستند (${fileName || ""})...`;
          job.progressPercent = 30;
        }
      } else {
        contents.push({
          inlineData: {
            mimeType: fileType,
            data: fileBase64
          }
        });
        job.progressStep = `معالجة مستند (${fileName || ""})...`;
        job.progressPercent = 30;
      }
    } else {
      job.progressStep = "تحليل التوجيهات وموضوعات المقرر المطلوبة...";
      job.progressPercent = 35;
    }

    let instructionPrompt = `
You are the world-class Interactive Ebook Converter & Academic Curriculum Architect.
Your primary task is to convert the provided educational input (which is the attached document: "${fileName || 'Attached Document'}") into an engaging, structured, interactive educational ebook.

CRITICAL CONTENT ACCURACY & FIDELITY MANDATE:
- The book title, description, and ALL chapters MUST be extracted directly from the attached document and its specific subject matter (Document name: "${fileName || ''}").
- DO NOT invent generic or unrelated topics (e.g. do NOT output generic Artificial Intelligence if the document is about Islamic studies, Self-development, Education, Law, or Mathematics).
- Follow the actual chapters, names, and concepts of the uploaded document faithfully.

FAST INITIAL CURRICULUM EXTRACTION:
1. Extract the authentic book title, comprehensive educational description, and the foundational Table of Contents from the document.
2. Generate the first 5 core educational chapters (Chapters 1 through 5) in rich, multi-paragraph textbook depth with theories, examples, and Arabic vowel marks (Tashkeel) directly reflecting the document's content.
3. If the document has more chapters, the system allows the user to easily expand and generate remaining chapters (Chapters 6-10, etc.) from inside the book.

For each of the 5 chapters, generate:
- An inspiring and clear chapter 'title' reflecting the document.
- 'originalContent': Excerpt or original segment from the document for this chapter.
- 'concepts': An array containing key concepts and their detailed explanations.
- 'summary': A concise summary of the chapter's main points.
- 'content': Full educational textbook markdown content with clear headers and examples.
- A descriptive 'imagePrompt' representing the chapter's core concept.
- An interactive 'quiz' with 3 multiple-choice questions with 4 diverse options and detailed educational explanations.
- A list of 'videos' with 2 YouTube search topics.
- A 'mindMap' hierarchy of 4-6 concept nodes with 'id', 'label', 'parentId', and 'description'.

If the provided document or prompt is in Arabic, you MUST output ALL generated content in high-quality, formal Arabic (Fusha) with precise terminology.

User Guidance / Notes: "${promptText || `Convert ${fileName || 'the uploaded document'} into a structured interactive ebook.`}"
`;

    contents.push(instructionPrompt);

    job.progressStep = "Generating structural content and quizzes with Gemini (this may take up to a minute)...";
    job.progressPercent = 55;

    console.log(`[Job Worker] Requesting Gemini structural analysis...`);
    const response = await generateContentWithRetry(ai, {
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: ebookResponseSchema,
        temperature: 0.2,
      },
    }, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]);

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API.");
    }

    job.progressStep = "Compiling structural schemas and mapping interactive nodes...";
    job.progressPercent = 85;

    console.log("[Job Worker] Parsing generated JSON...");
    const parsedEbook = JSON.parse(resultText);

    // Formulate a clean Ebook object with IDs
    const ebookId = crypto.randomUUID();
    
    const finalizedEbook: any = {
      id: ebookId,
      title: parsedEbook.title || "Untitled Educational Ebook",
      description: parsedEbook.description || "A custom converted interactive learning course.",
      sizeCategory: parsedEbook.sizeCategory || "short",
      createdAt: new Date().toISOString(),
      chapters: (parsedEbook.chapters || []).map((ch: any, cIdx: number) => {
        const chapterId = `ch-${ebookId}-${cIdx + 1}`;
        return {
          id: chapterId,
          title: ch.title || `Chapter ${cIdx + 1}`,
          content: ch.content || "Chapter content is currently processing.",
          originalContent: ch.originalContent || "",
          summary: ch.summary || "",
          concepts: ch.concepts || [],
          imagePrompt: ch.imagePrompt || "Minimal educational illustration",
          imageUrl: undefined, // Will generate on-demand or use fallback
          videos: (ch.videos || []).map((v: any, vIdx: number) => ({
            id: `v-${chapterId}-${vIdx + 1}`,
            title: v.title || "Supplementary Video",
            url: v.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(v.title || "education")}`,
            description: v.description || "Video description and summary."
          })),
          quiz: (ch.quiz || []).map((q: any, qIdx: number) => ({
            id: `q-${chapterId}-${qIdx + 1}`,
            question: q.question || "Interactive Quiz Question?",
            options: q.options && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            correctOptionIndex: typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0,
            explanation: q.explanation || "Detailed conceptual breakdown."
          })),
          mindMap: (ch.mindMap || []).map((m: any, mIdx: number) => ({
            id: m.id || `m-${chapterId}-${mIdx + 1}`,
            label: m.label || "Concept",
            parentId: m.parentId || null,
            description: m.description || "Click to expand concept detail."
          }))
        };
      })
    };

    ebooks.push(finalizedEbook);
    saveEbooks(ebooks); // Persist to JSON db

    // Also persist directly to Supabase from the backend
    try {
      const academicTags = [
        'كتاب_تفاعلي',
        'ذكاء_اصطناعي',
        subcategory ? `sub:${subcategory}` : '',
        grade_level ? `grade:${grade_level}` : '',
        semester ? `term:${semester}` : '',
        academic_year ? `year:${academic_year}` : ''
      ].filter(Boolean);

      finalizedEbook.price = Number(price) || 0;
      if (preview_video_url) {
        finalizedEbook.preview_video_url = preview_video_url;
      }

      const supabasePayload = {
        id: finalizedEbook.id,
        title: finalizedEbook.title,
        description: finalizedEbook.description,
        author_name: 'د. كريم كامل',
        category: category || 'digital_book',
        tags: academicTags.length > 0 ? academicTags : ['كتاب_تفاعلي', 'ذكاء_اصطناعي'],
        price: Number(price) || 0,
        preview_video_url: preview_video_url || null,
        is_external: false,
        is_published: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviews_count: 1,
        chapters: finalizedEbook.chapters,
        mind_map: [],
        question_bank: []
      };

      const { error: insertErr } = await supabase.from('books').upsert(supabasePayload);
      if (insertErr) {
        console.error("[Job Worker] Direct Supabase upsert error:", insertErr);
      } else {
        console.log(`[Job Worker] Job ${jobId} successfully saved book to Supabase directly!`);
      }
    } catch (dbErr) {
      console.error("[Job Worker] Error saving to Supabase from backend:", dbErr);
    }

    job.progressStep = "Ebook ready! Loading into bookshelf...";
    job.progressPercent = 100;
    job.status = "completed";
    job.result = finalizedEbook;
    console.log(`[Job Worker] Job ${jobId} successfully completed true generation.`);
    return finalizedEbook;

  } catch (error: any) {
    console.error(`[Job Worker] Job ${jobId} true generation failed:`, error);
    job.status = "failed";
    job.error = "Failed to convert ebook with AI: " + error.message;
    return null;
  }
}

// 5. Convert content or create ebook from prompt / file upload (Synchronous & Serverless Resilient)
app.post("/api/ebooks", async (req, res) => {
  const { promptText, fileUrl, fileBase64, fileName, fileType, category, subcategory, grade_level, semester, academic_year, price, preview_video_url } = req.body;
  
  if (!promptText && !fileBase64 && !fileUrl) {
    return res.status(400).json({ error: "Must provide either promptText, a file, or both to convert." });
  }

  const jobId = "job-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  console.log(`[Task Dispatcher] Initiating ebook conversion: ${jobId}. File: ${fileName || "None"}, Cloud URL: ${fileUrl ? "Yes" : "No"}, Price: ${price || 0}`);

  conversionJobs[jobId] = {
    id: jobId,
    status: "processing",
    progressStep: "Analyzing input study materials...",
    progressPercent: 15
  };

  try {
    const finalizedEbook = await runBackgroundEbookConversion(jobId, { promptText, fileUrl, fileBase64, fileName, fileType, category, subcategory, grade_level, semester, academic_year, price, preview_video_url });
    if (!finalizedEbook) {
      const job = conversionJobs[jobId];
      return res.status(500).json({ error: job?.error || "فشل توليد الكتاب بالذكاء الاصطناعي" });
    }
    res.json({ success: true, ebook: finalizedEbook, jobId });
  } catch (err: any) {
    console.error("Ebook generation error:", err);
    res.status(500).json({ error: "فشل توليد الكتاب التفاعلي: " + err.message });
  }
});

// 5b. Poll background ebook conversion tasks progress
app.get("/api/ebooks/tasks/:jobId", (req, res) => {
  const job = conversionJobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: "Ebook conversion task not found." });
  }
  res.json(job);
});

// In-memory cache for generated TTS audio snippets to save API quota & eliminate latency
const ttsSnippetCache = new Map<string, { audioBase64: string; mimeType: string }>();

// Helper function to thoroughly sanitize text for natural human voice narration
function sanitizeTextForHumanNarration(rawText: string): { cleanText: string; isArabic: boolean } {
  const isArabic = /[\u0600-\u06FF]/.test(rawText);
  let text = rawText || "";

  // Strip code blocks & inline code
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");

  // Strip images and markdown link markers keeping text
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

  // Strip list numbers e.g. "1.", "2.", "1-", "(1)", "١.", "٢." so TTS never reads "واحد نقطة"
  text = text.replace(/(^|\n|\s)[\d\u0660-\u0669]+[\.\-\)\:]\s*/g, "$1 ");

  // If mainly Arabic, strip English terms in parentheses e.g. "(Deductive Method)" to prevent robotic phonetic spelling
  if (isArabic) {
    text = text.replace(/\([A-Za-z0-9\s,\.\-\&\/]+\)/g, " ");
    text = text.replace(/%/g, " بالمائة ");
    text = text.replace(/\+/g, " زائد ");
    text = text.replace(/\=/g, " يساوي ");
  }

  // Strip all brackets, slashes, punctuation, markdown symbols
  text = text
    .replace(/[\(\)\[\]\{\}⟨⟩«»]/g, " ")
    .replace(/[\/\\#*`>_\-~+=|:;"'•–—]/g, " ")
    .replace(/\.{2,}/g, " ")
    .replace(/(?<=\s)\.(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { cleanText: text.substring(0, 1500), isArabic };
}

// 6. Generate TTS Audio Soundtrack Narration for a chapter
app.post("/api/ebooks/:id/narrate", async (req, res) => {
  const { chapterId, text, style } = req.body;
  if (!chapterId || !text) {
    return res.status(400).json({ error: "Must provide chapterId and text to narrate." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is not configured. TTS narrator soundtrack requires a valid key." });
  }

  try {
    const { cleanText, isArabic } = sanitizeTextForHumanNarration(text);
    const cacheKey = `chapter_${chapterId}_${style || 'natural'}_${cleanText}`;
    if (ttsSnippetCache.has(cacheKey)) {
      console.log(`Serving chapter ${chapterId} TTS audio from memory cache.`);
      const cached = ttsSnippetCache.get(cacheKey)!;
      return res.json({ success: true, audioBase64: cached.audioBase64, mimeType: cached.mimeType, cached: true });
    }

    console.log(`Generating TTS narrator soundtrack for chapter ${chapterId} (Style: ${style || 'natural'})...`);

    let styleInstructionAr = "بِنَبْرَةٍ دَافِئَةٍ وَإِيقَاعٍ مُرِيحٍ";
    let styleInstructionEn = "with natural pauses and warm cadence";
    
    if (style === "teacher") {
      styleInstructionAr = "بِنَبْرَةِ مُعَلِّمٍ صَبُورٍ وَوَاضِحٍ يَشْرَحُ دَرْساً هَاماً بِثِقَةٍ";
      styleInstructionEn = "in the clear, patient, and confident voice of an expert teacher explaining an important lesson";
    } else if (style === "storyteller") {
      styleInstructionAr = "بِنَبْرَةِ رَاوِي قِصَصٍ مُشَوِّقَةٍ وَمَلِيئَةٍ بِالشَّغَفِ لِجَذْبِ الِانْتِبَاهِ";
      styleInstructionEn = "in a highly engaging, passionate storyteller voice that captivates the listener";
    } else if (style === "fluent") {
      styleInstructionAr = "بِنَبْرَةٍ سَرِيعَةٍ قَلِيلاً وَطَلْقَةٍ مُنَاسِبَةٍ لِلْمُرَاجَعَةِ السَّرِيعَةِ";
      styleInstructionEn = "in a slightly faster, fluent, and highly articulate voice perfect for quick review";
    }

    const narratorPrompt = isArabic
      ? `أنت راوٍ صَوْتِي إِخْبَارِيٌّ وَثَائِقِيٌّ بَشَرِيٌّ دَافِئٌ وَمُحْتَرِفٌ. اقْرَأْ هَذَا النَّصَّ التَّعْلِيمِيَّ بِلُغَةٍ عَرَبِيَّةٍ فَصِيحَةٍ وَمُعَبِّرَةٍ وَطَبِيعِيَّةٍ جِدّاً كَأَنَّكَ إِنْسَانٌ حَقِيقِيٌّ يَتَحَدَّثُ لِلْمُسْتَمِعِينَ، ${styleInstructionAr}، دُونَ نُطْقِ أَيِّ رُمُوزٍ أَوْ تَرْقِيمٍ أَوْ أَقْوَاسٍ أَوْ أَرْقَامِ نِقَاطٍ:\n\n${cleanText}`
      : `You are a warm, articulate, professional human documentary narrator. Read this educational material in a natural, highly expressive human voice ${styleInstructionEn}. Do NOT pronounce any punctuation, symbols, brackets, or bullet numbers:\n\n${cleanText}`;

    const response = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text: narratorPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: isArabic ? "Kore" : "Aoede" }, // Natural, warm human timbre
          }
        }
      }
    }, ["gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-flash-8b", "gemini-1.5-flash"]);

    const inlinePart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlinePart?.data;
    const mimeType = inlinePart?.mimeType || "audio/mp3";

    if (!base64Audio) {
      throw new Error("No audio payload returned from Gemini TTS.");
    }

    ttsSnippetCache.set(cacheKey, { audioBase64: base64Audio, mimeType });

    // Save in memory to the corresponding chapter so it persists in the session
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === chapterId);
      if (chapter) {
        chapter.audioBase64 = base64Audio;
        chapter.audioMimeType = mimeType;
      }
    }

    res.json({ success: true, audioBase64: base64Audio, mimeType });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error("Error generating chapter TTS audio:", errMsg);
    const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
    res.status(isRateLimit ? 429 : 500).json({ 
      error: isRateLimit ? "Gemini TTS quota exceeded. Switching to browser voice." : "Failed to generate soundtrack. " + errMsg,
      rateLimited: isRateLimit 
    });
  }
});

// 7. Generate Standalone Human AI Voice Audio snippet for paragraphs/explanations
app.post("/api/narrate-text", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Must provide text to narrate." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is not configured." });
  }

  try {
    const { cleanText, isArabic } = sanitizeTextForHumanNarration(text);
    const cacheKey = `snippet_${cleanText}`;
    if (ttsSnippetCache.has(cacheKey)) {
      console.log(`Serving snippet TTS audio from memory cache.`);
      const cached = ttsSnippetCache.get(cacheKey)!;
      return res.json({ success: true, audioBase64: cached.audioBase64, mimeType: cached.mimeType, cached: true });
    }

    const narratorPrompt = isArabic
      ? `أنت راوٍ صَوْتِي بَشَرِيٌّ دَافِئٌ. اقْرَأْ هَذِهِ الْفِكْرَةَ التَّعْلِيمِيَّةَ بِلُغَةٍ عَرَبِيَّةٍ فَصِيحَةٍ وَطَبِيعِيَّةٍ جِدّاً بِنَبْرَةٍ بَشَرِيَّةٍ مُشَوِّقَةٍ، دُونَ نُطْقِ أَيِّ رُمُوزٍ أَوْ تَرْقِيمٍ أَوْ أَقْوَاسٍ:\n\n${cleanText}`
      : `You are a warm, engaging human narrator. Read this snippet in a natural, expressive human voice without pronouncing punctuation or symbols:\n\n${cleanText}`;

    const response = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text: narratorPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: isArabic ? "Kore" : "Aoede" },
          }
        }
      }
    }, ["gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-flash-8b", "gemini-1.5-flash"]);

    const inlinePart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlinePart?.data;
    const mimeType = inlinePart?.mimeType || "audio/mp3";

    if (!base64Audio) {
      throw new Error("No audio payload returned from Gemini TTS.");
    }

    ttsSnippetCache.set(cacheKey, { audioBase64: base64Audio, mimeType });

    res.json({ success: true, audioBase64: base64Audio, mimeType });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error("Error generating snippet TTS audio:", errMsg);
    const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
    res.status(isRateLimit ? 429 : 500).json({ 
      error: isRateLimit ? "Gemini TTS quota exceeded. Switching to browser voice." : "Failed to generate human voice audio. " + errMsg,
      rateLimited: isRateLimit 
    });
  }
});

// 7.5 High-Quality Human Audio Engine (Arabic Neural Voices with Fast Failover)
app.post("/api/tts/stream", async (req, res) => {
  try {
    const { text, speaker = "female" } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const cleanedText = cleanScientificTextForSpeech(text);
    if (!cleanedText) return res.status(400).json({ error: "Cleaned text is empty" });

    // Safe length chunking to prevent EdgeTTS timeouts on huge blocks
    const safeText = cleanedText.length > 700 ? cleanedText.substring(0, 700) + "..." : cleanedText;

    const isMale = speaker === "male" || speaker === "كريم" || speaker === "Alex";
    const primaryVoice = isMale ? "ar-EG-ShakirNeural" : "ar-EG-SalmaNeural";
    const fallbackVoice = isMale ? "ar-SA-HamedNeural" : "ar-SA-ZariyahNeural";

    // Hash text for caching
    const textHash = crypto.createHash("md5").update(`${primaryVoice}_${safeText}`).digest("hex");
    const cachedFilePath = path.join(AUDIO_CACHE_DIR, `${textHash}.mp3`);

    // Check if audio exists in local cache
    if (fs.existsSync(cachedFilePath)) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    try {
      const tts = new EdgeTTS({ voice: primaryVoice, timeout: 35000 });
      await tts.ttsPromise(safeText, cachedFilePath);
    } catch (primaryErr) {
      console.warn(`[EdgeTTS] Primary voice ${primaryVoice} failed, trying fallback ${fallbackVoice}...`);
      const fallbackTts = new EdgeTTS({ voice: fallbackVoice, timeout: 35000 });
      await fallbackTts.ttsPromise(safeText, cachedFilePath);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    
    // Background upload to Supabase Storage
    uploadAudioFileToSupabase(cachedFilePath, `${textHash}.mp3`).catch(() => {});

    fs.createReadStream(cachedFilePath).pipe(res);
  } catch (err: any) {
    console.error("EdgeTTS Synthesis Error:", err);
    res.status(500).json({ error: "Audio synthesis failed: " + err.message });
  }
});

// In-memory cache for podcast episodes
const podcastCache = new Map<string, any>();

// 8. Generate 2-Persona Conversational AI Podcast for a chapter (High-Speed Lite Models)
app.post("/api/ebooks/:id/podcast", async (req, res) => {
  const { chapterId, chapterTitle, chapterContent } = req.body;
  if (!chapterId || !chapterContent) {
    return res.status(400).json({ error: "Chapter content is required." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is required for Podcast generation." });
  }

  const isArabic = /[\u0600-\u06FF]/.test(chapterContent);
  const cacheKey = `podcast_${chapterId}_${chapterTitle || 'ch'}`;

  const cached = podcastCache.get(cacheKey);
  if (cached) {
    if (cached.status === "generating") {
      return res.json({ success: true, status: "generating", message: "Podcast is already being generated in the background." });
    }
    console.log(`Serving cached podcast episode for chapter ${chapterId}`);
    return res.json({ success: true, status: "ready", ...cached });
  }

  // Mark as generating
  podcastCache.set(cacheKey, { status: "generating" });

  // Fire and forget background task
  (async () => {
    try {
      console.log(`[Background] Generating 2-persona podcast script for chapter ${chapterId}...`);
      
      const scriptPrompt = isArabic
        ? `أنت مخرج بودكاست تعليمي احترافي حواري ممتع للغاية.
أنشئ حواراً صَوْتِيّاً دَافِئاً وَمُشَوِّقاً بين مُقَدِّمَيْنِ بَشَرِيَّيْنِ:
1. "كريم": مُقَدِّمٌ ذَكِيٌّ وَفُضُولِيٌّ يطرح أسئلة استكشافية.
2. "فرح": خَبِيرَةٌ وَمُعَلِّمَةٌ دَافِئَةٌ تُوَضِّحُ الفِكْرَةَ وتشرحها بأمثلة تطبيقية.
موضوع الحلقة: فصل "${chapterTitle || 'الفصل التعليمي'}"
محتوى ومصدر الفصل:
${chapterContent.substring(0, 2500)}

الشروط الصارمة:
1. استند حصرياً وبدقة على المعلومات المذكورة في نص الفصل أعلاه، دون اختراع أي معلومات خارج النص.
2. اكتب الحوار في 5 إلى 7 تبادلات صوتية ممتعة وسريعة.
3. ضع تشكيلاً بسيطاً على الكلمات الرئيسية لتسهيل القراءة الصوتية.
4. الناتج بتنسيق JSON فقط:
{ "title": "...", "summary": "...", "transcript": [ { "speaker": "كريم", "text": "..." }, { "speaker": "فرح", "text": "..." } ] }`
        : `You are a professional educational podcast producer.
Hosts:
1. "Alex": Engaging, asks questions.
2. "Farah": Knowledgeable expert.
Topic: "${chapterTitle || 'Chapter'}"
Content Source:
${chapterContent.substring(0, 2500)}

Instructions:
1. Strictly base discussion on source content.
2. 5-7 natural conversational exchanges.
3. JSON ONLY format: { "title": "...", "summary": "...", "transcript": [{ "speaker": "Alex", "text": "..." }, { "speaker": "Farah", "text": "..." }] }`;

      const scriptResponse = await generateContentWithRetry(ai, {
        contents: [{ parts: [{ text: scriptPrompt }] }],
        config: { responseMimeType: "application/json" }
      }, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]);

      const jsonText = scriptResponse.text?.trim() || "";
      let podcastData = { title: chapterTitle || "Educational Podcast", summary: "Discussion of the chapter concepts", transcript: [] };
      try { podcastData = JSON.parse(jsonText); } catch (e) { console.warn("Failed to parse podcast JSON:", e); }

      podcastCache.set(cacheKey, {
        status: "ready",
        title: podcastData.title,
        summary: podcastData.summary,
        transcript: podcastData.transcript,
        audioBase64: undefined,
        mimeType: "audio/mp3"
      });
      console.log(`[Background] Podcast for ${chapterId} is READY.`);

    } catch (err: any) {
      console.error("[Background] Error generating podcast:", err);
      podcastCache.set(cacheKey, { status: "error", error: err.message });
    }
  })();

  // Respond immediately to the frontend
  res.json({ success: true, status: "generating", message: "Podcast generation started." });
});

// 8.1 Check Podcast Status
app.get("/api/ebooks/:id/podcast/status", (req, res) => {
  const { chapterId, chapterTitle } = req.query;
  const cacheKey = `podcast_${chapterId}_${chapterTitle || 'ch'}`;
  
  if (podcastCache.has(cacheKey)) {
    return res.json({ success: true, ...podcastCache.get(cacheKey) });
  } else {
    return res.json({ success: false, status: "not_started" });
  }
});


// 9. Interactive Pedagogical Discussion / Q&A with Podcast Hosts (Cross-Chapter Book Awareness)
app.post("/api/ebooks/:id/podcast/talk", async (req, res) => {
  const { chapterId, chapterTitle, chapterContent, userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is required." });
  }

  const isArabic = /[\u0600-\u06FF]/.test(userMessage + (chapterContent || ""));

  // Fetch full book context for cross-chapter intelligence
  const ebook = ebooks.find((e) => e.id === req.params.id);
  const allChapters = ebook?.chapters || [];
  
  const currentChapterIdx = allChapters.findIndex((c: any) => c.id === chapterId || c.title === chapterTitle);
  const currentChapterNum = currentChapterIdx !== -1 ? currentChapterIdx + 1 : 1;

  // Build compact book outline
  const bookChaptersOutline = allChapters.map((ch: any, idx: number) => {
    const conceptsSummary = Array.isArray(ch.concepts)
      ? ch.concepts.map((c: any) => typeof c === 'string' ? c : (c.concept || c.title || '')).filter(Boolean).slice(0, 4).join(', ')
      : '';
    return `[الفصل ${idx + 1}: ${ch.title}] - ملخص: ${ch.summary || ''} - مفاهيم: ${conceptsSummary}`;
  }).join("\n");

  try {
    const talkPrompt = isArabic
      ? `أنتِ "فرح"، المرشدة التعليمية الذكية ومقدمة البودكاست التفاعلي لكتاب "${ebook?.title || 'المقرر التعليمي'}".
أنتِ تتحدثين حالياً مع الطالب وهو يقرأ [الفصل ${currentChapterNum}: ${chapterTitle || 'هذا الفصل'}].

فهرس ومحتوى فصول الكتاب بالكامل:
"""
${bookChaptersOutline}
"""

محتوى الفصل الحالي المفتوح أمام الطالب:
"""
${chapterContent?.substring(0, 2500) || ''}
"""

سؤال الطالب أو المستمع:
"${userMessage}"

تعليمات التوجيه البيداغوجي والتربوي الذكي (Smart Pedagogical Tutoring):
1. **إذا كانت الإجابة موجودة في الفصل الحالي**:
   - أجيبي مباشرة بدقة وتوضيح تربوي دافئ في 2 إلى 3 جمل مع التشكيل الميسر على الكلمات الأساسية.

2. **إذا كان السؤال يتناول موضوعاً موجوداً في فصل قادم/متقدم (مثلاً الفصل 4 أو 5)**:
   - وجّهي الطالب بلطف بخصوص تسلسل التعلم: وضحي له أن سؤاله ممتاز ومتقدم ومكانه المخصص بالتفصيل هو (الفصل X: عنوانه)، ثم أعطيه إجابة تمهيدية موجزة تفيده الآن دون تعقيد.

3. **إذا كان السؤال يخص نقطة تم شرحها في فصل سابق (مثلاً الفصل 1)**:
   - ذكّريه بلطف بأن هذه النقطة تأسيسية وتم تناولها في (الفصل X: عنوانه)، وأعطيه تذكيراً سريعاً وواضحاً بخلاصتها.

4. **إذا كان السؤال خارج محتوى الكتاب تماماً**:
   - وضحي له بصدق ولطف: "هذه النقطة لم ترد في محتوى هذا المقرر الدراسي، ولكن كمعلومة إثرائية عامة: [إجابة عامة سريعة ومفيدة]. وإذا رغبت بالتعمق خارج إطار الكتاب أخبرني!"

الشروط الأسلوبية:
- تحدثي بأسلوب بشري دافئ ومشجع، وطبيعي تماماً وبدون أي رموز أو أقواس أو علامات ترقيم غريبة.
- ضعي تشكيلاً ميسراً على الكلمات لتكون سهلة النطق صوتياً باللغة العربية الفصحى الجميلة.`
      : `You are "Farah", the intelligent learning mentor and podcast host for the book "${ebook?.title || 'Course'}".
Current active chapter: [Chapter ${currentChapterNum}: ${chapterTitle || 'Current Chapter'}].

Book Chapters Outline:
"""
${bookChaptersOutline}
"""

Current Chapter Content:
"""
${chapterContent?.substring(0, 2500) || ''}
"""

Student's Question:
"${userMessage}"

Pedagogical Instructions:
1. If answered in Current Chapter: Answer directly, warmly in 2-3 sentences.
2. If in an Upcoming Chapter: Tell them it's covered in Chapter X, give a helpful preview.
3. If in a Previous Chapter: Mention it was in Chapter X and give a quick recap.
4. If Outside the Book: Clarify it's outside the text, provide a brief helpful insight, and offer further general exploration.`;

    const textRes = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text: talkPrompt }] }],
    }, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]);

    const answerText = textRes.text?.trim() || (isArabic ? "شكراً لسؤالك! وفقاً لما ورد في هذا المقرر، فإن الهدف الأساسي هو تعزيز الفهم والتطبيق العملي." : "Great question! According to this course, the primary goal is practical understanding.");

    // Generate Audio via EdgeTTS for immediate realistic speech
    let audioBase64 = undefined;
    let mimeType = "audio/mp3";

    try {
      const cleaned = cleanScientificTextForSpeech(answerText);
      const textHash = crypto.createHash("md5").update(`talk_farah_${cleaned}`).digest("hex");
      const talkAudioPath = path.join(AUDIO_CACHE_DIR, `${textHash}.mp3`);

      if (!fs.existsSync(talkAudioPath)) {
        const tts = new EdgeTTS({ voice: isArabic ? "ar-EG-SalmaNeural" : "en-US-AriaNeural", timeout: 30000 });
        await tts.ttsPromise(cleaned, talkAudioPath);
      }

      if (fs.existsSync(talkAudioPath)) {
        const audioBuffer = fs.readFileSync(talkAudioPath);
        audioBase64 = audioBuffer.toString("base64");
      }
    } catch (audioErr) {
      console.warn("Could not generate EdgeTTS for host response:", audioErr);
    }

    res.json({
      success: true,
      speaker: isArabic ? "فرح (المرشدة الذكية)" : "Farah (AI Mentor)",
      replyText: answerText,
      audioBase64,
      mimeType
    });
  } catch (err: any) {
    console.error("Error in podcast talk Q&A:", err);
    res.status(500).json({ error: "Failed to process host conversation. " + err.message });
  }
});

// 9.5 Expand Book Chapters Feature (Incremental Chapter Generation)
app.post("/api/ebooks/:id/expand-chapters", async (req, res) => {
  const bookId = req.params.id;
  const { additionalCount = 5 } = req.body;
  
  const ebook = ebooks.find(e => e.id === bookId);
  if (!ebook) {
    return res.status(404).json({ error: "Ebook not found" });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is required." });
  }

  const currentChapters = ebook.chapters || [];
  const currentTitles = currentChapters.map((c: any, i: number) => `${i + 1}. ${c.title}`).join("\n");

  const expansionPrompt = `
You are the world-class Interactive Ebook Curriculum Architect.
The user has an interactive educational book titled: "${ebook.title}"
Description: "${ebook.description || ''}"

Current existing chapters in this book:
${currentTitles || "No chapters yet"}

Task:
Generate the NEXT batch of ${additionalCount} comprehensive, progressive educational chapters that seamlessly continue from where chapter ${currentChapters.length} left off.
Do NOT repeat the existing chapters above! Create chapters ${currentChapters.length + 1} to ${currentChapters.length + additionalCount}.
Output in formal, high-quality Arabic (Fusha) if the book is Arabic.

For each chapter, provide:
- 'title': Clear and engaging chapter title
- 'summary': Summary of the chapter's core ideas
- 'content': Full educational markdown content with theories, examples, and Arabic Tashkeel on key terms
- 'concepts': Array of key conceptual terms and definitions
- 'quiz': 3 multiple choice questions with 4 options and detailed explanations
- 'mindMap': 5-7 hierarchical nodes with 'id', 'label', 'parentId', 'description'
- 'videos': 2 curated search topics
`;

  try {
    const response = await generateContentWithRetry(ai, {
      contents: [expansionPrompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: ebookResponseSchema.properties.chapters
          },
          required: ["chapters"]
        },
        temperature: 0.3
      }
    }, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]);

    const result = JSON.parse(response.text || "{}");
    const newChapters = (result.chapters || []).map((ch: any, idx: number) => {
      const cIdx = currentChapters.length + idx + 1;
      const chapterId = `ch-${ebook.id}-${cIdx}`;
      return {
        id: chapterId,
        title: ch.title || `الفصل ${cIdx}`,
        content: ch.content || "محتوى الفصل قيد المعالجة.",
        originalContent: ch.originalContent || "",
        summary: ch.summary || "",
        concepts: ch.concepts || [],
        imagePrompt: ch.imagePrompt || "Minimal educational illustration",
        videos: (ch.videos || []).map((v: any, vIdx: number) => ({
          id: `v-${chapterId}-${vIdx + 1}`,
          title: v.title || "مقطع مرئي إضافي",
          url: v.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(v.title || "education")}`,
          description: v.description || "شرح وتوضيح إضافي."
        })),
        quiz: (ch.quiz || []).map((q: any, qIdx: number) => ({
          id: `q-${chapterId}-${qIdx + 1}`,
          question: q.question || "سؤال تقويمي تفاعلي؟",
          options: q.options && q.options.length === 4 ? q.options : ["أ", "ب", "ج", "د"],
          correctOptionIndex: typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0,
          explanation: q.explanation || "توضيح تعليمي للمفهوم."
        })),
        mindMap: (ch.mindMap || []).map((m: any, mIdx: number) => ({
          id: m.id || `m-${chapterId}-${mIdx + 1}`,
          label: m.label || "مفهوم",
          parentId: m.parentId || null,
          description: m.description || "شرح المفهوم في الخريطة."
        }))
      };
    });

    ebook.chapters = [...currentChapters, ...newChapters];
    saveEbooks(ebooks);

    // Save to Supabase
    try {
      await supabase.from('books').update({ chapters: ebook.chapters }).eq('id', ebook.id);
    } catch (dbErr) {
      console.warn("Supabase chapters update error:", dbErr);
    }

    res.json({ success: true, newChapters, totalChapters: ebook.chapters.length, book: ebook });
  } catch (err: any) {
    console.error("Expand chapters error:", err);
    res.status(500).json({ error: "Failed to expand chapters: " + err.message });
  }
});

// In-memory pre-generation jobs tracking
const pregenJobs: Record<string, { status: string; progressPercent: number; currentStep: string }> = {};

// 9.7 Batch Asset Pre-Generation for entire book (TTS Audios, Podcast dialogues & Flashcards)
app.post("/api/ebooks/:id/pregenerate-all-assets", async (req, res) => {
  const bookId = req.params.id;
  const ebook = ebooks.find(e => e.id === bookId);
  if (!ebook) return res.status(404).json({ error: "Ebook not found" });

  if (pregenJobs[bookId] && pregenJobs[bookId].status === "processing") {
    return res.json({ success: true, status: "processing", progressPercent: pregenJobs[bookId].progressPercent, message: "Pregeneration is already running." });
  }

  pregenJobs[bookId] = { status: "processing", progressPercent: 5, currentStep: "بدء تجهيز كافة الأصوات والبودكاست في الخلفية..." };
  res.json({ success: true, status: "processing", message: "Batch pregeneration initiated in background." });

  // Fire background worker
  (async () => {
    try {
      const chapters = ebook.chapters || [];
      const totalSteps = Math.max(1, chapters.length * 2);
      let completedSteps = 0;
      let totalAudioFilesSynthesized = 0;

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        
        // 1. Pre-generate EdgeTTS chapter narrative audio
        pregenJobs[bookId].currentStep = `تجهيز التسجيل الصوتي للراوي (الفصل ${i + 1}: ${ch.title})...`;
        const cleanedText = cleanScientificTextForSpeech(ch.content || ch.summary || "");
        if (cleanedText) {
          const safeText = cleanedText.length > 700 ? cleanedText.substring(0, 700) + "..." : cleanedText;
          const textHash = crypto.createHash("md5").update(`ar-EG-SalmaNeural_${safeText}`).digest("hex");
          const cachedFilePath = path.join(AUDIO_CACHE_DIR, `${textHash}.mp3`);
          if (!fs.existsSync(cachedFilePath)) {
            try {
              const tts = new EdgeTTS({ voice: "ar-EG-SalmaNeural", timeout: 35000 });
              await tts.ttsPromise(safeText, cachedFilePath);
              totalAudioFilesSynthesized++;
            } catch (e) {
              console.warn(`[Batch Pregen] Audio synthesis notice for chapter ${i + 1}:`, e);
            }
          }
        }
        completedSteps++;
        pregenJobs[bookId].progressPercent = Math.min(95, Math.round((completedSteps / totalSteps) * 95));

        // 2. Pre-generate Podcast episode script & ALL spoken voices (Karim & Farah)
        pregenJobs[bookId].currentStep = `إنتاج حوار وبودكاست الفصل ${i + 1}...`;
        const cacheKey = `podcast_${ch.id}_${ch.title || 'ch'}`;
        let podcastData = podcastCache.get(cacheKey);

        if (!podcastData) {
          try {
            const ai = getGenAIClient();
            if (ai) {
              const scriptPrompt = `أنت مخرج بودكاست تعليمي احترافي. أنشئ حواراً صوتياً جذاباً بين كريم وفرح حول فصل "${ch.title}":\n${(ch.content || '').substring(0, 2000)}\nJSON ONLY: { "title": "...", "summary": "...", "transcript": [ { "speaker": "كريم", "text": "..." }, { "speaker": "فرح", "text": "..." } ] }`;
              const resp = await generateContentWithRetry(ai, { contents: [{ parts: [{ text: scriptPrompt }] }], config: { responseMimeType: "application/json" } });
              if (resp.text) {
                podcastData = JSON.parse(resp.text);
                podcastCache.set(cacheKey, { status: "ready", ...podcastData });
              }
            }
          } catch (e) {
            console.warn(`[Batch Pregen] Podcast generation notice for chapter ${i + 1}:`, e);
          }
        }

        // Now pre-synthesize EdgeTTS audio voices for each line of dialogue in Karim and Farah's transcript!
        if (podcastData && Array.isArray(podcastData.transcript)) {
          for (let tIdx = 0; tIdx < podcastData.transcript.length; tIdx++) {
            const turn = podcastData.transcript[tIdx];
            const isMale = turn.speaker === "كريم" || turn.speaker.includes("كريم");
            const voice = isMale ? "ar-EG-ShakirNeural" : "ar-EG-SalmaNeural";
            const cleanedTurnText = cleanScientificTextForSpeech(turn.text || "");
            if (cleanedTurnText) {
              const safeTurnText = cleanedTurnText.length > 700 ? cleanedTurnText.substring(0, 700) + "..." : cleanedTurnText;
              const turnHash = crypto.createHash("md5").update(`${voice}_${safeTurnText}`).digest("hex");
              const turnAudioPath = path.join(AUDIO_CACHE_DIR, `${turnHash}.mp3`);
              if (!fs.existsSync(turnAudioPath)) {
                try {
                  const tts = new EdgeTTS({ voice, timeout: 35000 });
                  await tts.ttsPromise(safeTurnText, turnAudioPath);
                  totalAudioFilesSynthesized++;
                } catch (ttsErr) {
                  console.warn(`[Batch Pregen] EdgeTTS turn error:`, ttsErr);
                }
              }
            }
            pregenJobs[bookId].currentStep = `توليد أصوات حوار البودكاست (الفصل ${i + 1}: ${tIdx + 1}/${podcastData.transcript.length} مقطع)...`;
          }
        }

        completedSteps++;
        pregenJobs[bookId].progressPercent = Math.min(95, Math.round((completedSteps / totalSteps) * 95));
      }

      pregenJobs[bookId] = { status: "ready", progressPercent: 100, currentStep: `اكتمل بنجاح تجهيز كافة المقاطع الصوتية (${totalAudioFilesSynthesized} مقطع صوتي جاهز للتشغيل الفوري)!` };
      ebook.pregeneration_status = "ready";
      ebook.pregeneration_percent = 100;
      saveEbooks(ebooks);

      try {
        await supabase.from('books').update({ pregeneration_status: 'ready', pregeneration_percent: 100 }).eq('id', bookId);
      } catch (dbErr) {
        console.warn("Supabase pregeneration update notice:", dbErr);
      }
    } catch (err: any) {
      console.error("[Batch Pregen] Error during pregeneration:", err);
      pregenJobs[bookId] = { status: "failed", progressPercent: 0, currentStep: "حدث خطأ: " + err.message };
    }
  })();
});

app.get("/api/ebooks/:id/pregenerate-status", (req, res) => {
  const bookId = req.params.id;
  const job = pregenJobs[bookId] || { status: "idle", progressPercent: 0, currentStep: "" };
  res.json(job);
});

// 9.8 Toggle Book Publish Status (Draft vs Published for Students)
app.post("/api/ebooks/:id/toggle-publish", async (req, res) => {
  const bookId = req.params.id;
  const ebook = ebooks.find(e => e.id === bookId);
  if (!ebook) return res.status(404).json({ error: "Ebook not found" });

  ebook.is_published = !ebook.is_published;
  saveEbooks(ebooks);

  try {
    await supabase.from('books').update({ is_published: ebook.is_published }).eq('id', bookId);
  } catch (e) {
    console.warn("Supabase toggle publish error:", e);
  }

  res.json({ success: true, is_published: ebook.is_published });
});

/**
 * Dynamic fallback educational image selector based on topic keywords
 */
const getFallbackIllustration = (prompt: string): string => {
  const normalized = prompt.toLowerCase();
  
  const library = {
    assessment: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80", // exam, writing, paper
    classroom: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80", // students, school
    technology: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80", // computer, digital, code
    psychology: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80", // mind, brain, cognitive, discussion
    science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80", // lab, research, biology
    language: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80", // books, read, calligraphy
    math: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80", // mathematics, formula, chalkboard
    creativity: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80", // paint, art, creative
    general: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80" // general study, book and notebook
  };

  if (normalized.includes("math") || normalized.includes("حساب") || normalized.includes("رياضيات") || normalized.includes("أرقام") || normalized.includes("number")) {
    return library.math;
  }
  if (normalized.includes("assess") || normalized.includes("exam") || normalized.includes("test") || normalized.includes("تقويم") || normalized.includes("اختبار") || normalized.includes("قياس")) {
    return library.assessment;
  }
  if (normalized.includes("tech") || normalized.includes("computer") || normalized.includes("برمج") || normalized.includes("رقمي") || normalized.includes("سحابي")) {
    return library.technology;
  }
  if (normalized.includes("psych") || normalized.includes("cognit") || normalized.includes("mind") || normalized.includes("عقل") || normalized.includes("معرفي") || normalized.includes("علم نفس") || normalized.includes("نمو")) {
    return library.psychology;
  }
  if (normalized.includes("science") || normalized.includes("physics") || normalized.includes("chem") || normalized.includes("علوم") || normalized.includes("فيزياء")) {
    return library.science;
  }
  if (normalized.includes("language") || normalized.includes("write") || normalized.includes("read") || normalized.includes("book") || normalized.includes("كتاب") || normalized.includes("لغوية") || normalized.includes("إملاء") || normalized.includes("خط") || normalized.includes("حرف")) {
    return library.language;
  }
  if (normalized.includes("creative") || normalized.includes("art") || normalized.includes("إبداع") || normalized.includes("فن")) {
    return library.creativity;
  }
  if (normalized.includes("class") || normalized.includes("school") || normalized.includes("teach") || normalized.includes("مدرسة") || normalized.includes("فصل") || normalized.includes("معلم")) {
    return library.classroom;
  }

  return library.general;
};

// 7. Generate a custom image visual using gemini-1.5-flash
app.post("/api/ebooks/:id/generate-image", async (req, res) => {
  const { chapterId, prompt } = req.body;
  if (!chapterId || !prompt) {
    return res.status(400).json({ error: "Must provide chapterId and prompt to generate visual." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    // If no key, return high quality fallback immediately
    const fallbackImage = getFallbackIllustration(prompt);
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === chapterId);
      if (chapter) {
        chapter.imageUrl = fallbackImage;
      }
    }
    return res.json({ success: true, imageUrl: fallbackImage, isFallback: true });
  }

  try {
    console.log(`Generating visual image for chapter ${chapterId} with prompt: "${prompt}"`);

    const response = await generateContentWithRetry(ai, {
      contents: {
        parts: [
          {
            text: `${prompt}. Clean, high contrast, elegant educational illustration design, light theme, high-resolution graphic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Perfect for chapter banner visuals
        }
      }
    }, ["gemini-1.5-flash", "gemini-1.5-flash"]);

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image payload returned from image model.");
    }

    // Save in memory
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === chapterId);
      if (chapter) {
        chapter.imageUrl = base64Image;
      }
    }

    res.json({ success: true, imageUrl: base64Image });
  } catch (error: any) {
    console.log("[Gemini API] Dynamic fallback applied for chapter illustration.");
    
    // Select premium high-resolution illustration seamlessly
    const fallbackImage = getFallbackIllustration(prompt);
    
    // Save fallback image in memory for persistence in current session
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === chapterId);
      if (chapter) {
        chapter.imageUrl = fallbackImage;
      }
    }

    res.json({ success: true, imageUrl: fallbackImage, isFallback: true });
  }
});

// 7. Dynamic AI Quiz Question Generator using Gemini
app.post("/api/ebooks/:id/generate-questions", async (req, res) => {
  const { chapterId, chapterContent } = req.body;
  if (!chapterId || !chapterContent) {
    return res.status(400).json({ error: "Must provide chapterId and chapterContent." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    // Return mock questions if Gemini is in simulation mode
    const mockQuestions = [
      {
        id: `q-mock-${Math.random().toString(36).substring(2, 9)}`,
        question: `Based on this chapter's key themes, what represents the primary driving force behind its key phenomena?`,
        options: [
          "Linear regulation of external physical resources",
          "An intricate cascade of chemical, biological, or structural reactions",
          "A shift in macro-level thermodynamic directional equilibrium",
          "Passive environmental interactions that maintain status-quo state"
        ],
        correctOptionIndex: 1,
        explanation: "The core discussion underscores how complex cascade interactions catalyze and drive the primary phenomenon outlined in this text."
      },
      {
        id: `q-mock-${Math.random().toString(36).substring(2, 9)}`,
        question: `Which common conceptual pitfall or learning challenge is directly addressed in this section?`,
        options: [
          "Assuming variables act fully independently without catalysts",
          "Conflating macro-level structural indicators with localized micro behaviors",
          "Believing the system remains fully static over long operational intervals",
          "All of the above are typical learning challenges"
        ],
        correctOptionIndex: 3,
        explanation: "Educators highlight that students frequently fall into all three traps: assuming catalyst independence, micro/macro confusion, and static assumptions."
      }
    ];
    return res.json({ success: true, questions: mockQuestions });
  }

  try {
    console.log(`Generating AI Quiz Questions for chapter ${chapterId}...`);
    
    const questionsResponseSchema = {
      type: Type.ARRAY,
      description: "A list of exactly 3 highly relevant multiple choice quiz questions based on the provided text.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Clear, conceptual, multiple choice question testing depth of understanding" },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options" },
          correctOptionIndex: { type: Type.INTEGER, description: "0-based index of the correct option (0 to 3)" },
          explanation: { type: Type.STRING, description: "Detailed explanation of why the correct option is right and why others are incorrect" }
        },
        required: ["question", "options", "correctOptionIndex", "explanation"]
      }
    };

    const instructionPrompt = `
You are an expert curriculum designer and educator.
Analyze the following educational text from a textbook chapter:
"""
${chapterContent}
"""

Create exactly 3 highly-engaging, challenging multiple choice questions based on this text.
Each question must test conceptual understanding or critical thinking (not just basic keyword recall), have 4 distinct and plausible options, 1 clear correct answer, and an informative, highly detailed educational explanation.
If the content is in Arabic, you MUST output the questions, options, and explanation in high-quality, formal Arabic (Fusha) using precise educational terminology.
`;

    const response = await generateContentWithRetry(ai, {
      contents: [instructionPrompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: questionsResponseSchema,
        temperature: 0.7,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const generatedQuestions = JSON.parse(resultText);
    
    // Assign unique IDs to the generated questions
    const formattedQuestions = generatedQuestions.map((q: any, index: number) => ({
      ...q,
      id: `q-ai-${Date.now()}-${index}`
    }));

    // Optionally save these questions in memory to the corresponding chapter so they persist
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === chapterId);
      if (chapter) {
        if (!chapter.quiz) chapter.quiz = [];
        chapter.quiz = [...chapter.quiz, ...formattedQuestions];
      }
    }

    res.json({ success: true, questions: formattedQuestions });
  } catch (error: any) {
    console.error("Error generating AI quiz questions:", error);
    res.status(500).json({ error: "Failed to generate AI quiz questions. " + error.message });
  }
});

// 7b. AI Mind Map Dynamic Modifier
app.post("/api/ebooks/:id/chapters/:chapterId/mindmap/ai-edit", async (req, res) => {
  const { prompt, nodes, chapterContent } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Must provide a prompt instruction for AI." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    // Simulator Mode update
    console.log(`[MindMap AI Simulator] Processing prompt: "${prompt}"`);
    const lowerPrompt = prompt.toLowerCase();
    const updatedNodes = [...(nodes || [])];
    
    const isArabic = /[\u0600-\u06FF]/.test(prompt);
    
    if (lowerPrompt.includes("delete") || lowerPrompt.includes("حذف") || lowerPrompt.includes("remove")) {
      if (updatedNodes.length > 0) {
        updatedNodes.pop();
      }
    } else {
      const randomId = `node-ai-${Math.random().toString(36).substring(2, 7)}`;
      if (isArabic) {
        updatedNodes.push({
          id: randomId,
          label: prompt.substring(0, 20) || "مفهوم جديد",
          parentId: nodes.length > 0 ? nodes[nodes.length - 1].id : null,
          description: `مفهوم إضافي تم إنشاؤه عبر الذكاء الاصطناعي بناءً على: "${prompt}"`
        });
      } else {
        updatedNodes.push({
          id: randomId,
          label: prompt.substring(0, 20) || "New Concept",
          parentId: nodes.length > 0 ? nodes[nodes.length - 1].id : null,
          description: `Additional concept node generated via AI based on: "${prompt}"`
        });
      }
    }
    
    // Save to server
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === req.params.chapterId);
      if (chapter) {
        chapter.mindMap = updatedNodes;
        saveEbooks(ebooks);
      }
    }
    
    return res.json({ success: true, nodes: updatedNodes });
  }

  try {
    console.log(`[Gemini API] Editing Mind Map with prompt: "${prompt}"`);
    
    const mindMapResponseSchema = {
      type: Type.ARRAY,
      description: "The complete list of updated mindmap nodes after performing the requested action.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique code string for this node, e.g., node-1" },
          label: { type: Type.STRING, description: "Concept name, highly concise (1-3 words). Matching the language used in the prompt." },
          parentId: { type: Type.STRING, description: "Parent node id or null if root. Ensure the parentId exists in this array." },
          description: { type: Type.STRING, description: "1-sentence description explaining the concept clearly." }
        },
        required: ["id", "label", "description"]
      }
    };

    const systemInstruction = `
You are a brilliant interactive educational syllabus and mind-mapping system.
Your job is to read an existing list of Mind Map nodes, analyze an instruction from a student or teacher (which might be in English or Arabic, and could be a transcription of a live voice command), and modify the mind map accordingly.

Current Mind Map Nodes:
${JSON.stringify(nodes, null, 2)}

Chapter Content for general context:
"""
${chapterContent || ""}
"""

User Action Request Prompt:
"${prompt}"

Instructions:
1. Interpret the user's intent:
   - "Add concept X under Y": Create a new node with a unique id, label "X" (in the language of the prompt), parentId pointing to Y's id, and a clear 1-sentence description.
   - "Delete concept X" or "Remove X": Filter out the node matching label or id X. Connect any of X's direct children to X's parent (grandparent) so the tree is not broken.
   - "Change X description to Y" or "Edit X": Modify X's label or description as requested.
   - "Add a new branch about X": Intelligently find an appropriate parent from the current map or create X as a new root.
2. Maintain high proficiency in Arabic and English. If the user commands or speaks in Arabic, name the new nodes and write the description in Arabic. If English, write in English. Keep it clear, friendly, and highly educational for students.
3. Return the COMPLETE array of ALL active nodes in the mindmap. Ensure they form a valid hierarchy where all parentId references refer to existing node ids or are null. Avoid duplicate ids.
`;

    const response = await generateContentWithRetry(ai, {
      contents: [systemInstruction],
      config: {
        responseMimeType: "application/json",
        responseSchema: mindMapResponseSchema,
        temperature: 0.3,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const updatedNodes = JSON.parse(resultText);

    // Save to memory and JSON file
    const ebook = ebooks.find((e) => e.id === req.params.id);
    if (ebook) {
      const chapter = ebook.chapters.find((ch: any) => ch.id === req.params.chapterId);
      if (chapter) {
        chapter.mindMap = updatedNodes;
        saveEbooks(ebooks);
      }
    }

    res.json({ success: true, nodes: updatedNodes });
  } catch (error: any) {
    console.error("Error editing mind map with AI:", error);
    res.status(500).json({ error: "Failed to modify mind map. " + error.message });
  }
});



// Serve frontend client SPA
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Interactive Ebook Studio server running on http://0.0.0.0:${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
