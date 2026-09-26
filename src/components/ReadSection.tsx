import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Play, Square, FileText, Lightbulb, BookOpen, Volume2, 
  RefreshCw, Sigma, ShieldAlert, 
  Target, GraduationCap, LayoutGrid, Table2, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle2,
  ZoomIn, ZoomOut, Check
} from 'lucide-react';
import { Chapter } from '../types';
import { useGlobalAudio } from '../hooks/useGlobalAudio';
import { ContextualAiTutor } from './ai/ContextualAiTutor';

/**
 * Deep text sanitizer to remove escaped characters, format LaTeX smoothly into clear math typography,
 * remove English bracketed tokens from Arabic contexts, and clean raw callout tags.
 */
function sanitizeEducationalMarkdown(text: string | undefined): string {
  if (!text) return '';
  let cleaned = text.replace(/\\n/g, '\n').trim();

  // 1. Math symbols & LaTeX conversions to clean standard typography
  cleaned = cleaned.replace(/\\times\b/g, '×');
  cleaned = cleaned.replace(/\\div\b/g, '÷');
  cleaned = cleaned.replace(/\\pm\b/g, '±');
  cleaned = cleaned.replace(/\\leq?\b/g, '≤');
  cleaned = cleaned.replace(/\\geq?\b/g, '≥');
  cleaned = cleaned.replace(/\\neq\b/g, '≠');
  cleaned = cleaned.replace(/\\approx\b/g, '≈');
  cleaned = cleaned.replace(/\\cdot\b/g, '·');
  cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  // Clean raw LaTeX formatting like $$ \text{الاتجاهات} = ... $$ into clean readable text
  cleaned = cleaned.replace(/\$\$\s*\\text\{([^}]+)\}\s*=\s*\\{([^}]+)\\}\s*\$\$/g, '$1: $2');
  cleaned = cleaned.replace(/\$\$\s*\\text\{([^}]+)\}\s*\$\$/g, '$1');
  cleaned = cleaned.replace(/\\text\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\$\$(.*?)\$\$/g, ' $1 ');
  cleaned = cleaned.replace(/\$([^\$\n]+)\$/g, '$1');
  cleaned = cleaned.replace(/\\,/g, ' ');

  // 2. Remove English bracketed translations from predominantly Arabic text
  // e.g. (Place Value), (Value of the Digit), (Make a Ten), (PowerPoint Deck), (Deck), (Exam Pro Tip)
  cleaned = cleaned.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '');

  // 3. Remove raw callout tags
  cleaned = cleaned.replace(/\[!(IMPORTANT|WARNING|TIP|NOTE)\]/gi, '');

  // 4. Fix collapsed single-line tables and strip raw dashed separator rows
  cleaned = cleaned.replace(/^[ \t]*\|?[-:\s|]{3,}\|?[ \t]*$/gm, '');
  cleaned = cleaned.replace(/\|\s*[-:\s]{2,}\s*\|/g, '|');
  cleaned = cleaned.replace(/\|\s*\|\s*/g, '|\n| ');
  cleaned = cleaned.replace(/\|\|/g, '|\n|');

  // Strip any leading whitespace from table rows so they start at column 0
  cleaned = cleaned.replace(/^[ \t]*(\|.+)$/gm, '$1');

  // Ensure markdown tables have proper blank lines before and after
  cleaned = cleaned.replace(/([^\n])\n(\|.*?\|)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/(\|.*?\|)\n([^\n|])/g, '$1\n\n$2');

  return cleaned;
}

/**
 * Visual Comparison & Concept Cards Component
 * Converts plain markdown tables into modern, engaging, colorful concept cards
 */
