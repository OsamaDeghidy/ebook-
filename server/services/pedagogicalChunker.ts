import { detectTeacherPersona, TeacherPersona } from "./teacherPersonas";

export interface ChunkingDecision {
  isAtomic: boolean;
  reason: string;
  recommendedChapterCount: number;
  persona: TeacherPersona;
  specialInstructions: string;
}

/**
 * Deduplicates chapter titles by detecting repetitions and appending clean part numbers
 */
export function deduplicateChapterTitles(chapters: any[]): any[] {
  const seenTitles = new Map<string, number>();
  return chapters.map((ch, idx) => {
    let rawTitle = (ch.title || `الدرس ${idx + 1}`).trim();
    const count = seenTitles.get(rawTitle) || 0;
    seenTitles.set(rawTitle, count + 1);
    if (count > 0) {
      const newTitle = `${rawTitle} (الجزء ${count + 1})`;
      return { ...ch, title: newTitle };
    }
    return ch;
  });
}

/**
 * Evaluates whether educational material should be kept unified or divided into sub-lessons
 */
export function evaluatePedagogicalChunking(params: {
  textLength: number;
  title?: string;
  fileName?: string;
  category?: string;
  subcategory?: string;
  grade_level?: string;
  promptText?: string;
}): ChunkingDecision {
  const persona = detectTeacherPersona(params);

  // If text is short (under ~3,500 characters) or is explicitly a reading/listening comprehension story
  const isShortOrReadingText =
    params.textLength < 4000 ||
    params.title?.includes("قصة") ||
    params.title?.includes("نص استماع") ||
    params.title?.includes("قراءة متحررة") ||
    params.promptText?.includes("نص استماع") ||
    params.promptText?.includes("نص قراءة");

  if (isShortOrReadingText) {
    return {
      isAtomic: true,
      reason: "النص يمثل وحدة قراءة أو استماع متكاملة يجب الحفاظ عليها كاملة دون تقطيع لضمان السياق القصصي واللغوي للطالب.",
      recommendedChapterCount: 1,
      persona,
      specialInstructions: `
- 🚫 لا تقم بتقسيم هذا النص أو الدرس إلى فصول فرعية مصطنعة.
- احتفظ بالدرس كوحدة متكاملة واحدة تحت عنوانه الرسمي الأصلي.
- قدم النص الأصلي كاملاً أولاً دون حذف، ثم اشرح المعاني والتراكيب والأسئلة الشاملة.
      `,
    };
  }

  // If the document is medium to large (e.g. a full unit or textbook module)
  const estimatedChapters = Math.min(12, Math.max(3, Math.round(params.textLength / 4500)));

  return {
    isAtomic: false,
    reason: `المحتوى غني ويتضمن عدة وحدات معرفية مستقلة، يتم تقسيمه إلى فصول تعليمية متدرجة تتبع التسلسل الوزاري الرسمي.`,
    recommendedChapterCount: estimatedChapters,
    persona,
    specialInstructions: `
- التزم بالتسلسل المنهجي الرسمي للفهرس.
- حافظ على العناوين الرسمية الدقيقة لكل درس كما وردت في الكتاب.
- إذا كان هناك درس طويل جداً يضم أكثر من محور، قسمه منطقياً (مثلاً: الدرس 1: الشرح والمفاهيم، الدرس 2: التطبيقات والمسائل).
    `,
  };
}

/**
 * Builds the Master Pedagogical Prompt for Ebook/Course Generation
 * Incorporates:
 * - BUG-2: Source language auto-detection (Arabic vs English/Target)
 * - BUG-3: Mathematical LaTeX & symbols mandate
 * - BUG-7: Stripping artifacts, parenthetical side notes, and page numbers
 */
