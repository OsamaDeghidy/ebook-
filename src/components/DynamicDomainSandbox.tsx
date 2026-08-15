import React, { useState } from 'react';
import { Play, Code, Calculator, Sparkles, Terminal, BookOpen, Check, RefreshCw, Languages, Zap, Lightbulb } from 'lucide-react';
import { MarketplaceBook, Chapter } from '../types';

interface DynamicDomainSandboxProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export default function DynamicDomainSandbox({ book, chapter }: DynamicDomainSandboxProps) {
  // Infer domain type based on book category, subcategory, tags, or content keywords
  const bookText = `${book.title} ${book.category} ${book.subcategory || ''} ${book.tags?.join(' ') || ''} ${chapter.title} ${chapter.content}`.toLowerCase();

  const isProgramming = bookText.includes('برمج') || bookText.includes('كود') || bookText.includes('python') || bookText.includes('javascript') || bookText.includes('code') || bookText.includes('html') || bookText.includes('تطوير') || bookText.includes('بيانات');
  const isMathOrFinance = bookText.includes('رياضيات') || bookText.includes('إحصاء') || bookText.includes('مالي') || bookText.includes('استثمار') || bookText.includes('فائدة') || bookText.includes('أرباح') || bookText.includes('finance') || bookText.includes('math') || bookText.includes('أب غني');
  const isScienceOrPhysics = bookText.includes('فيزياء') || bookText.includes('كيمياء') || bookText.includes('علوم') || bookText.includes('قانون') || bookText.includes('سرعة') || bookText.includes('physics') || bookText.includes('chemistry');
  const isLanguage = bookText.includes('لغة') || bookText.includes('english') || bookText.includes('إنجليزي') || bookText.includes('قواعد') || bookText.includes('نحو') || bookText.includes('grammar') || bookText.includes('مفردات');

  // Code runner state
  const [code, setCode] = useState(`// تطبيق عملي تفاعلي على مفاهيم: ${chapter.title}\nfunction calculateOutcome() {\n  const input = [1000, 2500, 4200];\n  const result = input.map(x => x * 1.15);\n  return "القيم المحسوبة بعد تطبيق المعادلة: " + result.join(", ");\n}\n\nconsole.log(calculateOutcome());`);
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Financial / Math Calculator state
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);

  // Language Drill state
  const [practiceWord, setPracticeWord] = useState(chapter.title);

  const runJavaScriptCode = () => {
    setIsRunningCode(true);
    setCodeOutput('');
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('❌ Error: ' + args.join(' ')),
        warn: (...args: any[]) => logs.push('⚠️ Warning: ' + args.join(' '))
      };

      const runFn = new Function('console', code);
      runFn(customConsole);

      setCodeOutput(logs.join('\n') || '✅ تم تنفيذ الكود بنجاح دون أخطاء.');
    } catch (err: any) {
      setCodeOutput(`❌ خطأ أثناء التشغيل: ${err.message}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  // 1. CODING SANDBOX
  if (isProgramming) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">مختبر تشغيل الأكواد البرمجية التفاعلي (Code Sandbox)</h3>
              <p className="text-xs text-gray-500">جرّب الأكواد وطبّق الخوارزميات مباشرة داخل المتصفح.</p>
            </div>
          </div>
          <button
            onClick={runJavaScriptCode}
            disabled={isRunningCode}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>تشغيل الكود</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">محرر الكود (JavaScript / Web Runtime)</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">مخرجات الطرفية والـ Console</label>
            <div className="w-full min-h-[190px] p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner" dir="ltr">
              {codeOutput || '// انقر على "تشغيل الكود" لمشاهدة المخرجات هنا...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. FINANCIAL & MATH CALCULATOR
  if (isMathOrFinance) {
    const futureValue = Math.round(principal * Math.pow(1 + rate / 100, years));
    const totalProfit = futureValue - principal;

    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6" dir="rtl">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base">المحاكي المالي والحسابي التفاعلي (Financial Calculator)</h3>
            <p className="text-xs text-gray-500">طبّق المفاهيم المالية والفائدة المركبة والتدفقات النقدية بالأرقام الواقعية.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <label className="text-xs font-bold text-gray-600 block">المبلغ الأساسي (رأس المال أو الأصول)</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <label className="text-xs font-bold text-gray-600 block">العائد السنوي المتوقع (%)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <label className="text-xs font-bold text-gray-600 block">المدة الزمنية (بالسنوات)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl text-right">
            <span className="text-xs font-bold text-emerald-800 block">القيمة المستقبلية للأصل (Future Value)</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block font-mono">
              ${futureValue.toLocaleString()}
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-5 rounded-2xl text-right">
            <span className="text-xs font-bold text-indigo-800 block">صافي النمو التراكمي (Net Growth)</span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block font-mono">
              +${totalProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. DEFAULT: REFLECTIVE STRATEGY & ACTION WORKBOOK (FOR SELF-HELP & CLASSICS)
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base">دليل التطبيق والتفكير العملي (Action Workbook)</h3>
          <p className="text-xs text-gray-500">خطوات عملية لتحويل أفكار الفصل إلى ممارسات يومية قابلة للتنفيذ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 space-y-2">
          <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>خطة العمل المقترحة لهذا الأسبوع</span>
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            استخرج أهم عادة أو قرار تم التركيز عليه في هذا الفصل واكتب خطة لتطبيقه تدريجياً في حياتك اليومية.
          </p>
        </div>

        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 space-y-2">
          <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>سؤال التأمل الذاتي والقيادة</span>
          </h4>
          <p className="text-xs text-indigo-800 leading-relaxed">
            ما هو أكبر تحدٍ يواجهك في تنفيذ فكرة {chapter.title}؟ وكيف يمكنك تجاوزه بأقل مجهود ممكن؟
          </p>
        </div>
      </div>
    </div>
  );
}