function VisualComparisonCards({ headerCells, dataRows }: { headerCells: string[]; dataRows: string[][] }) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const cardIcons = ['🗺️', '🧭', '🔍', '📏', '💡', '📌', '⭐', '⚡', '📐', '🎯'];

  return (
    <div className="my-6 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-black text-indigo-900">
            {headerCells.join(' المقابلة لـ ') || 'عناصر ومفاهيم الدرس البصرية'}
          </span>
        </div>

        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>بطاقات بصرية 📇</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>جدول مقارنة 📊</span>
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {dataRows.map((row, rIdx) => {
            const title = row[0] || `عنصر ${rIdx + 1}`;
            const desc = row.slice(1).join(' - ') || '';
            const icon = cardIcons[rIdx % cardIcons.length];

            return (
              <div
                key={rIdx}
                className="group relative bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-5 rounded-2xl border-2 border-indigo-100/90 hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl shrink-0 p-2 bg-white rounded-xl shadow-xs border border-indigo-100 group-hover:scale-110 transition-transform">
                      {icon}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 block">
                        {headerCells[0] || 'العنصر الرئيسي'}
                      </span>
                      <h5 className="font-black text-sm sm:text-base text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {title}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-indigo-50 shadow-inner">
                  {headerCells[1] && (
                    <span className="text-[10px] font-bold text-amber-700 block mb-1">
                      ✨ {headerCells[1]}:
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-indigo-200/80 shadow-xs bg-white">
          <table className="w-full text-right text-xs sm:text-sm border-collapse min-w-[340px]">
            <thead className="bg-gradient-to-r from-indigo-50 to-teal-50/50 text-indigo-950 font-black border-b border-indigo-200">
              <tr>
                {headerCells.map((h, i) => (
                  <th key={i} className="p-3.5 text-xs sm:text-sm font-black text-indigo-900 border-l border-indigo-100/60 last:border-l-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-indigo-50/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3.5 text-xs sm:text-sm text-gray-800 border-l border-gray-100 last:border-l-0 font-medium leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Recursive raw text extractor from React nodes for safe condition checking
function extractRawText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractRawText).join(' ');
  if (node.props && node.props.children) return extractRawText(node.props.children);
  return '';
}

// Custom Markdown components for clean pedagogical rendering
const markdownComponents = {
  blockquote: ({ children }: any) => {
    const rawText = extractRawText(children);

    if (rawText.includes('قانون') || rawText.includes('قاعدة') || rawText.includes('هام') || rawText.includes('المحوري') || rawText.includes('IMPORTANT')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-r-4 border-amber-500 shadow-xs text-amber-950">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800 mb-1.5">
            <Sigma className="w-4 h-4 text-amber-600 shrink-0" />
            <span>قاعدة ومفهوم محوري</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    if (rawText.includes('تريكة') || rawText.includes('فخ') || rawText.includes('خطأ شائع') || rawText.includes('تنبيه') || rawText.includes('WARNING')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border-r-4 border-rose-500 shadow-xs text-rose-950">
          <div className="flex items-center gap-2 text-xs font-black text-rose-800 mb-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>تنبيه امتحاني وتريكة هامة</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    if (rawText.includes('نشاط') || rawText.includes('فكرة') || rawText.includes('نصيحة') || rawText.includes('تطبيق') || rawText.includes('استكشاف') || rawText.includes('TIP')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-r-4 border-emerald-500 shadow-xs text-emerald-950">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 mb-1.5">
            <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>إضاءة تربوية ونشاط تطبيقي</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    return (
      <blockquote className="my-4 p-4 rounded-2xl bg-indigo-50/70 border-r-4 border-indigo-500 text-indigo-950 font-medium text-xs sm:text-sm leading-relaxed">
        {children}
      </blockquote>
    );
  },
  h1: ({ children }: any) => (
    <h3 className="text-base sm:text-lg font-black text-indigo-950 mt-6 mb-3 pb-2 border-b border-indigo-100 flex items-center gap-2">
      <span className="w-2.5 h-5 rounded-full bg-indigo-600 inline-block"></span>
      {children}
    </h3>
  ),
  h2: ({ children }: any) => (
    <h4 className="text-sm sm:text-base font-black text-indigo-900 mt-5 mb-2.5 flex items-center gap-2">
      <span className="w-2 h-4 rounded-full bg-amber-500 inline-block"></span>
      {children}
    </h4>
  ),
  h3: ({ children }: any) => (
    <h5 className="text-xs sm:text-sm font-bold text-gray-800 mt-4 mb-2">
      {children}
    </h5>
  ),
  p: ({ children }: any) => {
    const rawText = extractRawText(children);

    if (rawText.includes('|')) {
      const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const sepIndex = lines.findIndex(l => l.includes('---') || l.includes(':--'));
      
      if (sepIndex > 0) {
        const headerLine = lines[sepIndex - 1];
        const headerCells = headerLine.split('|').map(c => c.trim()).filter(Boolean);
        const dataLines = lines.slice(sepIndex + 1).filter(l => l.includes('|') && !l.includes('---'));
        const dataRows = dataLines.map(row => row.split('|').map(c => c.trim()).filter(Boolean)).filter(r => r.length > 0);
        const leadLines = lines.slice(0, sepIndex - 1);

        if (headerCells.length > 0 && dataRows.length > 0) {
          return (
            <div className="space-y-2 my-3">
              {leadLines.length > 0 && (
                <p className="my-2 text-xs sm:text-sm text-gray-700 leading-relaxed font-bold">
                  {leadLines.join('\n')}
                </p>
              )}
              <VisualComparisonCards headerCells={headerCells} dataRows={dataRows} />
            </div>
          );
        }
      }

      // Handle direct pipe lists without dashed lines
      const cleanedLines = rawText
        .replace(/\|\s*[-:\s|]{2,}\s*\|/g, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.match(/^[-:\s|]+$/));

      const tableRows = cleanedLines
        .filter(l => l.includes('|'))
        .map(l => l.split('|').map(c => c.trim()).filter(Boolean))
        .filter(r => r.length >= 2);

      if (tableRows.length >= 2) {
        const headerCells = tableRows[0];
        const dataRows = tableRows.slice(1);
        return (
          <div className="space-y-2 my-3">
            <VisualComparisonCards headerCells={headerCells} dataRows={dataRows} />
          </div>
        );
      }
    }

    if (rawText.match(/^[-:\s|]{3,}$/)) {
      return null;
    }

    return (
      <p className="my-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
        {children}
      </p>
    );
  },
  ul: ({ children }: any) => (
    <ul className="my-3 space-y-2 list-disc list-inside text-xs sm:text-sm text-gray-700 pr-2">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-3 space-y-2 list-decimal list-inside text-xs sm:text-sm text-gray-700 pr-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto rounded-2xl border border-indigo-200/80 shadow-xs bg-white">
      <table className="w-full text-right text-xs sm:text-sm border-collapse min-w-[340px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-indigo-50 to-teal-50/50 text-indigo-950 font-black border-b border-indigo-200">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-gray-100">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="p-3.5 text-xs sm:text-sm font-black text-indigo-900 border-l border-indigo-100/60 last:border-l-0">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="p-3.5 text-xs sm:text-sm text-gray-800 border-l border-gray-100 last:border-l-0 font-medium leading-relaxed">
      {children}
    </td>
  ),
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto" dir="ltr">
        <code>{children}</code>
      </pre>
    );
  }
};

interface WorkedStep {
  stepNum: number;
  title: string;
  detail: string;
}

interface ChapterHubData {
  problemTitle: string;
  problemText: string;
  steps: WorkedStep[];
  goldenRule: string;
  comparisonItems: { title: string; desc: string; icon: string; badgeColor: string }[];
}

/**
 * Intelligent Dynamic Extractor for Worked Examples, Visual Comparisons, and Exam Tips.
 * Adapts dynamically to every individual chapter based on its title, content, concepts, quiz, and domain.
 */
function extractDynamicChapterHubData(chapter: Chapter): ChapterHubData {
  const title = chapter.title || 'الدرس الحالي';
  const summary = chapter.summary || '';
  const content = chapter.content || '';
  const combinedText = `${title} ${summary} ${content}`;
  
  // 1. DYNAMIC COMPARISON ITEMS (From chapter.concepts or content or flashcards)
  const colors = [
    { icon: '🔵', badgeColor: 'text-sky-300 border-sky-500/30 bg-sky-950/40' },
    { icon: '🟢', badgeColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40' },
    { icon: '🟣', badgeColor: 'text-purple-300 border-purple-500/30 bg-purple-950/40' },
    { icon: '🟠', badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-950/40' },
    { icon: '🔴', badgeColor: 'text-rose-300 border-rose-500/30 bg-rose-950/40' },
    { icon: '🟡', badgeColor: 'text-yellow-300 border-yellow-500/30 bg-yellow-950/40' },
  ];

  let rawConcepts: { title: string; desc: string }[] = [];

  // A. From chapter.concepts
  if (Array.isArray(chapter.concepts) && chapter.concepts.length > 0) {
    chapter.concepts.forEach((c: any) => {
      if (typeof c === 'string' && c.trim()) {
        const parts = c.split(/[:：\-–]/);
        if (parts.length > 1) {
          rawConcepts.push({ title: parts[0].trim(), desc: parts.slice(1).join(':').trim() });
        } else {
          rawConcepts.push({ title: c.trim(), desc: `مفهوم وتطبيق جوهري في درس ${title}.` });
        }
      } else if (c && typeof c === 'object') {
        const cTitle = c.concept || c.title || c.term || '';
        const cDesc = c.explanation || c.definition || c.description || '';
        if (cTitle) rawConcepts.push({ title: cTitle.trim(), desc: cDesc.trim() || `الخصائص والاستخدام العملي لـ (${cTitle}).` });
      }
    });
  }

  // B. From flashcards fallback
  if (rawConcepts.length < 2 && Array.isArray(chapter.flashcards) && chapter.flashcards.length > 0) {
    chapter.flashcards.forEach((f: any) => {
      if (f.front && f.back && rawConcepts.length < 4) {
        rawConcepts.push({ title: f.front.trim(), desc: f.back.trim() });
      }
    });
  }

  // C. Fallback: Parse bold terms from content
  if (rawConcepts.length < 2 && content) {
    const boldMatches = content.match(/\*\*([^\*]{2,30})\*\*[:：\s]*([^\n\.!\?]{15,120})/g);
    if (boldMatches) {
      boldMatches.slice(0, 4).forEach(m => {
        const sub = m.match(/\*\*([^\*]+)\*\*[:：\s]*(.*)/);
        if (sub && sub[1]) {
          rawConcepts.push({ title: sub[1].trim(), desc: sub[2].trim() || 'شرح وتطبيق المفهوم.' });
        }
      });
    }
  }

  // Final fallback if no concepts at all
  if (rawConcepts.length < 2) {
    rawConcepts = [
      { title: `المفهوم الأساسي لـ (${title})`, desc: summary ? (summary.substring(0, 140) + '...') : `القاعدة والهدف التعليمي المحوري لدرس ${title}.` },
      { title: `التطبيق والممارسة العملية`, desc: `كيفية توظيف واستخدام مفاهيم (${title}) في حل المسائل والمواقف الحياتية بدقة.` }
    ];
  }

  // Sanitize any bracketed English tokens from concepts
  rawConcepts = rawConcepts.map(item => ({
    title: item.title.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim(),
    desc: item.desc.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim()
  }));

  const comparisonItems = rawConcepts.slice(0, 4).map((item, idx) => {
    const colorStyle = colors[idx % colors.length];
    return {
      title: item.title,
      desc: item.desc,
      icon: colorStyle.icon,
      badgeColor: colorStyle.badgeColor
    };
  });

  // 2. DYNAMIC WORKED PROBLEM & STEPS & GOLDEN RULE
  let problemTitle = `تطبيق ومسألة عملية لدرس: ${title}`;
  let problemText = '';
  let steps: WorkedStep[] = [];
  let goldenRule = '';

  // Priority 1: Check if content has a structured worked example block (مثال محلول / مسألة)
  const exampleBlockMatch = content.match(/(?:###?\s*(?:مثال|مسألة|تطبيق|تدريب|مثال محلول|تطبيق عملي)[\s\S]*?)(?=\n###?|\n##|$)/i);
  if (exampleBlockMatch && exampleBlockMatch[0].length > 40) {
    const exText = exampleBlockMatch[0].replace(/^###?.*?\n/, '').trim();
    const lines = exText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length >= 2) {
      problemText = lines[0].replace(/^[ \t]*[\*\-\>\#\d\.\)]+/, '').trim();
      const stepLines = lines.slice(1).filter(l => /^(?:\d+[\.\-\)]|\-|\*|\(\d+\))/.test(l.trim()));
      if (stepLines.length >= 2) {
        steps = stepLines.slice(0, 3).map((sl, idx) => ({
          stepNum: idx + 1,
          title: `الخطوة ${idx + 1}: ${sl.split(/[:：]/)[0].replace(/^[\d\.\-\*\(\)\s]+/, '').trim() || 'التنفيذ والحل'}`,
          detail: sl.split(/[:：]/).slice(1).join(':').trim() || sl.replace(/^[\d\.\-\*\(\)\s]+/, '').trim()
        }));
      }
    }
  }

  // Priority 2: Use Chapter Quiz Question (grounded in the exact lesson)
  if ((!problemText || steps.length < 2) && Array.isArray(chapter.quiz) && chapter.quiz.length > 0) {
    const q = chapter.quiz[0];
    if (q && q.question) {
      problemTitle = `تحدي وتطبيق عملي نموذجي لدرس: ${title}`;
      problemText = q.question;
      
      const correctOption = (q.options && q.options[q.correctOptionIndex]) ? q.options[q.correctOptionIndex] : (q.options ? q.options[0] : '');
      const wrongOptions = (q.options || []).filter((_, i) => i !== q.correctOptionIndex).slice(0, 2);

      steps = [
        {
          stepNum: 1,
          title: 'تحليل المعطيات والمفهوم الأساسي',
          detail: `تحديد المطلوب بدقة من مسألة "${title}" ومراجعة المتغيرات والقواعد الحاكمة.`
        },
        {
          stepNum: 2,
          title: 'استبعاد البدائل الخاطئة وتطبيق القاعدة',
          detail: wrongOptions.length > 0
            ? `استبعاد الخيارات غير المتوافقة مع القاعدة (${wrongOptions.join(' ، ')}) والتحقق من صحة المعطيات.`
            : 'تطبيق القاعدة المباشرة والتحقق خطوة بخطوة من صحة خطوات الحل.'
        },
        {
          stepNum: 3,
          title: 'الحل والبرهان والنتيجة النهائية',
          detail: q.explanation || `الإجابة الصحيحة هي: (${correctOption}) بناءً على قواعد الدرس المعيارية.`
        }
      ];

      goldenRule = q.explanation || `في درس (${title})، تذكر دائماً ربط القاعدة بالمعطيات لتجنب الوقوع في فخ التسرع.`;
    }
  }

  // Priority 3: Nuanced Domain Fallbacks with Topic-Specific Formulas and Problem Statements
  if (!problemText || steps.length < 2) {
    const isAdditionSubtraction = /جمع|طرح|استراتيجيات|تقدير|تقريب/i.test(combinedText);
    const isMultiplicationDivision = /ضرب|قسمة|خوارزمية|مساحة المستطيل|توزيع/i.test(combinedText);
    const isFractionsDecimals = /كسر|كسور|عشري|أعشار|أجزاء من مائة/i.test(combinedText);
    const isGeometry = /هندسة|محيط|مساحة|أشكال|زوايا|أضلاع|مستطيل|مربع|مثلث/i.test(combinedText);
    const isFactorsMultiples = /عوامل|مضاعفات|أولية|ع\.م\.أ|م\.م\.أ|أنماط/i.test(combinedText);
    const isPlaceValue = /مكانية|صيغة ممتدة|أعداد كبيرة|ملايين|مليارات/i.test(combinedText);
    const isScienceAdaptation = /تكيف|بيئة|كائنات|حيوان|نبات|حواس|ضوء/i.test(combinedText);
    const isScienceEnergyMatter = /طاقة|حركة|سرعة|تصادم|مادة|حرارة|شغل/i.test(combinedText);
    const isSocialMaps = /خريط|موقع|بوصلة|إحداثيات|مقياس|رموز/i.test(combinedText);

    if (isAdditionSubtraction) {
      problemTitle = `تطبيق عملي ومسألة ذكية على: ${title}`;
      problemText = `احسب ناتج الجمع (٦٨ + ٢٧) وناتج الطرح (٩٤ - ٤٨) باستخدام استراتيجية الحساب العقلي (التعويض أو التحليل والتجميع).`;
      steps = [
        {
          stepNum: 1,
          title: 'استراتيجية التعويض في الجمع (تكوين العشرات)',
          detail: 'نضيف ٢ إلى العدد ٦٨ ليصبح ٧٠، ثم نجمع (٧٠ + ٢٧ = ٩٧)، وأخيراً نطرح ٢ المضافة ليصبح الناتج الدقيق (٩٥).'
        },
        {
          stepNum: 2,
          title: 'استراتيجية التحليل والتجميع في الطرح',
          detail: 'نفكك ٤٨ إلى (٤٠ + ٨). نطرح العشرات أولاً: (٩٤ - ٤٠ = ٥٤)، ثم نطرح الآحاد: (٥٤ - ٨ = ٤٦).'
        },
        {
          stepNum: 3,
          title: 'التحقق والمقارنة النهائية',
          detail: 'ناتج الجمع = ٩٥، وناتج الطرح = ٤٦. الاستراتيجيات الذهنية توفر سرعة ودقة دون الحاجة للورقة والقلم.'
        }
      ];
      goldenRule = 'في استراتيجية التعويض للجمع: ما تضيفه لطرف المسألة يجب أن تطرحه من الناتج النهائي للحفاظ على القيمة الحقيقية.';
    } else if (isMultiplicationDivision) {
      problemTitle = `مسألة نموذجية وخطوات حل لـ: ${title}`;
      problemText = `احسب ناتج ضرب (٣٥ × ١٤) باستخدام نموذج مساحة المستطيل أو خاصية التوزيع.`;
      steps = [
        {
          stepNum: 1,
          title: 'تفكيك الأعداد حسب القيمة المكانية',
          detail: 'نفكك العدد ٣٥ إلى (٣٠ + ٥)، والعدد ١٤ إلى (١٠ + ٤).'
        },
        {
          stepNum: 2,
          title: 'حساب حواصل الضرب الجزئية الأربعة',
          detail: '(٣٠ × ١٠ = ٣٠٠)، (٣٠ × ٤ = ١٢٠)، (٥ × ١٠ = ٥٠)، (٥ × ٤ = ٢٠).'
        },
        {
          stepNum: 3,
          title: 'جمع النواتج الجزئية للوصول للحل النهائي',
          detail: '٣٠٠ + ١٢٠ + ٥٠ + ٢٠ = ٤٩٠. إذن ناتج (٣٥ × ١٤ = ٤٩٠).'
        }
      ];
      goldenRule = 'نموذج مساحة المستطيل يضمن ضرب كل خانة من العدد الأول في كل خانة من العدد الثاني دون نسيان.';
    } else if (isFractionsDecimals) {
      problemTitle = `مسألة مقارنة وتطبيق مباشر على: ${title}`;
      problemText = `قارن بين الكسرين (٣/٤) و (٥/٨)، ثم رتبها تصاعدياً مع توضيح خطوات توحيد المقامات.`;
      steps = [
        {
          stepNum: 1,
          title: 'إيجاد المقام المشترك الأصغر',
          detail: 'المقامان هما ٤ و ٨. بما أن ٨ تقبل القسمة على ٤، فإن المقام المشترك هو ٨.'
        },
        {
          stepNum: 2,
          title: 'تحويل الكسر إلى كسر مكافئ متجانس',
          detail: 'نضرب كلاً من بسط ومقام (٣/٤) في العدد ٢ ليصبح (٦/٨).'
        },
        {
          stepNum: 3,
          title: 'المقارنة المباشرة واستخلاص النتيجة',
          detail: 'بما أن ٦/٨ أكبر من ٥/٨، فإن (٣/٤ > ٥/٨)، والترتيب التصاعدي هو: ٥/٨ ثم ٣/٤.'
        }
      ];
      goldenRule = 'لا يمكن جمع أو طرح أو مقارنة الكسور مباشرة إلا بعد توحيد المقامات للحصول على أجزاء متساوية الحجم.';
    } else if (isGeometry) {
      problemTitle = `مسألة وتطبيق هندسي على: ${title}`;
      problemText = `غرفة مستطيلة الشكل طولها ٦ أمتار وعرضها ٤ أمتار. احسب كلاً من محيط الغرفة ومساحتها الإجمالية.`;
      steps = [
        {
          stepNum: 1,
          title: 'حساب محيط الغرفة (الإطار الخارجي)',
          detail: 'المحيط = (الطول + العرض) × ٢ = (٦ + ٤) × ٢ = ١٠ × ٢ = ٢٠ متراً.'
        },
        {
          stepNum: 2,
          title: 'حساب مساحة الغرفة (الحيز الداخلي)',
          detail: 'المساحة = الطول × العرض = ٦ × ٤ = ٢٤ متراً مربعاً.'
        },
        {
          stepNum: 3,
          title: 'التمييز بين الوحدات الطولية والمربعة',
          detail: 'المحيط يُقاس بوحدات الطول (م = ٢٠)، والمساحة بوحدات المربع (م² = ٢٤).'
        }
      ];
      goldenRule = 'المحيط هو السياج أو الإطار المحيط بالشكل، بينما المساحة هي عدد الوحدات المربعة التي تغطي السطح من الداخل.';
    } else if (isFactorsMultiples) {
      problemTitle = `تطبيق عملي على العوامل والمضاعفات لـ: ${title}`;
      problemText = `أوجد العامل المشترك الأكبر والمضاعف المشترك الأصغر للعددين (١٢ و ١٨).`;
      steps = [
        {
          stepNum: 1,
          title: 'التحليل إلى العوامل الأولية باستخدام شجرة العوامل',
          detail: '١٢ = ٢ × ٢ × ٣ ، بينما ١٨ = ٢ × ٣ × ٣.'
        },
        {
          stepNum: 2,
          title: 'حساب العامل المشترك الأكبر',
          detail: 'نضرب العوامل الأولية المشتركة فقط: (٢ × ٣ = ٦).'
        },
        {
          stepNum: 3,
          title: 'حساب المضاعف المشترك الأصغر',
          detail: 'نضرب جميع العوامل دون تكرار المشترك: (٢ × ٢ × ٣ × ٣ = ٣٦).'
        }
      ];
      goldenRule = 'العدد ١ هو العامل المشترك لجميع الأعداد، بينما الصفر هو المضاعف المشترك لجميع الأعداد.';
    } else if (isPlaceValue) {
      problemTitle = `تطبيق مباشر على القيمة المكانية لـ: ${title}`;
      problemText = `اكتب العدد (٧,٥٤٢) بالصيغة الممتدة، ثم حدد القيمة المكانية وقيمة الرقم ٥ في هذا العدد.`;
      steps = [
        {
          stepNum: 1,
          title: 'تحليل الخانات وتحديد المنازل',
          detail: 'الآحاد = ٢، العشرات = ٤، المئات = ٥، الألوف = ٧.'
        },
        {
          stepNum: 2,
          title: 'كتابة الصيغة الممتدة (مجموع قيم الأرقام)',
          detail: '٧٠٠٠ + ٥٠٠ + ٤٠ + ٢ = ٧,٥٤٢'
        },
        {
          stepNum: 3,
          title: 'تحديد قيمة الرقم المطلوب',
          detail: 'الرقم ٥ يقع في خانة "المئات"، وقيمته العددية هي (٥٠٠).'
        }
      ];
      goldenRule = 'القيمة المكانية هي اسم الخانة (مئات)، بينما قيمة الرقم هي ما يساويه الرقم بأصفاره (٥٠٠).';
    } else if (isScienceAdaptation) {
      problemTitle = `موقف استكشافي وتطبيق علمي على: ${title}`;
      problemText = `إذا تم نقل ثعلب الفنك من بيئته الصحراوية الحارة إلى بيئة قطبية باردة، فما التحديات التي ستواجهه بناءً على تكيفاته؟`;
      steps = [
        {
          stepNum: 1,
          title: 'تحليل التكيفات التركيبية لثعلب الفنك',
          detail: 'يمتلك أذنين كبيرتين لفقد الحرارة وتبريد جسمه وفراءً رملياً، وهي صفات مصممة للحرارة الشديدة.'
        },
        {
          stepNum: 2,
          title: 'تأثير البيئة القطبية المتجمدة',
          detail: 'الأذن الكبيرة ستؤدي لفقدان حرارة جسده بسرعة، وفراؤه الخفيف لن يمنحه العزل الكافي أمام الجليد.'
        },
        {
          stepNum: 3,
          title: 'الاستنتاج العلمي المحوري',
          detail: 'التكيفات التركيبية متخصصة جداً لكل بيئة، ولا يستطيع الكائن النجاة في بيئة متناقضة دون تكيفات مسبقة.'
        }
      ];
      goldenRule = 'التكيف التركيبي جزء من جسد الكائن الحي يولد به، بينما التكيف السلوكي هو تصرف ونشاط يقوم به استجابة للظروف.';
    } else if (isScienceEnergyMatter) {
      problemTitle = `تطبيق وتحليل فيزيائي على: ${title}`;
      problemText = `تتبع تحولات الطاقة وسرعة الأجسام عند تصادم سيارة لعبة بمكعب خشبي موضوع على طاولة.`;
      steps = [
        {
          stepNum: 1,
          title: 'امتلاك طاقة الحركة قبل التصادم',
          detail: 'تمتلك السيارة طاقة حركة ناتجة عن سرعتها وكتلتها أثناء اندفاعها.'
        },
        {
          stepNum: 2,
          title: 'انتقال الطاقة لحظة التصادم',
          detail: 'تنتقل طاقة الحركة من السيارة إلى المكعب، فيتحرك المكعب لمسافة تتناسب مع طاقة السيارة.'
        },
        {
          stepNum: 3,
          title: 'تحول جزء من الطاقة لصوت وحرارة',
          detail: 'يتحول جزء من الطاقة الحركية إلى طاقة صوتية (صوت الاصطدام) وطاقة حرارية ناتجة عن الاحتكاك.'
        }
      ];
      goldenRule = 'قانون بقاء الطاقة: الطاقة لا تفنى ولا تُستحدث من العدم، بل تتحول وتنتقل من جسم لآخر.';
    } else if (isSocialMaps) {
      problemTitle = `موقف تطبيقي وتحديد مسار على: ${title}`;
      problemText = `باستخدام خريطة بمقياس رسم (١ سم = ٥٠ كم)، إذا كانت المسافة بين مدينتك والعاصمة على الخريطة ٤ سم، فما المسافة الحقيقية؟`;
      steps = [
        {
          stepNum: 1,
          title: 'استخراج معطيات مقياس الرسم',
          detail: 'كل ١ سم على الخريطة يقابله ٥٠ كم على الطبيعة.'
        },
        {
          stepNum: 2,
          title: 'تطبيق علاقة الضرب التناسبي',
          detail: 'المسافة الحقيقية = المسافة على الخريطة (٤ سم) × مقياس الرسم (٥٠ كم).'
        },
        {
          stepNum: 3,
          title: 'حساب الناتج النهائي وتحديد الاتجاه',
          detail: '٤ × ٥٠ = ٢٠٠ كم. إذن المسافة الحقيقية بين المدينتين هي ٢٠٠ كيلومتر.'
        }
      ];
      goldenRule = 'مقياس الرسم هو النسبة بين المسافة على الخريطة وما يقابلها على أرض الواقع.';
    } else {
      // General Contextual Fallback
      problemTitle = `تطبيق عملي وسؤال تحليلي لدرس: ${title}`;
      problemText = summary ? `بناءً على درس "${title}": كيف توظف المفهوم الأساسي (${summary.substring(0, 100)}...) لحل التطبيقات الواقعية بدقة؟` : `كيف تستنتج القواعد الأساسية لـ "${title}" وتطبقها خطوة بخطوة؟`;
      steps = [
        {
          stepNum: 1,
          title: `تحليل المفهوم الأساسي لـ (${title})`,
          detail: summary ? (summary.substring(0, 130) + '...') : `تحديد العناصر الجوهرية والتعريفات المحورية لدرس ${title}.`
        },
        {
          stepNum: 2,
          title: 'التطبيق المباشر والربط بالأمثلة',
          detail: comparisonItems.length > 0 ? `الربط بين ${comparisonItems.map(c => c.title).slice(0, 2).join(' و ')} وتطبيق قواعدهما بالترتيب.` : 'ممارسة الخطوات العملية واستنتاج الفروق الدقيقة بين المفاهيم.'
        },
        {
          stepNum: 3,
          title: 'الاستخلاص والنتيجة المستهدفة',
          detail: `الوصول للفهم الكامل وإتقان الإجابة النموذجية في أي اختبار أو تطبيق واقعي لـ ${title}.`
        }
      ];
      goldenRule = `في درس (${title})، التركيز على فهم العلاقات التطبيقية بين المفاهيم يضمن الاستيعاب التام والدرجة الكاملة.`;
    }
  }

  if (!goldenRule) {
    goldenRule = summary ? `الخلاصة الذهبية: ${summary.substring(0, 160)}...` : `احرص دائماً على تطبيق خطوات ${title} بالترتيب لضمان الدقة وتثبيت المعلومة.`;
  }

  // Clean English brackets from text outputs
  problemText = problemText.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();
  goldenRule = goldenRule.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();

  return {
    problemTitle,
    problemText,
    steps,
    goldenRule,
    comparisonItems
  };
}

/**
 * Interactive Worked Example & Quick Comparison Hub
 * Dynamically tailored per chapter with step-by-step solved examples, direct concept comparisons, and exam tips.
 */
function ChapterWorkedExampleAndComparison({ chapter }: { chapter: Chapter }) {
  const [activeTab, setActiveTab] = useState<'example' | 'tip'>('example');
  const [showSolutionSteps, setShowSolutionSteps] = useState(true);

  // Dynamically extract and build per-chapter data
  const hubData = extractDynamicChapterHubData(chapter);

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-800/50 space-y-5">
      
      {/* HEADER WITH PRACTICAL TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-800/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Sigma className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                تطبيق مباشر ومسائل محلولة 📐
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
              التطبيق العملي وتريكات الامتحان لدرس: {chapter.title}
            </h4>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab('example')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'example' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span>📐 مسألة وتطبيق محلول</span>
          </button>
          <button
            onClick={() => setActiveTab('tip')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tip' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span>💡 تريكة الامتحان</span>
          </button>
        </div>
      </div>

      {/* 1. TAB: WORKED EXAMPLE WITH STEP-BY-STEP SOLUTION */}
      {activeTab === 'example' && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-black text-amber-300">
              📌 {hubData.problemTitle}
            </span>
            <button
              onClick={() => setShowSolutionSteps(!showSolutionSteps)}
              className="text-xs text-indigo-200 hover:text-white font-bold underline cursor-pointer"
            >
              {showSolutionSteps ? 'إخفاء خطوات الحل' : 'إظهار خطوات الحل النموذجية 💡'}
            </button>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-2xl border border-indigo-700/60 text-sm font-black text-amber-200 leading-relaxed font-sans">
            ❓ {hubData.problemText}
          </div>

          {showSolutionSteps && (
            <div className="space-y-3 pt-1 animate-fade-in">
              <span className="text-[11px] font-bold text-gray-300 block">خطوات الحل النموذجية:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {hubData.steps.map((st) => (
                  <div key={st.stepNum} className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        {st.stepNum}
                      </span>
                      <h6 className="font-black text-xs text-white">{st.title}</h6>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-medium">
                      {st.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: GOLDEN EXAM RULE & PRO TIP */}
      {activeTab === 'tip' && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-950 rounded-2xl p-6 border border-emerald-500/40 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>القاعدة الذهبية والتريكة الامتحانية:</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-100 font-bold leading-relaxed">
            {hubData.goldenRule}
          </p>
        </div>
      )}

    </div>
  );
}

/**
 * 🌟 Interactive Master Reader (Option 1)
 * High-value, zero-clutter, unified learning dashboard with pure Arabic localization
 */
export function ReadSection({ chapter }: { chapter: Chapter }) {
  const { isItemPlaying, isItemLoading, play, stop } = useGlobalAudio();
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showOriginalSource, setShowOriginalSource] = useState(false);

  const normalizedSummary = sanitizeEducationalMarkdown(chapter.summary);
  const normalizedContent = sanitizeEducationalMarkdown(chapter.content);
  const normalizedOriginal = sanitizeEducationalMarkdown(chapter.originalContent);

  const conceptsArr = Array.isArray(chapter.concepts) ? chapter.concepts : [];

  // Master narration text: summary + content combined
  const fullNarrationText = `${chapter.title}. ${normalizedSummary}. ${normalizedContent}`;
  const masterAudioId = `master-read-${chapter.id}`;
  const isMasterPlaying = isItemPlaying(masterAudioId);
  const isMasterLoading = isItemLoading(masterAudioId);

  const handleToggleMasterAudio = () => {
    if (isMasterPlaying || isMasterLoading) {
      stop();
      return;
    }

    // Strip all emojis, symbols, brackets, and markdown formatting so TTS narrator never pronounces emoji names
    const cleanText = fullNarrationText
      .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, ' ')
      .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\u200D\uFE0F\u20E3\u2190-\u21FF]/g, ' ')
      .replace(/[🔴🔵🟢🟣🟠🟡⚪⚫🔺🔻⭐✨💡📌🧭📏🗺️⚠️🚨🎉🎙️🎒🔍🎮📖📐🎯🧠💡]/gu, ' ')
      .replace(/[*_#`~\|\[\]\(\)\{\}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    play(masterAudioId, async () => {
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: 'male' })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch audio stream');
      }

      return await res.blob();
    });
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 'large') return 'text-base sm:text-lg';
    if (fontSizeLevel === 'xlarge') return 'text-lg sm:text-xl';
    return 'text-xs sm:text-sm';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* 🧭 1. UNIFIED CHAPTER HEADER & MASTER AUDIO BAR */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>القارئ التفاعلي الموحد والشرح الذكي</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{chapter.title}</h3>
        </div>

        {/* MASTER AUDIO & TOOLBAR BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* FONT SIZER */}
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${fontSizeLevel === 'normal' ? 'bg-amber-400 text-slate-950' : 'text-gray-300 hover:text-white'}`}
              title="خط عادي"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition ${fontSizeLevel === 'large' ? 'bg-amber-400 text-slate-950' : 'text-gray-300 hover:text-white'}`}
              title="خط كبير"
            >
              A+
            </button>
            <button
              onClick={() => setFontSizeLevel('xlarge')}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition ${fontSizeLevel === 'xlarge' ? 'bg-amber-400 text-slate-950' : 'text-gray-300 hover:text-white'}`}
              title="خط عريض جداً"
            >
              A++
            </button>
          </div>

          {/* MASTER AUDIO TRIGGER BUTTON */}
          <button
            onClick={handleToggleMasterAudio}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer ${
              isMasterPlaying
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30 animate-pulse'
                : isMasterLoading
                ? 'bg-amber-400 text-slate-950 opacity-90'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20 hover:scale-[1.02]'
            }`}
          >
            {isMasterLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري تحضير الصوت...</span>
              </>
            ) : isMasterPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف القراءة الصوتية</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>🎙️ استمع للشرح الصوتي كاملاً</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🎯 2. LEARNING OBJECTIVES & QUICK SUMMARY PILL BANNER */}
      {normalizedSummary && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-600 block">نواتج التعلّم المستهدفة</span>
              <h4 className="text-sm font-black text-indigo-950">ماذا ستتعلم وتتقن في هذا الدرس؟</h4>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-indigo-100/80 text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizedSummary}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 💡 3. CORE CONCEPTS INTERACTIVE GRID (2x2) */}
      {conceptsArr.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-gray-900">المفاهيم المحورية والمصطلحات الأساسية للدرس</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {conceptsArr.map((concept: any, idx: number) => {
              const rawName = typeof concept === 'string' ? concept : (concept.concept || concept.title || `مفهوم ${idx+1}`);
              const rawDesc = typeof concept === 'string' ? '' : (concept.explanation || concept.description || '');
              
              // Strip any bracketed English from title and desc
              const cName = rawName.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();
              const cDesc = sanitizeEducationalMarkdown(rawDesc).replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();

              return (
                <div 
                  key={idx} 
                  className="bg-white p-5 rounded-2xl border-2 border-indigo-50 hover:border-indigo-200 hover:shadow-xs transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <h5 className="font-black text-gray-900 text-sm sm:text-base">{cName}</h5>
                  </div>
                  {cDesc && (
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {cDesc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🚀 4. WORKED EXAMPLE, VISUAL COMPARISON & EXAM TIPS HUB */}
      <ChapterWorkedExampleAndComparison chapter={chapter} />

      {/* 📖 5. UNIFIED DEEP LESSON CONTENT (THE CORE READER) */}
      {normalizedContent && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-600 block">الشرح التطبيقي والأمثلة الميسرة</span>
                <h4 className="text-base sm:text-lg font-black text-gray-900">المحتوى التعليمي الكامل للدرس</h4>
              </div>
            </div>
          </div>

          <div className={`prose prose-slate max-w-none text-gray-800 leading-relaxed ${getFontSizeClass()}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizedContent}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 📑 6. COLLAPSIBLE ORIGINAL SOURCE MATERIAL */}
      {normalizedOriginal && (
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-3xl overflow-hidden transition-all">
          <button
            onClick={() => setShowOriginalSource(!showOriginalSource)}
            className="w-full p-5 flex items-center justify-between text-right font-black text-xs sm:text-sm text-gray-700 hover:bg-gray-100/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>النص الأصلي المستخرج من المذكرة المرفوعة (للمطابقة والمراجعة)</span>
            </div>
            {showOriginalSource ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showOriginalSource && (
            <div className="p-6 pt-0 border-t border-gray-200/60 animate-fade-in">
              <div className="whitespace-pre-wrap bg-white p-5 rounded-2xl border border-gray-200 font-serif leading-relaxed text-xs text-gray-700 max-h-96 overflow-y-auto mt-4">
                {normalizedOriginal}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🧠 7. CONTEXTUAL AI TUTOR */}
      <ContextualAiTutor chapterTitle={chapter.title} />

    </div>
  );
}