export function buildMasterPedagogicalPrompt(params: {
  title?: string;
  fileName?: string;
  category?: string;
  subcategory?: string;
  grade_level?: string;
  semester?: string;
  academic_year?: string;
  promptText?: string;
  textLength: number;
}): { prompt: string; persona: TeacherPersona } {
  const decision = evaluatePedagogicalChunking(params);
  const { persona } = decision;

  // Auto-detect language
  const combinedContext = `${params.title || ''} ${params.fileName || ''} ${params.promptText || ''}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedContext);

  const langMandate = isArabic
    ? `TARGET OUTPUT LANGUAGE: Modern Standard Arabic. Generate all unit titles, chapter titles, content explanations, vocabulary, and quizzes strictly in Arabic. ZERO language mixing.`
    : `TARGET OUTPUT LANGUAGE: English (or match textbook language). Since source material is English/foreign language, ALL titles, content, summaries, quizzes, and flashcards MUST be in English. NEVER generate Arabic text.`;

  const prompt = `
${persona.pedagogicalSystemPrompt}

📚 METADATA & CONTEXT:
- Course/Document Title: "${params.title || params.fileName || 'المقرر التعليمي المعتمد'}"
- Category: "${params.category || 'academic_curriculum'}"
- Grade / Audience: "${params.grade_level || 'عام'}"
- Term/Semester: "${params.semester || 'الفصل الدراسي الأول'}"
- Academic Year: "${params.academic_year || '2026/2025'}"
- Teacher Persona: "${persona.name} (${persona.title})"
- Recommended Interactive Lab: "${persona.recommendedLabType}"

🎯 MASTER PEDAGOGICAL INSTRUCTIONS:
1. 🌐 LANGUAGE MANDATE (P0):
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC FORMULA MANDATE (P0):
   - Math expressions MUST use symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words.
     * NEVER write words like "أكبر من" or "greater than" inside mathematical equations; write ">" instead.
     * NEVER write "أصغر من" or "less than"; write "<" instead.
   - Equations and scientific laws MUST be LaTeX ($...$ inline, $$...$$ block).
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. 🧹 CLEAN CONTENT & ARTIFACT STRIPPING MANDATE (P0):
   - 🚫 STRIP parenthetical exam notes and year tags (e.g. "(دور أول 2022)" or "(امتحان 2021)").
   - 🚫 STRIP OCR bullet symbols and scanning artifacts (▲, ▼, ◆, ◇, ■, ★).
   - 🚫 STRIP standalone page numbers (e.g. "ص 15", "صفحة 24", "[12]").
   - 🚫 STRIP redundant English translations in parentheses inside Arabic text paragraphs.

4. STRICT AUTHENTIC LESSON TITLES & NO DUPLICATES:
   - Extract and preserve the EXACT official lesson titles from the source material.
   - 🚫 NEVER generate duplicate or colliding titles across chapters. If a topic has multiple parts, name them: "[Title] - Part 1", "[Title] - Part 2".
   - 🚫 NEVER generate synthesized, generic or blended titles (e.g. NEVER make titles like "نصوص الاستماع والقراءات البيئية والتاريخية").
   - If a chapter represents a reading or listening passage, strictly name it: "نص استماع متحرر: [عنوان الدرس]".

5. LESSON ATOMICITY & CHUNKING LOGIC:
   ${decision.specialInstructions}

6. HIGH-QUALITY RICH CONTENT (Markdown):
   - Every chapter's 'content' must be rich, structured, and instructional (NOT a brief 2-sentence summary).
   - Follow the specialized persona section layout.
   - 🚫 NEVER output raw table dashes like "| ---: |" or broken table syntax in text. Use standard markdown tables with content.
   - Explain intuition before formulas. Include worked examples and exam traps.

7. MULTI-TIER BLOOM'S TAXONOMY QUIZ:
   - Provide 3-4 deep multiple-choice questions per chapter.
   - Options must be full substantive choices, and explanations must explain WHY the correct answer is right and WHY other options are common traps.

8. ACTIVE RECALL FLASHCARDS & MIND MAP:
   - 4-6 flashcards with concise, memorable front/back pairs.
   - 4-8 hierarchical Mind Map nodes with logical parentId connections.

User Guidance / Direct Teacher Notes: "${params.promptText || `حول هذا المستند إلى منهج تفاعلي عالي الجودة مع الحفاظ التام على المسميات الرسمية.`}"
`;

  return { prompt, persona };
}
