import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to support base64 uploads (PDFs, images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GoogleGenAI client safely
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will fallback to simulation.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/**
 * Executes a Gemini API call with automatic transient error retries (503, 429)
 * and an optional list of fallback models.
 */
const generateContentWithRetry = async (
  ai: any,
  params: any,
  modelsChain: string[] = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
): Promise<any> => {
  let lastError: any = null;

  for (const model of modelsChain) {
    console.log(`[Gemini API] Trying content generation using model: ${model}`);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
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

        console.log(
          `[Gemini API] Request on model ${model} (try ${attempt}/3) returned status: ${errStatus || "unsuccessful"}`
        );

        // Check if error is transient (Service Unavailable, Too Many Requests, high demand)
        const isTransient =
          errStr.includes("503") ||
          errStr.includes("429") ||
          errStr.includes("quota") ||
          errStr.includes("unavailable") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("high demand") ||
          errStr.includes("temporarily");

        if (isTransient && attempt < 3) {
          const isRateLimit = errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted");
          const delay = isRateLimit ? attempt * 4000 : attempt * 1000;
          console.log(
            `[Gemini API] Transient/Rate-limit condition met. Retrying ${model} in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // If not transient, or we exhausted retries, break to try the next fallback model in the chain
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after multiple models and retry attempts.");
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
        // Ensure samples are in the list
        for (const sample of sampleEbooks) {
          if (!ebooks.some(e => e.id === sample.id)) {
            ebooks.push(sample);
          }
        }
        return;
      }
    }
  } catch (err) {
    console.error("Error loading persisted ebooks database, falling back to samples:", err);
  }
  ebooks = [...sampleEbooks];
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
  const initialLength = ebooks.length;
  ebooks = ebooks.filter((e) => e.id !== req.params.id);
  if (ebooks.length === initialLength) {
    return res.status(404).json({ error: "Ebook not found" });
  }
  saveEbooks(ebooks);
  res.json({ success: true, message: "Ebook deleted" });
});

// 4. Update ebook
app.put("/api/ebooks/:id", (req, res) => {
  const index = ebooks.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Ebook not found" });
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
  payload: { promptText: string; fileBase64?: string; fileName?: string; fileType?: string }
) {
  const { promptText, fileBase64, fileName, fileType } = payload;
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

      const fallbackId = "fallback-" + Math.random().toString(36).substring(2, 9);
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
    
    if (fileBase64 && fileType) {
      contents.push({
        inlineData: {
          mimeType: fileType,
          data: fileBase64
        }
      });
      job.progressStep = `Processing uploaded document file ${fileName || ""}...`;
      job.progressPercent = 30;
    } else {
      job.progressStep = "Deconstructing prompt guidelines and topics...";
      job.progressPercent = 35;
    }

    let instructionPrompt = `
You are the world-class Interactive Ebook Converter.
Your primary task is to convert the provided educational input (which could be a PDF file, an image, a blog post, note outlines, or a general topic prompt) into a highly structured, interactive educational ebook.

Analyze the size, depth, and chapter structure requested or present in the provided input:
1. Determine the sizeCategory of the input:
   - 'short': If it is a simple outline, a single image, or a brief text block. (Generate 2 to 3 chapters)
   - 'medium': If it is a moderate article, lecture notes, or short paper. (Generate 4 to 8 chapters)
   - 'long': If it is a full PDF book, multi-chapter textbook, course syllabus, or detailed subject. (Generate 10 to 30 chapters as required! DO NOT CAP AT 5 CHAPTERS! If the user or document contains 10, 12, 15, 20, or 30 topics/chapters, generate ALL of them!)

CRITICAL CONTENT DEPTH INSTRUCTION:
- DO NOT SUMMARIZE OR TRUNCATE THE EDUCATIONAL CONTENT into brief bullet points!
- Write full, exhaustive, comprehensive, multi-paragraph textbook chapters in Markdown.
- Preserve all theories, names of pioneers (e.g., Watson, Pavlov, Skinner, Piaget, Ausubel, Vygotsky, Gardner), definitions, mathematical/logical steps, and examples from the source material.

For each chapter, generate:
- An inspiring and clear chapter 'title'
- An extremely thorough, high-quality, deep educational 'content' field in Markdown format.
- A descriptive 'imagePrompt' that vividly describes an educational, elegant minimalist illustration of the chapter's core concept, suited for text-to-image generators.
- An interactive 'quiz' containing 3 multiple-choice questions. Each question must have exactly 4 diverse options, the correctOptionIndex, and a detailed educational explanation.
- A list of 'videos' containing 2 curated video searches with targeted YouTube URLs and descriptions.
- A 'mindMap' containing a structured hierarchy of 5-8 key concept nodes with 'id', 'label', 'parentId', and 'description'.

Provided user guidance / request: "${promptText || 'Convert the uploaded document into a full, unabridged interactive ebook.'}"
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
    }, ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]);

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API.");
    }

    job.progressStep = "Compiling structural schemas and mapping interactive nodes...";
    job.progressPercent = 85;

    console.log("[Job Worker] Parsing generated JSON...");
    const parsedEbook = JSON.parse(resultText);

    // Formulate a clean Ebook object with IDs
    const ebookId = "eb-" + Math.random().toString(36).substring(2, 9);
    
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

    job.progressStep = "Ebook ready! Loading into bookshelf...";
    job.progressPercent = 100;
    job.status = "completed";
    job.result = finalizedEbook;
    console.log(`[Job Worker] Job ${jobId} successfully completed true generation.`);

  } catch (error: any) {
    console.error(`[Job Worker] Job ${jobId} true generation failed:`, error);
    job.status = "failed";
    job.error = "Failed to convert ebook with AI: " + error.message;
  }
}

