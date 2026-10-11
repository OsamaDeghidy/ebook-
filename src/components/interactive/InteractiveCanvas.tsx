import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, HelpCircle, CheckCircle2, XCircle, Lightbulb, 
  GitBranch, Zap, ArrowRight, Award, Play, ChevronDown, ChevronUp, BookOpen, Layers
} from 'lucide-react';
import { fireConfetti } from '../../utils/confetti';

export interface CanvasQuizData {
  question: string;
  options: string[];
  correct_index: number;
  explanation_detail?: string;
  success_feedback?: string;
  error_feedback?: string;
}

export interface CanvasActionPayload {
  title?: string;
  subtitle?: string;
  mermaid_code?: string;
  quiz_data?: CanvasQuizData;
  highlight_text?: string;
  bullet_points?: string[];
  formula_text?: string;
}

export type CanvasActionType = 'info_card' | 'mermaid_diagram' | 'interactive_quiz' | 'highlight_box';

export interface InteractiveCanvasProps {
  actionType?: CanvasActionType;
  payload?: CanvasActionPayload;
  activeStepNumber?: number;
  speakerName?: string;
  onQuizAnswered?: (isCorrect: boolean) => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  actionType = 'info_card',
  payload,
  activeStepNumber = 1,
  speakerName = 'فرح',
  onQuizAnswered
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isQuizPanelOpen, setIsQuizPanelOpen] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  // Reset quiz state when step changes
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
  }, [activeStepNumber, payload?.quiz_data?.question]);

  // Dynamic Mermaid Renderer with safe responsive boundaries
  useEffect(() => {
    if (actionType !== 'mermaid_diagram' || !payload?.mermaid_code) {
      setMermaidSvg(null);
      setMermaidError(null);
      return;
    }

    let isMounted = true;

    const renderMermaid = async () => {
      try {
        let code = payload.mermaid_code?.trim() || '';
        code = code.replace(/^```mermaid\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

        if (!code.startsWith('graph') && !code.startsWith('flowchart') && !code.startsWith('sequenceDiagram') && !code.startsWith('classDiagram')) {
          code = `graph TD\n${code}`;
        }

        let mermaidLib: any;
        try {
          const mod = await import('mermaid');
          mermaidLib = mod.default || mod;
        } catch (e) {
          if ((window as any).mermaid) {
            mermaidLib = (window as any).mermaid;
          }
        }

        if (mermaidLib) {
          mermaidLib.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Cairo, sans-serif',
            themeVariables: {
              darkMode: true,
              background: '#090d16',
              primaryColor: '#0284c7',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#38bdf8',
              lineColor: '#22d3ee',
              secondaryColor: '#0f172a',
              tertiaryColor: '#1e293b'
            }
          });

          const uniqueId = `mermaid-svg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const { svg } = await mermaidLib.render(uniqueId, code);
          if (isMounted) {
            setMermaidSvg(svg);
            setMermaidError(null);
          }
        }
      } catch (err: any) {
        console.warn('[InteractiveCanvas] Mermaid render notice:', err);
        if (isMounted) {
          setMermaidError(err.message || 'خطأ في معالجة المخطط');
          setMermaidSvg(null);
        }
      }
    };

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [actionType, payload?.mermaid_code]);

  const handleOptionClick = (idx: number) => {
    if (isAnswerSubmitted || !payload?.quiz_data) return;
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);

    const isCorrect = idx === payload.quiz_data.correct_index;
    if (isCorrect) {
      fireConfetti();
    }

    if (onQuizAnswered) {
      onQuizAnswered(isCorrect);
    }
  };

  const hasQuiz = Boolean(payload?.quiz_data?.question);

  return (
    <div className="relative w-full min-w-0 max-w-full bg-slate-950/95 border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden text-right select-none transition-all break-words" dir="rtl">
      
      {/* 🌟 AMBIENT GLOW ACCENTS (Constrained to canvas) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 🏷️ TOP CANVAS HEADER BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
            {actionType === 'interactive_quiz' && <HelpCircle className="w-4 h-4 text-amber-300" />}
            {actionType === 'mermaid_diagram' && <GitBranch className="w-4 h-4" />}
            {actionType === 'highlight_box' && <Zap className="w-4 h-4 text-amber-300 fill-current" />}
            {actionType === 'info_card' && <Sparkles className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-teal-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>اللوحة التفاعلية الذكية</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping shrink-0" />
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {payload?.title || 'الشرح والمفاهيم الجوهرية'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasQuiz && (
            <button
              onClick={() => setIsQuizPanelOpen(!isQuizPanelOpen)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95"
              title="سؤال اختباري اختياري للفهم"
            >
              <HelpCircle className="w-3 h-3" />
              <span>{isQuizPanelOpen ? 'إخفاء السؤال' : 'سؤال اختياري 🧠'}</span>
            </button>
          )}

          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-300">
            {speakerName}
          </span>
          <span className="px-2 py-1 rounded-full bg-teal-950/80 border border-teal-800/80 text-[10px] font-black text-teal-300">
            #{activeStepNumber}
          </span>
        </div>
      </div>

      {/* 🎨 MAIN INTERACTIVE STAGE (Fluid & Responsive with Zero Horizontal Overflow) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-2 w-full min-w-0 max-w-full overflow-hidden">
        
        {/* ======================================================== */}
        {/* 1. OPTIONAL INTERACTIVE QUIZ (COLLAPSIBLE / NON-INTRUSIVE) */}
        {/* ======================================================== */}
        {isQuizPanelOpen && payload?.quiz_data && (
          <div className="w-full max-w-xl bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-scale-up mb-3 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
                <span>🧠</span>
                <span>تحدي الفهم السريع (اختياري)</span>
              </div>
              {isAnswerSubmitted && selectedOption === payload.quiz_data.correct_index && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" /> +25 XP
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white leading-relaxed">
              {payload.quiz_data.question}
            </h4>

            {/* OPTIONS */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {payload.quiz_data.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === payload.quiz_data?.correct_index;
                let btnStyle = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-md';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-100';
                  } else {
                    btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswerSubmitted}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-98 text-right ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-4 h-4 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                    {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* FEEDBACK DETAIL */}
            {isAnswerSubmitted && (
              <div className={`p-3 rounded-xl text-xs font-bold animate-fade-in ${
                selectedOption === payload.quiz_data.correct_index
                  ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
                  : 'bg-rose-950/80 border border-rose-600 text-rose-200'
              }`}>
                <div className="font-black mb-1">
                  {selectedOption === payload.quiz_data.correct_index
                    ? payload.quiz_data.success_feedback || 'إجابة صحيحة وممتازة! 🌟'
                    : payload.quiz_data.error_feedback || 'إجابة غير دقيقة! لاحظ التفسير:'}
                </div>
                {payload.quiz_data.explanation_detail && (
                  <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                    {payload.quiz_data.explanation_detail}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. MERMAID DIAGRAM RENDERER (RESPONSIVE WRAPPER) */}
        {/* ======================================================== */}
        {actionType === 'mermaid_diagram' && (
          <div className="w-full min-w-0 max-w-full flex flex-col items-center justify-center p-1">
            {payload?.subtitle && (
              <p className="text-xs font-bold text-teal-300 mb-2.5 text-center px-2">
                {payload.subtitle}
              </p>
            )}

            {mermaidSvg ? (
              <div 
                ref={mermaidContainerRef}
                className="w-full max-w-full max-h-[300px] overflow-auto flex items-center justify-center p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner [&_svg]:max-w-full [&_svg]:h-auto scrollbar-thin"
                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              />
            ) : mermaidError ? (
              <div className="w-full p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-2">
                <GitBranch className="w-7 h-7 text-teal-400 mx-auto" />
                <p className="text-[11px] text-slate-300 font-mono break-all" dir="ltr">
                  {payload?.mermaid_code || ''}
                </p>
              </div>
            ) : (
              <div className="w-full p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">جاري رسم المخطط التفاعلي...</span>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. HIGHLIGHT BOX / EXAM GOLDEN RULE */}
        {/* ======================================================== */}
        {actionType === 'highlight_box' && (
          <div className="w-full max-w-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/30 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3 animate-scale-up text-center break-words">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
              <span>قاعدة ذهبية / فخ امتحانات ⚠️</span>
            </div>

            <p className="text-sm sm:text-base font-black text-amber-100 leading-relaxed break-words">
              "{payload?.highlight_text || payload?.subtitle || 'ركز على هذا المفهوم الجوهري لتحقيق الدرجة النهائية.'}"
            </p>

            {payload?.subtitle && payload.highlight_text && (
              <p className="text-xs font-bold text-slate-300 pt-1 break-words">
                {payload.subtitle}
              </p>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. STRUCTURED ACADEMIC INFO CARD (DEFAULT) */}
        {/* ======================================================== */}
        {(actionType === 'info_card' || actionType === 'interactive_quiz') && !isQuizPanelOpen && (
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5 text-right break-words">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-black">
                <Lightbulb className="w-4 h-4" />
                <span>المفهوم والتفكيك الأكاديمي</span>
              </div>
              {hasQuiz && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                  يتضمن اختباراً 🧠
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-black text-white leading-snug break-words">
              {payload?.title || 'الشرح والتفكيك الأكاديمي'}
            </h4>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words font-medium">
              {payload?.subtitle || payload?.highlight_text || 'استمع إلى الحوار الصوتي لمتابعة الشرح اللحظي بالتزامن مع اللوحة التفاعلية.'}
            </p>

            {/* BULLET POINTS */}
            {payload?.bullet_points && payload.bullet_points.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {payload.bullet_points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-200 font-bold leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <span className="break-words">{pt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🏷️ BOTTOM CANVAS FOOTER */}
      <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">تزامن صوتي حي مع كريم وفرح</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono shrink-0">Osera Interactive Canvas</span>
      </div>
    </div>
  );
};

export default InteractiveCanvas;
