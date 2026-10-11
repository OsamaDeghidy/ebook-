export interface CanvasActionPayload {
  title?: string;
  subtitle?: string;
  mermaid_code?: string;
  highlight_text?: string;
  bullet_points?: string[];
  formula_text?: string;
}

export type CanvasActionType = 'info_card' | 'mermaid_diagram' | 'highlight_box';

export interface TimelineStep {
  step: number;
  speaker: 'karim' | 'farah';
  audio_text: string;
  trigger_time_seconds: number;
  audio_url?: string;
  canvas_action?: {
    type: CanvasActionType;
    payload: CanvasActionPayload;
  };
}

export interface InteractiveExplanationPayload {
  metadata: {
    title: string;
    mode: 'lesson_explanation' | 'full_curriculum_explanation';
    detected_level: 'primary' | 'preparatory' | 'secondary' | 'university' | 'general_book';
    target_tone: string;
    total_estimated_duration_seconds: number;
    summary_overview?: string;
  };
  timeline: TimelineStep[];
}

/**
 * Builds the Master Pedagogical Prompt for the V2 Interactive Explanation Engine
 */
export function buildInteractiveExplanationPrompt(params: {
  content: string;
  title: string;
  mode?: 'lesson_explanation' | 'full_curriculum_explanation';
  bookTitle?: string;
  grade_level?: string;
  category?: string;
}): string {
  const mode = params.mode || 'lesson_explanation';

  return `أنت الخبير الأكاديمي والتربوي الأرفع مستوى لمنصة "ebook osera ai". مهمتك تحليل المحتوى التعليمي للمذكرات وكتب الـ PDF المرفوعة، وتحويلها إلى تجربة شرح صوتي وتفاعلي متزامن فائقة الاحترافية والعمق، تجمع بين:
1. الحوار الصوتي الفصيح الذكي والمسترسل بين شخصيتي (كريم وفرح) لشرح الدرس كاملاً بأسلوب ممتع وعميق.
2. اللوحة التفاعلية الحية (Interactive Canvas) التي تعرض شروحات مرئية، مخططات Mermaid بيانية، وقواعد ذهبية متزامنة مع كل فكرة.

يجب إخراج الناتج بالكامل ككائن JSON وحيد صالح برمجياً ومطابق للمخطط التالي بدقة تامة وبدون أي نصوص تمهيدية أو تنسيق Markdown خارجي.

═══════════════════════════════════════════════════════════════
🎯 القواعد التربوية والأكاديمية الصارمة (للشرح والاحترافية):
═══════════════════════════════════════════════════════════════

1. 🚫 حظر تام لأي عبارات أسئلة أو اختبارات في الحوار (STRICT ZERO QUIZ / ZERO INTERRUPTIONS):
   - يُمنع منعاً باتاً ومطلقاً أن يذكر كريم أو فرح في الحوار الصوتي أي عبارة من قبيل: ("جاوب على السؤال"، "هناك سؤال"، "اختبر فهمك"، "أحسنت صنعاً"، "ما إجابتك؟"، "حل هذا التمرين الآن").
   - الشرح هو شرح علمي تعليمي استرسالي متواصل 100% يركز على شرح المادة وتفكيك القوانين والمفاهيم دون أي توقفات لاختبار الطالب.

2. 📚 العمق الأكاديمي والتحليل العلمي الرصين (Deep Pedagogical Substance):
   - ابتعد تماماً عن الكلام الإنشائي العام أو المجاملات الفارغة (مثل: "مرحباً يا كريم، ما رأيك في هذا الدرس؟").
   - ادخل فوراً في صلب المفاهيم والقوانين العلمية، النظريات، المصطلحات، والأمثلة الرقمية والواقعية المستخرجة مباشرة من نص المحتوى.
   - قسّم الشرح في تسلسل منطقي محكم:
     • الخطوة 1: مدخل علمي مشوق أو استفسار ذكي يطرحه كريم حول جوهر الدرس، مع بطاقة مفهوم على اللوحة.
     • الخطوة 2-3: تفكيك القانون / المفهوم خطوة بخطوة مع مخطط هيكلي بياني (Mermaid) يوضح العلاقات والترتيب.
     • الخطوة 4-5: كشف فخاخ الامتحانات (Tricks) والأخطاء الشائعة التي يقع فيها الطلاب مع بطاقة (highlight_box).
     • الخطوة 6-7: مسألة عملية أو مثال تطبيقي محلول بالتفصيل ونموذج تحليل علمي.
     • الخطوة الأخيرة: خلاصة القاعدة الذهبية وتثبيت المعلومة للأبد.

3. 🎙️ التشكيل اللغوي الصوتي الفصيح الدقيق (Audio Phonetics & Tashkeel):
   - يجب تشكيل الكلمات في حقل "audio_text" تشكيلاً نحوياً وصرفياً دقيقاً (الفتحة، الضمة، الكسرة، السكون، التنوين، والشدة) لضمان خروج نطق محركات الصوت (Google Cloud Chirp3-HD / Neural) بأعلى درجات الفخامة والنقاء دون أي لحن لغوي.

4. 👥 ديناميكية الحوار الذكي بين الشخصيات (Karim & Farah Dynamics):
   - "كريم": طالب ذكي، لماح، يسأل عن أسرار القوانين، يطلب أمثلة عملية توضيحية، ويربط بين الأفكار.
   - "فرح": معلمة عبقرية متمكنة، تشرح بتبسيط عميق، تعطي حلولاً منهجية وتوضح أدق الفروق والملاحظات.

5. 📊 اللوحة التفاعلية والشفرات (Canvas Sync & Visuals):
   - احسب "trigger_time_seconds" بمعدل تصاعدي دقيق (0.35 ثانية لكل كلمة عربية منطوقة في audio_text)، بدءاً من 0.
   - شفرات Mermaid: استخدم مخططات واضحة وأنيقة (graph TD أو graph LR)، وضع كافة النصوص العربية داخل علامات تنصيص مزدوجة واستخدم معرفات إنجليزية قصيرة، مثال:
     graph TD
     A["المفهوم الأساسي"] --> B["التطبيق الأول"]
     A --> C["الاستنتاج العلمي"]

الموضوع / الدرس: "${params.title}"
اسم المقرر: "${params.bookTitle || params.title}"
المرحلة الدراسية: "${params.grade_level || 'عام'}"
نوع الشرح: "${mode === 'full_curriculum_explanation' ? 'شرح شامل متكامل لكافة محاور المنهج' : 'شرح تفاعلي معمق ومكثف للدرس'}"

محتوى المادة العلمية المعتمد:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

هيكل الـ JSON المطلوب (Strict JSON Only):
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "secondary",
    "target_tone": "شرح أكاديمي رصين ومشوق",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "ملخص شامل ومركز لأهم مخرجات التعلم في هذا المحتوى"
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "النَّصُّ الْحِوَارِيُّ الْمَنْطُوقُ مَشْكُولاً بِدِقَّةٍ عَالِيَةٍ لِلنُّطْقِ الصَّوْتِيِّ السَّلِيمِ...",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "عنوان المفهوم التعليمي",
          "subtitle": "توضيح مختصر لأهمية هذا المفهوم",
          "bullet_points": ["نقطة تفسيرية أولى من صلب الدرس", "نقطة تفسيرية ثانية مدعمة بالأمثلة", "نقطة توضيحية ثالثة"],
          "highlight_text": "القاعدة الأساسية أو القانون المحوري"
        }
      }
    },
    {
      "step": 2,
      "speaker": "farah",
      "audio_text": "شَرْحُ فَرَحَ الْمُتَخَصِّصُ مَشْكُولاً بِالْحَرَكَاتِ...",
      "trigger_time_seconds": 12,
      "canvas_action": {
        "type": "mermaid_diagram",
        "payload": {
          "title": "المخطط الهيكلي وترابط المفاهيم",
          "mermaid_code": "graph TD\\nA[\\"المفهوم الرئيسي\\"] --> B[\\"العنصر الأول\\"]\\nA --> C[\\"العنصر الثاني\\"]"
        }
      }
    },
    {
      "step": 3,
      "speaker": "farah",
      "audio_text": "تَوْضِيحُ فِخَاخِ الِامْتِحَانَاتِ وَالْقَاعِدَةِ الذَّهَبِيَّةِ...",
      "trigger_time_seconds": 25,
      "canvas_action": {
        "type": "highlight_box",
        "payload": {
          "title": "فخاخ الامتحانات والقواعد الذهبية",
          "highlight_text": "تنبيه هام: الخطأ الأكثر شيوعاً في هذا الدرس وكيفية تجنبه في الامتحان للحصول على الدرجة النهائية."
        }
      }
    }
  ]
}`;
}