// 5. Convert content or create ebook from prompt / file upload (Async trigger)
app.post("/api/ebooks", (req, res) => {
  const { promptText, fileBase64, fileName, fileType } = req.body;
  
  if (!promptText && !fileBase64) {
    return res.status(400).json({ error: "Must provide either promptText, a file, or both to convert." });
  }

  const jobId = "job-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  console.log(`[Task Dispatcher] Created job: ${jobId}. File name: ${fileName || "None"}`);

  conversionJobs[jobId] = {
    id: jobId,
    status: "processing",
    progressStep: "Analyzing input study materials...",
    progressPercent: 5
  };

  // Run in the background without blocking the response
  runBackgroundEbookConversion(jobId, { promptText, fileBase64, fileName, fileType });

  // Return immediately with jobId
  res.json({ success: true, jobId });
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
  const { chapterId, text } = req.body;
  if (!chapterId || !text) {
    return res.status(400).json({ error: "Must provide chapterId and text to narrate." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is not configured. TTS narrator soundtrack requires a valid key." });
  }

  try {
    const { cleanText, isArabic } = sanitizeTextForHumanNarration(text);
    const cacheKey = `chapter_${chapterId}_${cleanText}`;
    if (ttsSnippetCache.has(cacheKey)) {
      console.log(`Serving chapter ${chapterId} TTS audio from memory cache.`);
      const cached = ttsSnippetCache.get(cacheKey)!;
      return res.json({ success: true, audioBase64: cached.audioBase64, mimeType: cached.mimeType, cached: true });
    }

    console.log(`Generating TTS narrator soundtrack for chapter ${chapterId}...`);

    const narratorPrompt = isArabic
      ? `أنت راوٍ صَوْتِي إِخْبَارِيٌّ وَثَائِقِيٌّ بَشَرِيٌّ دَافِئٌ وَمُحْتَرِفٌ. اقْرَأْ هَذَا النَّصَّ التَّعْلِيمِيَّ بِلُغَةٍ عَرَبِيَّةٍ فَصِيحَةٍ وَمُعَبِّرَةٍ وَطَبِيعِيَّةٍ جِدّاً كَأَنَّكَ إِنْسَانٌ حَقِيقِيٌّ يَتَحَدَّثُ لِلْمُسْتَمِعِينَ، بِنَبْرَةٍ دَافِئَةٍ وَإِيقَاعٍ مُرِيحٍ، دُونَ نُطْقِ أَيِّ رُمُوزٍ أَوْ تَرْقِيمٍ أَوْ أَقْوَاسٍ أَوْ أَرْقَامِ نِقَاطٍ:\n\n${cleanText}`
      : `You are a warm, articulate, professional human documentary narrator. Read this educational material in a natural, highly expressive human voice with natural pauses and warm cadence. Do NOT pronounce any punctuation, symbols, brackets, or bullet numbers:\n\n${cleanText}`;

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
    }, ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.1-flash-tts-preview"]);

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
    }, ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.1-flash-tts-preview"]);

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

// In-memory cache for podcast episodes
const podcastCache = new Map<string, {
  title: string;
  summary: string;
  transcript: Array<{ speaker: string; text: string }>;
  audioBase64?: string;
  mimeType?: string;
}>();

// 8. Generate 2-Persona Conversational AI Podcast for a chapter
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

  if (podcastCache.has(cacheKey)) {
    console.log(`Serving cached podcast episode for chapter ${chapterId}`);
    return res.json({ success: true, ...podcastCache.get(cacheKey) });
  }

  try {
    console.log(`Generating 2-persona podcast script for chapter ${chapterId}...`);
    
    // Step A: Generate dynamic, natural 2-host dialogue script
    const scriptPrompt = isArabic
      ? `أنت مخرج بودكاست تعليمي احترافي حواري ممتع للغاية (مثل بودكاست دافور أونلاين أو إذاعة ثمانية).
أنشئ حواراً صَوْتِيّاً دَافِئاً وَمُشَوِّقاً بين مُقَدِّمَيْنِ بَشَرِيَّيْنِ:
1. "كريم": مُقَدِّمٌ ذَكِيٌّ وَفُضُولِيٌّ يطرح أسئلة المستمعين ويبسط المفاهيم.
2. "سلمى": خَبِيرَةٌ وَمُعَلِّمَةٌ دَافِئَةٌ تُوَضِّحُ الفِكْرَةَ بِأَمْثِلَةٍ وَاقِعِيَّةٍ وَمُمِتِعَةٍ.

موضوع الحلقة: فصل "${chapterTitle || 'الفصل التعليمي'}"
محتوى الفصل:
${chapterContent.substring(0, 2000)}

الشروط:
1. اجعل الحوار بين 6 إلى 8 تبادلات حوارية طبيعية جداً كأنها محادثة حقيقية بين بني آدم.
2. نسّق المخرجات بصيغة JSON فقط بهذا الشكل:
{
  "title": "عنوان مشوق للحلقة",
  "summary": "ملخص من سطرين عن موضوع النقاش",
  "transcript": [
    { "speaker": "كريم", "text": "نص كريم هنا بدون أرقام أو رموز..." },
    { "speaker": "سلمى", "text": "نص سلمى هنا..." }
  ]
}`
      : `You are a professional educational podcast producer creating a warm, highly conversational, 2-host podcast episode.
Hosts:
1. "Alex": An engaging, curious co-host who asks questions and simplifies ideas.
2. "Sarah": A knowledgeable, warm educational expert who breaks down concepts with real-world examples.

Topic: "${chapterTitle || 'Chapter'}"
Content:
${chapterContent.substring(0, 2000)}

Return JSON ONLY in this format:
{
  "title": "An engaging podcast episode title",
  "summary": "Brief 2-sentence summary of the discussion",
  "transcript": [
    { "speaker": "Alex", "text": "Alex's dialogue here..." },
    { "speaker": "Sarah", "text": "Sarah's dialogue here..." }
  ]
}`;

    const scriptResponse = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text: scriptPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    }, ["gemini-3.6-flash"]);

    const jsonText = scriptResponse.text?.trim() || "";
    let podcastData = { title: chapterTitle || "Educational Podcast", summary: "Discussion of the chapter concepts", transcript: [] };
    try {
      podcastData = JSON.parse(jsonText);
    } catch (e) {
      console.warn("Failed to parse podcast JSON script, using fallback structure:", e);
    }

    // Step B: Generate audio for the podcast dialogue using multi-speaker or synthesized speech
    let base64Audio = undefined;
    let mimeType = "audio/mp3";

    try {
      const fullSpeechText = podcastData.transcript
        .map((t: any) => `${t.speaker}: ${t.text}`)
        .join("\n");

      const ttsPrompt = isArabic
        ? `حوار بودكاست بين كريم وسلمى حول فصل ${chapterTitle}:\n${fullSpeechText}`
        : `A conversational podcast dialogue between Alex and Sarah:\n${fullSpeechText}`;

      const ttsResponse = await generateContentWithRetry(ai, {
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: isArabic ? "كريم" : "Alex",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                },
                {
                  speaker: isArabic ? "سلمى" : "Sarah",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
                }
              ]
            }
          }
        }
      }, ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash"]);

      const inlinePart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlinePart?.data) {
        base64Audio = inlinePart.data;
        mimeType = inlinePart.mimeType || "audio/mp3";
      }
    } catch (audioErr) {
      console.warn("Multi-speaker audio generation skipped or fell back:", audioErr);
    }

    const result = {
      title: podcastData.title,
      summary: podcastData.summary,
      transcript: podcastData.transcript,
      audioBase64: base64Audio,
      mimeType
    };

    podcastCache.set(cacheKey, result);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Error generating podcast:", err);
    res.status(500).json({ error: "Failed to generate podcast episode. " + err.message });
  }
});

