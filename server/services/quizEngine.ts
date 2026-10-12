import { detectTeacherPersona } from "./teacherPersonas";

export type QuestionFormat = 'mcq' | 'true_false_justify' | 'fill_blank' | 'matching' | 'reasoning';

export interface EducationalQuizQuestion {
  id?: string;
  question: string;
  type?: QuestionFormat;
  options: string[]; // Strict: Full substantive text, NEVER just letters or "أ/ب/ج"
  correctOptionIndex: number;
  explanation: string;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate";
  difficulty?: "easy" | "medium" | "hard";
  trapWarning?: string;
  // Specific type fields
  correctTerm?: string; // For fill_blank
  justification?: string; // For true_false_justify
  matchingPairs?: { item: string; match: string }[]; // For matching
  modelAnswer?: string; // For reasoning
  points?: number; // Marks for this question in exams
}

export interface ComprehensiveExam {
  id: string;
  book_id: string;
  title: string;
  scope: 'lesson' | 'unit' | 'full_curriculum';
  target_title: string; // e.g. "الوحدة الأولى: المادة والطاقة" or "الفصل الثالث"
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  questions: EducationalQuizQuestion[];
  instructions: string[];
  created_at: string;
}

/**
 * Builds Master Prompt for Bloom's Taxonomy Multi-Tiered Quiz Questions
 * Supports source language auto-detection (Arabic vs English/Target) and math symbol/LaTeX mandate
 */
export function buildEducationalQuizPrompt(params: {
  chapterTitle: string;
  chapterContent: string;
  bookTitle?: string;
  category?: string;
  grade_level?: string;
  count?: number;
}): string {
  const count = params.count || 5;
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  // BUG-2: Auto-detect source language
  const combinedSource = `${params.chapterTitle} ${params.chapterContent} ${params.bookTitle || ''}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedSource);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic. Output all questions, options, explanations, and warnings exclusively in Arabic. ZERO mixed languages.`
    : `TARGET LANGUAGE: English (or match textbook source language). The source material is in English/non-Arabic. You MUST generate ALL questions, options, explanations, and warnings strictly in English. STRICT BAN on generating Arabic text or mixed languages.`;

  const exampleQuestion = isArabic
    ? {
        question: "ما النتيجة العلمية المترتبة على رفع درجة حرارة التفاعل الماص للحرارة؟",
        options: [
          "زيادة سرعة التفاعل الكيميائي وزيادة قيمة ثابت الاتزان",
          "انخفاض سرعة التفاعل وتراجع كمية النواتج",
          "ثبات معدل التصادمات الفعالة بين الجزيئات",
          "توقف التفاعل نهائياً بسبب وصوله إلى حالة التشبع"
        ],
        explanation: "التفسير النموذجي: رفع درجة الحرارة يزود الجزيئات بطاقة حركية كافية لتجاوز طاقة التنشيط. احذر من افتراض أن جميع التفاعلات تتأثر بنفس الطريقة.",
        trapWarning: "تنبيه امتحاني: لا تخلط بين التفاعلات الماصة والطاردة للحرارة!"
      }
    : {
        question: "What is the expected outcome of increasing temperature in an endothermic reaction?",
        options: [
          "Reaction rate increases and the equilibrium constant shifts toward products",
          "Reaction rate decreases and product yield diminishes",
          "Effective molecular collision rate remains entirely constant",
          "The reaction completely ceases due to premature reactant saturation"
        ],
        explanation: "Model Answer: Increasing temperature supplies kinetic energy exceeding activation energy. Avoid confusing endothermic with exothermic shifts.",
        trapWarning: "Exam Trap Alert: Do not confuse equilibrium shift with reaction rate kinetics!"
      };

  return `
${persona.pedagogicalSystemPrompt}
You are the Senior Educational Assessment Specialist & Chief Examiner (Osera Diagnostic Engine).

TASK:
Create a rich, multi-dimensional diagnostic quiz of exactly ${count} diverse questions based on the lesson:
- Lesson Title: "${params.chapterTitle}"
- Course/Book: "${params.bookTitle || (isArabic ? 'المقرر التعليمي' : 'Academic Course')}"
- Textbook Content Slice:
"""
${params.chapterContent.substring(0, 5000)}
"""

🚨 CRITICAL ASSESSMENT INTEGRITY MANDATES (P0):
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE (P0):
   - Math expressions MUST use standard mathematical symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words.
     * NEVER write words like "أكبر من" or "greater than" inside mathematical expressions; write ">" instead.
     * NEVER write "أصغر من" or "less than"; write "<" instead.
   - Equations and formulas MUST be formatted in LaTeX:
     * Inline equations use $...$ (e.g. $x > 5$ or $E = mc^2$).
     * Block equations use $$...$$.
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. 🚫 STRICT BAN ON LITERAL LABELS IN OPTIONS:
   - 🚫 NEVER output options like ["أ", "ب", "ج", "د"], ["A", "B", "C", "D"], ["Option A", "Option B"], or ["True", "False"]!
   - Every single element in "options" MUST be a COMPLETE, ARTICULATE, INFORMATIVE PHRASE OR STATEMENT extracted directly from the subject matter!

4. DIVERSE QUESTION TYPES:
   Provide an engaging mix of questions across multiple formats:
   - "mcq": Multiple choice with 4 full substantive options.
   - "true_false_justify": A precise statement where options provide full substantive statements.
   - "fill_blank": A sentence with a blank (.....) testing a core scientific law, rule, or concept, with 4 full completion options.
   - "reasoning": A causal thinking question with 4 detailed analytical interpretations.

5. COGNITIVE BLOOM PROGRESSION:
   - Test understanding, practical application, relationship analysis, and common exam traps.

OUTPUT MUST BE VALID JSON ONLY:
{
  "questions": [
    {
      "question": "${exampleQuestion.question}",
      "type": "mcq",
      "options": ${JSON.stringify(exampleQuestion.options, null, 8)},
      "correctOptionIndex": 0,
      "explanation": "${exampleQuestion.explanation}",
      "bloomLevel": "apply",
      "difficulty": "medium",
      "trapWarning": "${exampleQuestion.trapWarning}"
    }
  ]
}
`;
}

