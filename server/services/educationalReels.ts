import { detectTeacherPersona } from "./teacherPersonas";

export interface EducationalReelPayload {
  title: string;
  topic: string;
  hook: string;
  explanation: string;
  examTip: string;
  interactiveChallenge: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  narrationScript: string;
  visualPrompt: string;
  tags: string[];
}

/**
 * Builds the Master Prompt for High-Yield Educational Micro-Learning Reels
 */
export function buildEducationalReelPrompt(params: {
  bookTitle: string;
  chapterTitle: string;
  chapterContent: string;
  category?: string;
  grade_level?: string;
}): string {
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  return `
You are the world's finest Educational Micro-Learning Architect and Master Reel Producer (Osera Smart Reels Engine).
Your role: ${persona.name} (${persona.title}).

Transform this educational chapter into an ELITE 45-60 second viral educational reel:
- Book: "${params.bookTitle}"
- Chapter / Lesson: "${params.chapterTitle}"
- Content Context:
${params.chapterContent.substring(0, 3500)}

🌟 PEDAGOGICAL REEL RULES:
1. 🎯 HOOK (0-5s): Start with a curiosity-sparking question or real-life dilemma (e.g., "عمرك سألت نفسك ليه...؟" أو "سؤال في الامتحان بيوقع 80% من الطلاب!").
2. 💡 CORE INTUITION (5-35s): Explain the concept simply and brilliantly in 3 clear sentences. No fluff, pure insight.
3. 🚨 EXAM TRICK / GOLDEN TIP (35-45s): Reveal the secret trap or rule that guarantees full marks on this point.
4. 🎮 INTERACTIVE CHALLENGE (45-60s): End with a rapid-fire quiz question with 3-4 options.
5. 🎙️ NARRATION SCRIPT:
   - Provide a smooth, natural spoken script in lively Arabic (Fusha with natural rhythm).
   - 🚫 NO markdown symbols, emojis, or dashes in the narration script so text-to-speech reads it cleanly.

OUTPUT MUST BE VALID JSON ONLY:
{
  "title": "عنوان ريل جذاب ومحدد للدرس",
  "topic": "${params.chapterTitle}",
  "hook": "الخطاف الذهني الافتتاحي في أول 5 ثوانٍ",
  "explanation": "الشرح التعليمي المركز والمبسط",
  "examTip": "تريكة الامتحان وسر الدرجة النهائية",
  "interactiveChallenge": {
    "question": "سؤال التحدي التفاعلي السريع للمشاهد؟",
    "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
    "correctIndex": 0,
    "explanation": "تفسير الإجابة الصحيحة بأسلوب مشجع"
  },
  "narrationScript": "النص الصوتي الكامل المكتوب للسرد الصوتي بدون رموز أو إيموجي",
  "visualPrompt": "Detailed visual background description for educational motion graphics",
  "tags": ["تعليم", "ريلز_تعليمي", "تريكات_امتحانات"]
}
`;
}