// 9. Interactive Discussion / Q&A with Podcast Hosts (Type or Speak to AI Host)
app.post("/api/ebooks/:id/podcast/talk", async (req, res) => {
  const { chapterTitle, chapterContent, userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required." });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key is required." });
  }

  const isArabic = /[\u0600-\u06FF]/.test(userMessage + (chapterContent || ""));

  try {
    const talkPrompt = isArabic
      ? `أنت "سلمى"، مُقَدِّمَةُ البودكاست التعليمي التفاعلي الممتع حول فصل "${chapterTitle || 'الفصل'}"، محتوى الفصل: ${chapterContent?.substring(0, 1000) || ''}.
المستمع يطرح عليكِ هذا السؤال أو الفكرة:
"${userMessage}"

أجيبي بصوت بشرية دافئة، مشجعة، وإيجابية جداً وبأسلوب حواري طبيعي في 2-3 جمل قصيرة، مفسرةً الفكرة بوضوح ودون نطق أي رموز أو ترقيم.`
      : `You are "Sarah", warm co-host of an educational podcast discussing chapter "${chapterTitle || 'Chapter'}".
Context: ${chapterContent?.substring(0, 1000) || ''}
The listener asks/says:
"${userMessage}"

Respond in 2-3 short, warm, engaging, natural human conversational sentences explaining the concept directly to the listener without pronouncing punctuation or symbols.`;

    const textRes = await generateContentWithRetry(ai, {
      contents: [{ parts: [{ text: talkPrompt }] }],
    }, ["gemini-3.6-flash"]);

    const answerText = textRes.text?.trim() || (isArabic ? "شكراً لسؤالك الرائع! هذه الفكرة تبين كيف أن التعلم ممتد ومكتسب دائماً." : "Great question! This concept highlights how learning is an ongoing experience.");

    let audioBase64 = undefined;
    let mimeType = "audio/mp3";

    try {
      const { cleanText } = sanitizeTextForHumanNarration(answerText);
      const audioPrompt = isArabic
        ? `اقرئي بصوت بشرية دافئة ومباشرة للمستمع بأسلوب طبيعي:\n${cleanText}`
        : `Say in a warm, direct, natural human voice:\n${cleanText}`;

      const audioRes = await generateContentWithRetry(ai, {
        contents: [{ parts: [{ text: audioPrompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: isArabic ? "Kore" : "Aoede" }
            }
          }
        }
      }, ["gemini-2.5-flash", "gemini-3.1-flash-tts-preview"]);

      const inlinePart = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlinePart?.data) {
        audioBase64 = inlinePart.data;
        mimeType = inlinePart.mimeType || "audio/mp3";
      }
    } catch (e) {
      console.warn("Could not generate host speech audio:", e);
    }

    res.json({
      success: true,
      speaker: isArabic ? "سلمى (مقدمة البودكاست)" : "Sarah (Podcast Host)",
      replyText: answerText,
      audioBase64,
      mimeType
    });
  } catch (err: any) {
    console.error("Error in podcast talk Q&A:", err);
    res.status(500).json({ error: "Failed to process host conversation. " + err.message });
  }
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

// 7. Generate a custom image visual using gemini-3.1-flash-lite-image
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
    }, ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"]);

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

startServer();
