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
    language?: string;
    is_language_learning?: boolean;
  };
  timeline: TimelineStep[];
}

export interface InteractiveExplanationParams {
  content: string;
  title: string;
  mode?: 'lesson_explanation' | 'full_curriculum_explanation';
  bookTitle?: string;
  grade_level?: string;
  category?: string;
  language?: 'ar' | 'en' | 'it' | 'fr' | 'de' | string;
  is_language_learning?: boolean;
  target_learning_language?: string;
}

/**
 * Builds the Master Multilingual Pedagogical Prompt for the V2 Interactive Explanation Engine
 * Supports: Arabic (ar), English (en), Italian (it), French (fr), German (de)
 * Supports Bilingual Language-Learning Mode (e.g. Learning Italian/English for Arabic speakers)
 */
export function buildInteractiveExplanationPrompt(params: InteractiveExplanationParams): string {
  const mode = params.mode || 'lesson_explanation';
  const lang = (params.language || 'ar').toLowerCase();
  const isLanguageLearning = Boolean(params.is_language_learning);
  const targetLang = (params.target_learning_language || 'it').toLowerCase();

  // 1. 🌍 BILINGUAL LANGUAGE LEARNING MODE (e.g. Teaching Italian/English/French/German to Arabic speakers)
  if (isLanguageLearning) {
    const langNames: Record<string, string> = {
      it: "اللغة الإيطالية (Italiano)",
      en: "اللغة الإنجليزية (English)",
      fr: "اللغة الفرنسية (Français)",
      de: "اللغة الألمانية (Deutsch)",
      es: "اللغة الإسبانية (Español)"
    };
    const targetLangName = langNames[targetLang] || targetLang;

    return `أنت البروفيسور وخبير اللغويات والتعليم التفاعلي لمنصة "ebook osera ai".
مهمتك إنشاء حصة تفاعلية متزامنة لـ **تعليم ${targetLangName}** للناطقين بالعربية، تجمع بين:
1. الشرح التفاعلي الذكي بين (كريم: طالب ذكي يتدرب على نطق وفهم اللغة، وفرح: أستاذة لغويات محترفة تشرح القواعد بالعربية وتلقي العبارات باللكنة الأصلية للغة الهدف).
2. اللوحة التفاعلية (Canvas) التي تعرض جداول المفردات (Vocabulary)، شفرات Mermaid لتراكيب الجمل والقواعد، وبطاقات التنبيه للأخطاء الشائعة في النطق والاستخدام.

القواعد الصارمة لحصة تعليم اللغات:
- الأستاذة "فرح" تشرح القاعدة اللغوية وسياق الاستخدام بالعربية الفصحى البسيطة، وتنطق المفردات والجمل باللغة الأجنبية الهدف (${targetLang}) بنطق أصيل سليم ومشكول أو مكتوب بدقة.
- الطالب "كريم" يسأل بالعربية، ويردد الكلمات أو يحاول تكوين جمل باللغة الأجنبية لتصحيحها له فرح.
- اللوحة التفاعلية: تعرض ترجمة المفردات الأجنبية بالعربية، أمثلة توضيحية، ومخطط Mermaid يوضح تصريف الأفعال أو تركيب الجملة.
- 🚫 لا توقفات أو أسئلة امتحان مقاطعة أثناء الحوار، الشرح سلس واسترسالي 100%.

الموضوع / الدرس: "${params.title}"
المقرر: "${params.bookTitle || params.title}"
اللغة الهدف لتعليمها: "${targetLangName}"

محتوى الدرس:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

أرجع JSON فقط بنفس المخطط التالي:
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "general_book",
    "target_tone": "حصة تفاعلية ممتعة ومبسطة لتعليم اللغة",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "ملخص أهم الكلمات والقواعد والمحادثات التي تم تعلمها في هذا الدرس",
    "language": "ar",
    "is_language_learning": true
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "مرحباً يا أستاذة فرح، اليوم سنتعلم موضوع: ${params.title}، كيف نبدأ؟",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "مقدمة الدرس - ${params.title}",
          "subtitle": "تعلم ${targetLangName}",
          "bullet_points": ["المفردات الأساسية", "القاعدة النحوية المحورية", "محادثة يومية واقعية"],
          "highlight_text": "الهدف: إتقان نطق واستخدام عبارات هذا الدرس بثقة"
        }
      }
    },
    {
      "step": 2,
      "speaker": "farah",
      "audio_text": "أهلاً بك يا كريم! سنبدأ بأهم العبارات التأسيسية التي يجب أن تحفظها وتفهم تركيبها جيداً...",
      "trigger_time_seconds": 8,
      "canvas_action": {
        "type": "mermaid_diagram",
        "payload": {
          "title": "هيكل تكوين الجملة والتراكيب",
          "mermaid_code": "graph LR\\nA[\\"الفاعل / Subject\\"] --> B[\\"الفعل / Verb\\"]\\nB --> C[\\"المفعول / Object\\"]"
        }
      }
    }
  ]
}`;
  }

  // 2. 🇬🇧 ENGLISH NATIVE CURRICULUM
  if (lang === 'en') {
    return `You are the lead academic pedagogical AI expert for "ebook osera ai".
Your mission is to transform the provided educational book/chapter content into a world-class, Stanford/MIT caliber synchronized dual-speaker audio & interactive visual explanation.

Speakers:
- Alex (Speaker 'karim' in JSON): Highly curious, sharp student who asks penetrating conceptual questions, seeks practical engineering/scientific applications, and clarifies intricacies.
- Emma (Speaker 'farah' in JSON): Brilliant, articulate master professor who deconstructs complex topics into crystal-clear mental models with zero fluff.

Strict Rules:
1. ZERO interruptions or quiz questions (No "answer this question" or "test your skills"). 100% continuous, deep, captivating conceptual instruction.
2. Rich substance: equations, concrete numeric examples, mechanisms, and real-world paradigms.
3. Canvas Synchronization: Every step triggers a visually rich canvas action:
   - "info_card" with high-impact bullets and core laws.
   - "mermaid_diagram" (graph TD or graph LR with clean labels) mapping concepts.
   - "highlight_box" revealing common exam pitfalls, counter-intuitive tricks, and golden rules.
4. Language: Natural, fluent, engaging English.

Subject/Topic: "${params.title}"
Book Title: "${params.bookTitle || params.title}"
Grade/Level: "${params.grade_level || 'Higher Education'}"
Mode: "${mode}"

Content to Deconstruct:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

Output STRICT JSON only:
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "university",
    "target_tone": "Engaging, rigorous, world-class academic explanation",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "Comprehensive breakdown of key principles, derivation steps, and applications",
    "language": "en"
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "Emma, looking into ${params.title}, what is the foundational intuition behind this concept?",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "Core Concept: ${params.title}",
          "subtitle": "Foundational Intuition & Architecture",
          "bullet_points": ["First-principles breakdown", "Critical operational laws", "Empirical evidence"],
          "highlight_text": "The cornerstone principle that dictates this whole mechanism"
        }
      }
    },
    {
      "step": 2,
      "speaker": "farah",
      "audio_text": "That's exactly where most textbooks get it backward! To truly understand ${params.title}, we must examine how the underlying components interact...",
      "trigger_time_seconds": 10,
      "canvas_action": {
        "type": "mermaid_diagram",
        "payload": {
          "title": "System Architecture & Concept Hierarchy",
          "mermaid_code": "graph TD\\nA[\\"Primary Input\\"] --> B[\\"Core Transformation\\"]\\nB --> C[\\"Validated Output\\"]"
        }
      }
    }
  ]
}`;
  }

  // 3. 🇮🇹 ITALIAN NATIVE CURRICULUM
  if (lang === 'it') {
    return `Sei il massimo esperto pedagogico e accademico di "ebook osera ai".
Il tuo compito è trasformare il contenuto didattico fornito in una straordinaria spiegazione interattiva a due voci (Marco e Sofia) con lavagna visiva sincronizzata, interamente in lingua ITALIANA fluente, colta e appassionante.

Personaggi:
- Marco (Speaker 'karim'): Studente acuto, brillante e curioso.
- Sofia (Speaker 'farah'): Docente appassionata e magistrale che scompone le nozioni con chiarezza assoluta.

Regole ferree:
1. NESSUNA interruzione con quiz o domande d'esame nel dialogo audio. Spiegazione accademica continua, profonda e coinvolgente.
2. Lavagna Canvas sincronizzata con "info_card", diagrammi "mermaid_diagram" (graph TD/LR) e "highlight_box" per i punti cruciali.
3. Lingua: Italiano impeccabile, naturale e moderno.

Titolo del tema: "${params.title}"
Materia: "${params.bookTitle || params.title}"

Contenuto scientifico:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

Restituisci SOLO un JSON valido secondo questo schema:
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "secondary",
    "target_tone": "Spiegazione accademica brillante e coinvolgente",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "Sintesi approfondita dei concetti chiave e delle applicazioni pratiche",
    "language": "it"
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "Sofia, affrontando ${params.title}, qual è l'intuizione fondamentale che dobbiamo comprendere fin da subito?",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "Concetto Chiave: ${params.title}",
          "subtitle": "Intuizione fondamentale",
          "bullet_points": ["Principio di base", "Applicazioni dirette", "Approfondimento critico"],
          "highlight_text": "La regola d'oro che governa questo argomento"
        }
      }
    }
  ]
}`;
  }

  // 4. 🇫🇷 FRENCH NATIVE CURRICULUM
  if (lang === 'fr') {
    return `Vous êtes l'expert pédagogique et académique suprême de la plateforme "ebook osera ai".
Votre mission est de transformer le contenu du cours en une expérience d'explication interactive synchronisée à deux voix (Julien et Camille) avec un tableau interactif dynamique, entièrement en FRANÇAIS fluide et élégant.

Personnages:
- Julien (Speaker 'karim'): Étudiant perspicace et curieux posant des questions percutantes.
- Camille (Speaker 'farah'): Enseignante brillante et méthodique décortiquant les concepts avec clarté.

Règles strictes:
1. AUCUNE interruption pour des quiz dans le dialogue audio. Explication académique fluide et continue à 100%.
2. Synchronisation visuelle sur le Canvas (cartes notionnelles, diagrammes Mermaid et boîtes de synthèse).
3. Langue: Français naturel, académique et précis.

Titre du cours: "${params.title}"
Livre: "${params.bookTitle || params.title}"

Contenu:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

Renvoyez UNIQUEMENT un objet JSON valide suivant ce format:
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "secondary",
    "target_tone": "Explication pédagogique captivante et rigoureuse",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "Synthèse structurée des notions clés et des règles méthodologiques",
    "language": "fr"
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "Camille, en abordant ${params.title}, quelle est l'intuition centrale qu'il faut absolument saisir ?",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "Concept Fondamental: ${params.title}",
          "subtitle": "Intuition clé",
          "bullet_points": ["Définition essentielle", "Mécanisme scientifique", "Exemple concret"],
          "highlight_text": "La règle d'or pour maîtriser ce chapitre"
        }
      }
    }
  ]
}`;
  }

  // 5. 🇩🇪 GERMAN NATIVE CURRICULUM
  if (lang === 'de') {
    return `Sie sind der führende pädagogische Experte für die Plattform "ebook osera ai".
Ihre Aufgabe ist es, die Lehrinhalte in eine synchronisierte interaktive Lernerfahrung mit zwei Stimmen (Felix und Laura) und visueller Canvas-Unterstützung zu verwandeln, komplett in fließendem, präzisem DEUTSCH.

Charaktere:
- Felix (Speaker 'karim'): Aufgeweckter, neugieriger Student.
- Laura (Speaker 'farah'): Hervorragende Dozentin mit kristallklarer Didaktik.

Strenge Regeln:
1. KEINE Quiz-Unterbrechungen im Audiodialog. Kontinuierliche, tiefgehende wissenschaftliche Erklärung.
2. Synchronisierte Canvas-Aktionen mit Konzeptkarten, Mermaid-Diagrammen und Highlight-Boxen.
3. Sprache: Klares, didaktisch hochwertiges Deutsch.

Thema: "${params.title}"
Buch: "${params.bookTitle || params.title}"

Inhalt:
${params.content.substring(0, mode === 'full_curriculum_explanation' ? 14000 : 6000)}

Geben Sie NUR ein gültiges JSON-Objekt aus:
{
  "metadata": {
    "title": "${params.title}",
    "mode": "${mode}",
    "detected_level": "secondary",
    "target_tone": "Strukturierte, fesselnde akademische Erklärung",
    "total_estimated_duration_seconds": 0,
    "summary_overview": "Umfassende Zusammenfassung der Kernprinzipien und Anwendungen",
    "language": "de"
  },
  "timeline": [
    {
      "step": 1,
      "speaker": "karim",
      "audio_text": "Laura, wenn wir uns ${params.title} ansehen, was ist die grundlegende Intuition dahinter?",
      "trigger_time_seconds": 0,
      "canvas_action": {
        "type": "info_card",
        "payload": {
          "title": "Kernkonzept: ${params.title}",
          "subtitle": "Grundlegende Intuition",
          "bullet_points": ["Wissenschaftliches Prinzip", "Praxisbeispiel", "Methodischer Aufbau"],
          "highlight_text": "Die goldene Regel zur Beherrschung dieses Themas"
        }
      }
    }
  ]
}`;
  }

  // 6. 🇪🇬 ARABIC NATIVE CURRICULUM (Default)
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
   - ادخل فوراً في صلب المفاهيم والقوانين العلمية، النظريات، المصطلحات، والأمثلة الرقمية والواقعية المستخرجة مباشرة من نص المحتوى.
   - قسّم الشرح في تسلسل منطقي محكم: مدخل علمي، تفكيك المفهوم مع مخطط Mermaid، كشف فخاخ الامتحانات (highlight_box)، ومسألة عملية محلولة.

3. 🎙️ التشكيل اللغوي الصوتي الفصيح الدقيق (Audio Phonetics & Tashkeel):
   - يجب تشكيل الكلمات في حقل "audio_text" تشكيلاً نحوياً وصرفياً دقيقاً بالحركات (الفتحة، الضمة، الكسرة، السكون، التنوين، والشدة) لضمان خروج نطق محركات الصوت (Google Cloud Chirp3-HD / Neural) بأعلى فخامة ونقاء.

4. 👥 ديناميكية الحوار الذكي بين الشخصيات (Karim & Farah Dynamics):
   - "كريم": طالب ذكي، لماح، يسأل عن أسرار القوانين، يطلب أمثلة عملية توضيحية، ويربط بين الأفكار.
   - "فرح": معلمة عبقرية متمكنة، تشرح بتبسيط عميق، تعطي حلولاً منهجية وتوضح أدق الفروق والملاحظات.

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
    "summary_overview": "ملخص شامل ومركز لأهم مخرجات التعلم في هذا المحتوى",
    "language": "ar"
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
