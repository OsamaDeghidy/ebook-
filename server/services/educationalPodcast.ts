import { detectTeacherPersona } from "./teacherPersonas";

export interface PodcastDialogueExchange {
  speaker: "كريم" | "فرح" | "Alex" | "Farah";
  text: string;
}

export interface EducationalPodcastPayload {
  title: string;
  summary: string;
  transcript: PodcastDialogueExchange[];
  keyTakeaways: string[];
}

/**
 * Builds the Master Pedagogical Prompt for Two-Speaker Conversational Podcast
 */
export function buildEducationalPodcastPrompt(params: {
  chapterTitle: string;
  chapterContent: string;
  bookTitle?: string;
  category?: string;
  grade_level?: string;
}): string {
  const isArabic = /[\u0600-\u06FF]/.test(params.chapterContent);
  const persona = detectTeacherPersona({
    title: params.bookTitle,
    category: params.category,
    grade_level: params.grade_level,
    contentText: params.chapterContent,
  });

  if (isArabic) {
    return `
أنت مخرج ومحرر بودكاست تعليمي وثقافي رفيع المستوى (Osera Pedagogical Podcast Studio).
تخصص الدرس: ${persona.name} (${persona.title}).

المهمة:
إنشاء حوار صوتي تعليمي دافئ، ذكي، وممتع جداً بين مقدمين متميزين:
1. "كريم": محاور ذكي وفضولي، يمثل عقلية الطالب الشغوف، يطرح أسئلة جوهرية ويبحث عن الفائدة والتطبيقات الواقعية.
2. "فرح": معلمة وخبيرة تربوية متمكنة، تشرح المفاهيم ببساطة وتضرب أمثلة عملية من واقع الحياة وتبسط فخاخ الامتحانات.

الموضوع: "${params.chapterTitle}"
مصدر المحتوى:
${params.chapterContent.substring(0, 3500)}

🌟 قواعد الحوار الصارمة:
1. 🚫 يُمنع منعاً باتاً تكرار المناداة بالأسماء في بداية كل سطر (مثل "يا كريم" و "يا فرح"). يدخل المتحاوران فوراً في الأفكار والتفاعل العفوي الطبيعي.
2. 💡 التدرج المنطقي:
   - البداية: ربط الدرس بسؤال مشوق أو مشهد من واقع الحياة.
   - الوسط: تفكيك الفكرة الأساسية مع مثال عملي وتوضيح تريكة أو خطأ يقع فيه معظم الطلاب.
   - الختام: ملخص في سطرين للقاعدة الذهبية.
3. ⏱️ اكتب الحوار في 6 إلى 8 تبادلات حوارية مركزة وغنية.
4. 🎙️ التشكيل اللغوي البسيط على الكلمات المفتاحية لضمان نطق سليم وسلس.

OUTPUT FORMAT (VALID JSON ONLY):
{
  "title": "عنوان إذاعي جذاب للحلقة",
  "summary": "ملخص الحوار في سطرين يوضح القيمة المستفادة",
  "keyTakeaways": ["الفائدة الأولى", "الفائدة الثانية", "تريكة الامتحان"],
  "transcript": [
    { "speaker": "كريم", "text": "..." },
    { "speaker": "فرح", "text": "..." }
  ]
}
`;
  }

  return `
You are an elite educational podcast producer (Osera Pedagogical Podcast Studio).
Topic: "${params.chapterTitle}"
Content Source:
${params.chapterContent.substring(0, 3500)}

Create an engaging conversational dialogue between two hosts:
1. "Alex": Curious, inquisitive learner.
2. "Farah": Warm, knowledgeable expert educator.

Rules:
1. NO repetitive name-calling ("Hey Alex", "Hey Farah" on every sentence).
2. 6-8 rich, natural conversational exchanges breaking down the concepts and exam takeaways.

OUTPUT FORMAT (JSON ONLY):
{
  "title": "Catchy Podcast Title",
  "summary": "2-sentence executive summary",
  "keyTakeaways": ["Point 1", "Point 2"],
  "transcript": [
    { "speaker": "Alex", "text": "..." },
    { "speaker": "Farah", "text": "..." }
  ]
}
`;
}
