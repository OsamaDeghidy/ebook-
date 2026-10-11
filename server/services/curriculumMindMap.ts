export interface CurriculumMindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  chapterTitle?: string;
  chapterIndex?: number;
  level?: 'root' | 'chapter' | 'concept' | 'subtopic';
  description: string;
  keyTakeaway?: string;
  category?: string;
  color?: string;
  icon?: string;
}

export interface CurriculumLearningMilestone {
  step: number;
  title: string;
  focus: string;
  keyConcepts: string[];
}

export interface CurriculumMindMapPayload {
  title: string;
  courseTitle: string;
  totalChapters: number;
  summary: string;
  mermaidSyntax: string;
  nodes: CurriculumMindMapNode[];
  learningPath: CurriculumLearningMilestone[];
  generatedAt: string;
}

/**
 * Builds the Master Mind Map prompt for the complete curriculum
 */
export function buildCurriculumMindMapPrompt(params: {
  bookTitle: string;
  category?: string;
  grade_level?: string;
  chapters: { id: string; title: string; summary?: string; content?: string; concepts?: any[] }[];
}): string {
  const chaptersSummary = params.chapters.map((ch, idx) => {
    const conceptList = Array.isArray(ch.concepts) 
      ? ch.concepts.map((c: any) => typeof c === 'string' ? c : `${c.concept || c.title}`).join('، ')
      : '';
    const snippet = (ch.summary || ch.content || '').substring(0, 300).replace(/[\n\r]+/g, ' ');
    return `فصل ${idx + 1}: ${ch.title} | مفاهيم: ${conceptList || snippet.substring(0, 100)}`;
  }).join('\n');

  return `أنت كبير مهندسي الخرائط المعرفية والذهنية التفاعلية لمنصة "ebook osera ai".
المطلوب إنشاء خريطة ذهنية سريعة وعميقة وشاملة لكامل فصول المنهج الدراسي لمقرر: "${params.bookTitle}".

فصول المنهج:
${chaptersSummary}

المعايير:
1. الشمولية: تضمين كل فصل (${params.chapters.length} فصول) مع 2 إلى 3 مفاهيم جوهرية لكل فصل.
2. الدقة والإيجاز: نصوص العقد مختصرة ومعبرة (1 إلى 4 كلمات).
3. كود Mermaid أنيق وصحيح 100% (flowchart TD مع subgraphs لكل فصل).

أرجع الناتج بصيغة JSON فقط:
{
  "title": "الخريطة الذهنية الشاملة لمنهج ${params.bookTitle}",
  "courseTitle": "${params.bookTitle}",
  "totalChapters": ${params.chapters.length},
  "summary": "ملخص ترابط مفاهيم المنهج في سطرين...",
  "mermaidSyntax": "flowchart TD\\n  root[\\\"📚 ${params.bookTitle}\\\"]\\n  ...",
  "nodes": [
    {
      "id": "root",
      "label": "${params.bookTitle}",
      "parentId": null,
      "level": "root",
      "description": "الرؤية الشاملة لكافة فصول المقرر",
      "keyTakeaway": "الربط بين كافة الدروس يضمن الدرجة النهائية.",
      "color": "indigo"
    },
    {
      "id": "ch-1",
      "label": "عنوان الفصل الأول",
      "parentId": "root",
      "chapterTitle": "عنوان الفصل الأول",
      "chapterIndex": 1,
      "level": "chapter",
      "description": "مدخل وأساسيات هذا الفصل...",
      "keyTakeaway": "القاعدة الذهبية للفصل الأول",
      "color": "purple"
    },
    {
      "id": "c1-1",
      "label": "مفهوم رئيسي",
      "parentId": "ch-1",
      "chapterTitle": "عنوان الفصل الأول",
      "chapterIndex": 1,
      "level": "concept",
      "description": "شرح المفهوم والقانون...",
      "keyTakeaway": "نص القانون أو الملاحظة الامتحانية",
      "color": "cyan"
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "title": "المحطة الأولى: ...",
      "focus": "التركيز على ...",
      "keyConcepts": ["مفهوم 1", "مفهوم 2"]
    }
  ]
}`;
}
