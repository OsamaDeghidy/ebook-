import { detectTeacherPersona } from "./teacherPersonas";

export interface EducationalQuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate";
  difficulty?: "easy" | "medium" | "hard";
  trapWarning?: string;
}

/**
 * Builds Master Prompt for Bloom's Taxonomy Multi-Tiered Quiz Questions
 */
export function buildEducationalQuizPrompt(params: {
  chapterTitle: string;
  chapterContent: string;
  bookTitle?: string;
  category?: string;
  grade_level?: string;
  count?: number;
}): string {
  const count = params.count || 4;
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  return `
You are the world's leading Educational Assessment Specialist & Senior Examiner (Osera Assessment Engine).
Role: ${persona.name} (${persona.title}).

Create a high-yield diagnostic quiz with ${count} questions based on this lesson:
- Lesson Title: "${params.chapterTitle}"
- Course/Book: "${params.bookTitle || 'المقرر التعليمي'}"
- Content:
${params.chapterContent.substring(0, 4000)}

🌟 EXAM QUALITY & BLOOM'S TAXONOMY MANDATES:
1. PROGRESSIVE COGNITIVE TIERS:
   - Question 1 (Comprehension/Recall): Tests foundational definitions, facts, or main reading ideas.
   - Question 2 (Application): Tests applying the rule/formula/grammar in a real scenario or numerical/grammatical problem.
   - Question 3 (Analysis & Cause-Effect): Tests finding relationships, differences, or interpreting graphs/tables.
   - Question 4 (Higher-Order Thinking & Exam Trap): Specifically targets the most common pitfall that tricks students in exams.
2. PLAUSIBLE DISTRACTORS:
   - All 4 options must be realistic and scientifically plausible (no obviously absurd joke options).
3. MODEL ANSWER & EXPLANATION:
   - Explain step-by-step why the correct choice is right.
   - Explicitly point out why the deceptive distractor is a trap.

OUTPUT MUST BE VALID JSON ONLY:
{
  "questions": [
    {
      "question": "نص السؤال الدقيق والواضح؟",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "correctOptionIndex": 0,
      "explanation": "التفسير النموذجي: الإجابة الصحيحة هي ... لأن ... واحذر من الخيار (...) لأنه فخ يقع فيه من يغفل عن ...",
      "bloomLevel": "apply",
      "difficulty": "medium",
      "trapWarning": "تنبيه: انتبه للشرط في السؤال ولا تتسرع"
    }
  ]
}
`;
}