/**
 * Builds Master Prompt for a Full Exam (Lesson, Unit, or Complete Curriculum)
 * Supports source language auto-detection and math formatting
 */
export function buildComprehensiveExamPrompt(params: {
  bookTitle: string;
  scope: 'lesson' | 'unit' | 'full_curriculum';
  targetTitle: string;
  contextText: string;
  questionCount?: number;
  grade_level?: string;
  category?: string;
}): string {
  const count = params.questionCount || 10;
  const duration = count <= 5 ? 15 : count <= 10 ? 30 : 45;
  const totalMarks = count * 2;

  const combinedSource = `${params.targetTitle} ${params.bookTitle} ${params.contextText}`;
  const isArabic = /[\u0600-\u06FF]/.test(combinedSource);

  const langMandate = isArabic
    ? `TARGET LANGUAGE: Modern Standard Arabic. Generate all exam titles, instructions, questions, options, and explanations in Arabic.`
    : `TARGET LANGUAGE: English (or match source). Generate all exam titles, instructions, questions, options, and explanations strictly in English with ZERO Arabic text.`;

  return `
You are the National Educational Examination Board Director & Senior Curriculum Evaluator.
Generate a formal, balanced, high-stakes EXAM for:
- Course: "${params.bookTitle}"
- Exam Scope: "${params.scope === 'full_curriculum' ? (isArabic ? 'امتحان شامل على كامل المنهج' : 'Comprehensive Curriculum Exam') : params.scope === 'unit' ? (isArabic ? `امتحان على الوحدة: ${params.targetTitle}` : `Unit Exam: ${params.targetTitle}`) : (isArabic ? `امتحان على درس: ${params.targetTitle}` : `Lesson Exam: ${params.targetTitle}`)}"
- Grade / Level: "${params.grade_level || 'General'}"
- Content Blueprint & Material:
"""
${params.contextText.substring(0, 15000)}
"""

REQUIREMENTS:
1. 🌐 LANGUAGE MANDATE:
   ${langMandate}

2. 📐 MATHEMATICAL & SCIENTIFIC NOTATION MANDATE:
   - Math expressions MUST use standard mathematical symbols (>, <, =, +, -, ×, ÷, ≤, ≥, ≠, ±) NOT words.
     * NEVER write "أكبر من" or "greater than" in mathematical expressions; write ">" instead.
   - Equations and formulas MUST be formatted in LaTeX: $...$ for inline, $$...$$ for block.
   - Numbers in formulas and equations MUST be Western digits (0-9).

3. Generate exactly ${count} rigorous diagnostic questions.
4. Mix formats: 60% MCQ (with 4 FULL informative choices), 20% True/False with Justification, 20% Cause-and-Effect / Reasoning.
5. 🚫 ZERO LITERAL LETTERS in options: Never write "أ أو ب" or "A or B".
6. Assign 2 marks per question.
7. Provide detailed model answer explanations for grading.

OUTPUT JSON FORMAT:
{
  "title": "${isArabic ? `امتحان رسمي معتمد: ${params.targetTitle || params.bookTitle}` : `Official Examination: ${params.targetTitle || params.bookTitle}`}",
  "scope": "${params.scope}",
  "target_title": "${params.targetTitle || params.bookTitle}",
  "duration_minutes": ${duration},
  "total_marks": ${totalMarks},
  "passing_marks": ${Math.round(totalMarks * 0.6)},
  "instructions": [
    "${isArabic ? 'اقرأ الأسئلة بتركيز ودقة قبل اختيار الإجابة.' : 'Read questions carefully before selecting your answer.'}",
    "${isArabic ? `الزمن المحدد للاختبار هو ${duration} دقيقة.` : `Allocated test duration is ${duration} minutes.`}",
    "${isArabic ? 'يتم حساب النتيجة والتصنيف المعرفي فور الانتهاء من الإجابات.' : 'Instant scoring and cognitive grading upon submission.'}"
  ],
  "questions": [
    {
      "question": "${isArabic ? 'نص السؤال الامتحاني الصريح والدقيق؟' : 'Clear and rigorous exam question statement?'}",
      "type": "mcq",
      "options": [
        "${isArabic ? 'الإجابة النموذجية الأولى كاملة الصياغة' : 'First complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الثانية كاملة الصياغة (فخ محتمل)' : 'Second complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الثالثة كاملة الصياغة' : 'Third complete substantive answer choice'}",
        "${isArabic ? 'الإجابة الرابعة كاملة الصياغة' : 'Fourth complete substantive answer choice'}"
      ],
      "correctOptionIndex": 0,
      "explanation": "${isArabic ? 'التعليل النموذجي لصحة هذا الاختيار وخطأ البدائل الأخرى.' : 'Model explanation detailing why this option is correct.'}",
      "bloomLevel": "analyze",
      "difficulty": "medium",
      "points": 2,
      "trapWarning": "${isArabic ? 'تنبيه: راجع المعطيات جيداً قبل الاستقرار على الحل' : 'Notice: Check all constraints before finalizing your choice'}"
    }
  ]
}
`;
}
