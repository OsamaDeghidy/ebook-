import { SyllabusLessonBlueprint } from "./documentBlueprint";
import { TeacherPersona } from "./teacherPersonas";

/**
 * Builds the Master Grounded Prompt for a specific batch of lessons
 */
export function buildGroundedBatchPrompt(params: {
  lessons: SyllabusLessonBlueprint[];
  persona: TeacherPersona;
  bookTitle: string;
  grade_level?: string;
  category?: string;
  semester?: string;
}): string {
  const { lessons, persona, bookTitle, grade_level, category, semester } = params;

  // Auto-detect language
  const combinedText = `${bookTitle} ${lessons.map(l => `${l.lesson_title} ${l.raw_text_snippet}`).join(' ')}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedText);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic. Output all titles, content, summaries, quizzes, and flashcards strictly in Arabic.`
    : `TARGET LANGUAGE: English (or match source). Output all titles, content, summaries, quizzes, and flashcards strictly in English with ZERO Arabic text.`;

  const lessonsContext = lessons.map((l) => `
===================================================================
📖 LESSON ${l.lesson_order}: "${l.lesson_title}"
${l.unit_title ? `Unit: "${l.unit_title}"` : ''}
Internal Sub-Topics to thoroughly explain:
${l.sub_topics.map(t => `  - ${t}`).join('\n')}

${l.key_terms && l.key_terms.length > 0 ? `Key Terms & Rules in Source:\n${l.key_terms.map(k => `  - ${k.term}: ${k.definition}`).join('\n')}` : ''}

AUTHENTIC SOURCE TEXTBOOK / BOOKLET SLICE FOR LESSON ${l.lesson_order}:
"""
${l.raw_text_snippet.substring(0, 15000)}
"""
===================================================================
`).join('\n\n');

  return `
${persona.pedagogicalSystemPrompt}

🎯 MASTER GROUNDED CURRICULUM SYNTHESIS MISSION:
You are generating ${lessons.length} distinct, deeply grounded interactive learning chapters for the course: "${bookTitle}".
Target Audience / Grade: "${grade_level || 'عام'}" - Category: "${category || 'academic_curriculum'}" - Term: "${semester || 'الفصل الدراسي الأول'}"
Teacher Persona: "${persona.name} (${persona.title})"

SOURCE MATERIAL FOR THIS BATCH:
${lessonsContext}

🚨 CRITICAL MANDATORY GENERATION RULES (P0):
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE (P0):
   - Math expressions MUST use symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words (NEVER write 'أكبر من' in math; use '>').
   - Equations and formulas MUST be formatted in LaTeX: $...$ for inline, $$...$$ for block.
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. 🧹 CLEAN CONTENT & ARTIFACT STRIPPING (P0):
   - 🚫 STRIP parenthetical exam notes and year tags (e.g. "(دور أول 2022)" or "(امتحان 2021)").
   - 🚫 STRIP OCR bullet symbols and scanning artifacts (▲, ▼, ◆, ◇, ■, ★).
   - 🚫 STRIP standalone page numbers (e.g. "ص 15", "صفحة 24", "[12]").
   - 🚫 STRIP redundant English translations in parentheses inside Arabic text paragraphs.

4. STRICT ANCHORING TO SOURCE TEXT (NO SUPERFICIAL HALLUCINATIONS):
   - Every single chapter MUST be built directly from its dedicated source text slice above.
   - Do NOT just look at the title and invent generic web content. You MUST include the actual explanations, reading passages, poems, vocabulary tables, scientific laws, and worked examples present in the booklet slice!

5. FIVE MANDATORY PEDAGOGICAL PILLARS IN CHAPTER MARKDOWN CONTENT:
   Each chapter's 'content' field MUST be formatted in rich GitHub Flavored Markdown with this exact canonical structure:
   - \`## [عنوان الدرس الرسمي الأصلي]\`
   - \`### 📜 النص القرائي / المصدر الأصلي الكامل\` (The complete, unedited source text/story/equations from the slice).
   - \`### 🔍 تفكيك الأفكار والمفاهيم الفرعية المشروحة\` (Deep paragraph-by-paragraph conceptual explanation covering all sub-topics).
   - \`### 📚 معجم المفردات والقواعد والقوانين\` (Formatted vocabulary definitions, grammatical rules, or scientific laws).
   - \`### 📐 الأمثلة التطبيقية والمسائل المحلولة\` (Step-by-step worked exercises and real-world examples).
   - \`### 💡 تنبيهات الفخاخ والتقويم التشخيصي\` (Exam traps warning: "انتبه: يقع أغلب الطلاب في خطأ كذا").

6. NO DASHED MARKDOWN TABLES:
   - 🚫 NEVER use markdown pipe tables with dashed rows (\`| ---: |\`). Format tables as clean text cards or bulleted key-value lists.

7. ACCURATE BLOOM QUIZZES & FLASHCARDS:
   - Generate 4 to 6 diagnostic quiz questions per chapter directly referencing the source text.
   - For each quiz question, provide the cognitive level (تذكر، فهم، تطبيق، تحليل) and a detailed explanation of why the correct answer is true.
   - Generate 4 to 6 flashcards per chapter covering the key concepts.
`;
}
