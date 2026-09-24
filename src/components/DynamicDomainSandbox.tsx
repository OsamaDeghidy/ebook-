import React, { useState, useEffect } from 'react';
import { 
  Play, Code, Calculator, Sparkles, Terminal, BookOpen, Check, RefreshCw, 
  Languages, Zap, Lightbulb, Compass, Navigation, MapPin, Footprints, 
  FlaskConical, Gauge, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw,
  Gamepad2, CheckCircle2, XCircle, Brain, Target, Shuffle, Clock, Trophy,
  Plus, Minus, BarChart3, PieChart, Layers
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../types';

interface DynamicDomainSandboxProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export default function DynamicDomainSandbox({ book, chapter }: DynamicDomainSandboxProps) {
  // Activity state (check if saved on chapter or generate dynamically)
  const [activity, setActivity] = useState<any>((chapter as any).labActivity || null);
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Math Place Value Board State
  const [thousands, setThousands] = useState(3);
  const [hundreds, setHundreds] = useState(5);
  const [tens, setTens] = useState(2);
  const [ones, setOnes] = useState(4);
  const [targetNumber, setTargetNumber] = useState(3524);
  const [placeValueScore, setPlaceValueScore] = useState(0);
  const [hasSolvedTarget, setHasSolvedTarget] = useState(false);

  // Fraction Visualizer State
  const [fracNum1, setFracNum1] = useState(1);
  const [fracDen1, setFracDen1] = useState(2);
  const [fracNum2, setFracNum2] = useState(2);
  const [fracDen2, setFracDen2] = useState(4);

  // Matching Game State
  const [selectedPairItem, setSelectedPairItem] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);

  // Simulator Variable Sliders State
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Decision Scenario State
  const [scenarioStep, setScenarioStep] = useState(0);
  const [scenarioFeedback, setScenarioFeedback] = useState<any | null>(null);

  // Synchronize when chapter changes
  useEffect(() => {
    const existing = (chapter as any).labActivity;
    if (existing) {
      setActivity(existing);
      initActivityState(existing);
    } else {
      setActivity(null);
      // Auto-trigger background generation so it's ready when student opens the tab
      handleGenerateAiActivity(true);
    }
  }, [chapter.id, chapter.title]);

  const initActivityState = (act: any) => {
    if (!act) return;
    setMatchedPairs([]);
    setSelectedPairItem(null);
    setScenarioStep(0);
    setScenarioFeedback(null);
    setHasSolvedTarget(false);

    if (act.data?.targetNumber) {
      const num = Number(act.data.targetNumber) || 3524;
      setTargetNumber(num);
      const th = Math.floor((num % 10000) / 1000);
      const hu = Math.floor((num % 1000) / 100);
      const te = Math.floor((num % 100) / 10);
      const on = num % 10;
      // Start with values so the student solves the challenge
      setThousands((th + 1) % 10);
      setHundreds((hu + 2) % 10);
      setTens((te + 1) % 10);
      setOnes((on + 3) % 10);
    }

    if (act.data?.variables) {
      const initialSliders: Record<string, number> = {};
      act.data.variables.forEach((v: any) => {
        initialSliders[v.id] = v.defaultValue ?? 50;
      });
      setSliderValues(initialSliders);
    }
  };

  const handleGenerateAiActivity = async (isBackground = false) => {
    setIsGeneratingActivity(true);
    setActivityError(null);
    try {
      const res = await fetch(`/api/ebooks/${book.id}/generate-lab-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterContent: chapter.content || chapter.summary || '',
          bookCategory: book.category,
          grade_level: (book as any).grade_level || 'الصف الرابع الابتدائي'
        })
      });

      if (!res.ok) {
        throw new Error('فشل توليد النشاط التفاعلي بالذكاء الاصطناعي');
      }

      const data = await res.json();
      if (data.activity) {
        setActivity(data.activity);
        (chapter as any).labActivity = data.activity;
        initActivityState(data.activity);
      }
    } catch (err: any) {
      console.warn("AI Lab Generator Error:", err);
      if (!isBackground) {
        setActivityError(err.message || 'تعذر توليد التجربة بالذكاء الاصطناعي حالياً.');
      }
    } finally {
      setIsGeneratingActivity(false);
    }
  };

  // Check Math Place Value Target Solution
  const currentFormedNumber = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
  useEffect(() => {
    if (activity?.activityType === 'place_value_board' && currentFormedNumber === targetNumber && !hasSolvedTarget) {
      setHasSolvedTarget(true);
      setPlaceValueScore(s => s + 50);
    }
  }, [currentFormedNumber, targetNumber, activity?.activityType, hasSolvedTarget]);

  const generateNewMathTarget = () => {
    const randomTh = Math.floor(Math.random() * 8) + 1;
    const randomHu = Math.floor(Math.random() * 9);
    const randomTe = Math.floor(Math.random() * 9);
    const randomOn = Math.floor(Math.random() * 9);
    const newNum = randomTh * 1000 + randomHu * 100 + randomTe * 10 + randomOn;
    setTargetNumber(newNum);
    setHasSolvedTarget(false);
  };

  // Sanitizer for matching items to avoid raw asterisks or broken text
  const cleanItemText = (text: string) => {
    if (!text) return '';
    return text.replace(/[\*\#\$\_]/g, '').trim();
  };

  // Matching logic
  const handleItemClick = (itemText: string, isLeft: boolean, pairId: string) => {
    const cleanText = cleanItemText(itemText);
    if (matchedPairs.includes(pairId)) return;

    if (!selectedPairItem) {
      setSelectedPairItem(cleanText);
      return;
    }

    const currentPairs = activity?.data?.pairs || [];
    const isMatch = currentPairs.some((p: any) => 
      (cleanItemText(p.item) === selectedPairItem && cleanItemText(p.match) === cleanText) || 
      (cleanItemText(p.match) === selectedPairItem && cleanItemText(p.item) === cleanText)
    );

    if (isMatch) {
      setMatchedPairs(prev => [...prev, pairId]);
      setGameScore(s => s + 25);
      setSelectedPairItem(null);
      setWrongMatch(null);
    } else {
      setWrongMatch(cleanText);
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedPairItem(null);
      }, 900);
    }
  };

  // -------------------------------------------------------------
  // VIEW: DYNAMIC AI GENERATED ACTIVITY
  // -------------------------------------------------------------
  if (activity) {
    const isPlaceValue = activity.activityType === 'place_value_board';
    const isFraction = activity.activityType === 'fraction_visualizer';
    const isMatching = activity.activityType === 'matching_game' && activity.data?.pairs;
    const isSimulator = activity.activityType === 'interactive_simulator' && activity.data?.variables;
    const isDecision = activity.activityType === 'decision_scenario' && activity.data?.steps;

    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" dir="rtl">
        
        {/* ACTIVITY HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md">
              {isPlaceValue || isFraction ? <Calculator className="w-6 h-6" /> : isSimulator ? <BarChart3 className="w-6 h-6" /> : <Gamepad2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {isPlaceValue ? '🔢 معمل القيمة المكانية التفاعلي' : isFraction ? '📐 محاكي الكسور والنماذج الشريطية' : '🎮 نشاط تفاعلي ذكي'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">الفصل: {chapter.title}</span>
              </div>
              <h3 className="font-black text-gray-900 text-base sm:text-lg mt-0.5">{activity.title}</h3>
            </div>
          </div>

          <button
            onClick={() => handleGenerateAiActivity(false)}
            disabled={isGeneratingActivity}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-2 transition border border-indigo-200 self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingActivity ? 'animate-spin' : ''}`} />
            <span>{isGeneratingActivity ? 'جاري التوليد بالخلفية...' : 'توليد نشاط آخر 🔄'}</span>
          </button>
        </div>

        {/* INSTRUCTIONS */}
        {activity.instructions && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{activity.instructions}</span>
          </div>
        )}

        {/* 1. MATH PLACE VALUE BOARD */}
        {isPlaceValue && (
          <div className="space-y-6">
            
            {/* TARGET CHALLENGE BANNER */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                  <Target className="w-4 h-4" />
                  <span>تحدي بناء وتكوين العدد المطلوب:</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {targetNumber.toLocaleString('ar-EG')} ({targetNumber})
                  </span>
                  <span className="text-xs text-indigo-200 font-bold">
                    {activity.data?.targetNumberWord || 'استخدم العدادات أدناه لتكوين هذا العدد بالضبط'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 bg-indigo-800/80 rounded-xl text-xs font-black border border-indigo-600">
                  النقاط: <span className="text-amber-300 font-mono text-sm">{placeValueScore}</span>
                </div>
                <button
                  onClick={generateNewMathTarget}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-sm"
                >
                  تحدي جديد 🎯
                </button>
              </div>
            </div>

            {/* PLACE VALUE COLUMNS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* THOUSANDS */}
              <div className="bg-purple-50/80 border-2 border-purple-200 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm">
                <div className="w-full pb-2 border-b border-purple-200 flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900">الألوف (١٠٠٠)</span>
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md">
                    القيمة: {(thousands * 1000).toLocaleString('ar-EG')}
                  </span>
                </div>

                {/* VISUAL BEADS */}
                <div className="h-16 flex flex-wrap content-center justify-center gap-1 max-w-[120px]">
                  {Array.from({ length: thousands }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-lg bg-purple-600 shadow-sm flex items-center justify-center text-[10px] text-white font-bold animate-scale-in">
                      K
                    </div>
                  ))}
                  {thousands === 0 && <span className="text-xs text-purple-400 font-bold">٠</span>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setThousands(t => Math.max(0, t - 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 flex items-center justify-center font-black transition active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black font-mono text-purple-950 w-6">{thousands}</span>
                  <button
                    onClick={() => setThousands(t => Math.min(9, t + 1))}
                    className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center font-black transition active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* HUNDREDS */}
              <div className="bg-blue-50/80 border-2 border-blue-200 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm">
                <div className="w-full pb-2 border-b border-blue-200 flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900">المئات (١٠٠)</span>
                  <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">
                    القيمة: {(hundreds * 100).toLocaleString('ar-EG')}
                  </span>
                </div>

                {/* VISUAL BEADS */}
                <div className="h-16 flex flex-wrap content-center justify-center gap-1 max-w-[120px]">
                  {Array.from({ length: hundreds }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-lg bg-blue-600 shadow-sm flex items-center justify-center text-[10px] text-white font-bold animate-scale-in">
                      M
                    </div>
                  ))}
                  {hundreds === 0 && <span className="text-xs text-blue-400 font-bold">٠</span>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setHundreds(h => Math.max(0, h - 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center font-black transition active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black font-mono text-blue-950 w-6">{hundreds}</span>
                  <button
                    onClick={() => setHundreds(h => Math.min(9, h + 1))}
                    className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-black transition active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TENS */}
              <div className="bg-emerald-50/80 border-2 border-emerald-200 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm">
                <div className="w-full pb-2 border-b border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">العشرات (١٠)</span>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                    القيمة: {(tens * 10).toLocaleString('ar-EG')}
                  </span>
                </div>

                {/* VISUAL BEADS */}
                <div className="h-16 flex flex-wrap content-center justify-center gap-1 max-w-[120px]">
                  {Array.from({ length: tens }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-lg bg-emerald-600 shadow-sm flex items-center justify-center text-[10px] text-white font-bold animate-scale-in">
                      T
                    </div>
                  ))}
                  {tens === 0 && <span className="text-xs text-emerald-400 font-bold">٠</span>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTens(t => Math.max(0, t - 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-black transition active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black font-mono text-emerald-950 w-6">{tens}</span>
                  <button
                    onClick={() => setTens(t => Math.min(9, t + 1))}
                    className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black transition active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ONES */}
              <div className="bg-amber-50/80 border-2 border-amber-200 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-sm">
                <div className="w-full pb-2 border-b border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">الآحاد (١)</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                    القيمة: {ones.toLocaleString('ar-EG')}
                  </span>
                </div>

                {/* VISUAL BEADS */}
                <div className="h-16 flex flex-wrap content-center justify-center gap-1 max-w-[120px]">
                  {Array.from({ length: ones }).map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-lg bg-amber-500 shadow-sm flex items-center justify-center text-[10px] text-slate-950 font-bold animate-scale-in">
                      O
                    </div>
                  ))}
                  {ones === 0 && <span className="text-xs text-amber-400 font-bold">٠</span>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOnes(o => Math.max(0, o - 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-black transition active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black font-mono text-amber-950 w-6">{ones}</span>
                  <button
                    onClick={() => setOnes(o => Math.min(9, o + 1))}
                    className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-black transition active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* CALCULATED EXPANDED FORM DISPLAY */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-gray-700">الصيغة القياسية للعدد الحالي:</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  {currentFormedNumber.toLocaleString('ar-EG')} ({currentFormedNumber})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-700">الصيغة الممتدة الرياضية:</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono bg-white px-4 py-1.5 rounded-xl border border-slate-200">
                  {thousands * 1000} + {hundreds * 100} + {tens * 10} + {ones} = {currentFormedNumber}
                </span>
              </div>
            </div>

            {/* VICTORY MODAL IF TARGET MATCHED */}
            {hasSolvedTarget && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-black flex items-center justify-between animate-bounce shadow-md">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
                  <span>أحسنت يا بطل! كونت العدد {targetNumber.toLocaleString('ar-EG')} بنجاح وحصلت على +50 نقطة! 🎉</span>
                </div>
                <button
                  onClick={generateNewMathTarget}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  التحدي التالي ➡️
                </button>
              </div>
            )}

          </div>
        )}

        {/* 2. FRACTION & BAR MODEL VISUALIZER */}
        {isFraction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* FRACTION 1 */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-indigo-900">الكسر الأول:</span>
                  <span className="text-xl font-black font-mono text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200">
                    {fracNum1} / {fracDen1}
                  </span>
                </div>

                {/* SVG BAR MODEL */}
                <div className="w-full h-12 bg-white rounded-xl border-2 border-indigo-300 overflow-hidden flex shadow-inner">
                  {Array.from({ length: fracDen1 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full border-l border-indigo-300 transition-all duration-300 flex items-center justify-center text-[10px] font-bold ${
                        i < fracNum1 ? 'bg-indigo-600 text-white' : 'bg-transparent text-indigo-300'
                      }`}
                      style={{ width: `${100 / fracDen1}%` }}
                    >
                      1/{fracDen1}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>البسط (الأجزاء المظللة): {fracNum1}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={fracDen1}
                    value={fracNum1}
                    onChange={(e) => setFracNum1(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>المقام (إجمالي الأجزاء): {fracDen1}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={fracDen1}
                    onChange={(e) => {
                      const newDen = Number(e.target.value);
                      setFracDen1(newDen);
                      if (fracNum1 > newDen) setFracNum1(newDen);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* FRACTION 2 */}
              <div className="bg-teal-50/70 border border-teal-200 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-teal-900">الكسر الثاني المقابل:</span>
                  <span className="text-xl font-black font-mono text-teal-700 bg-white px-3 py-1 rounded-xl border border-teal-200">
                    {fracNum2} / {fracDen2}
                  </span>
                </div>

                {/* SVG BAR MODEL */}
                <div className="w-full h-12 bg-white rounded-xl border-2 border-teal-300 overflow-hidden flex shadow-inner">
                  {Array.from({ length: fracDen2 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full border-l border-teal-300 transition-all duration-300 flex items-center justify-center text-[10px] font-bold ${
                        i < fracNum2 ? 'bg-teal-600 text-white' : 'bg-transparent text-teal-300'
                      }`}
                      style={{ width: `${100 / fracDen2}%` }}
                    >
                      1/{fracDen2}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>البسط (الأجزاء المظللة): {fracNum2}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={fracDen2}
                    value={fracNum2}
                    onChange={(e) => setFracNum2(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>المقام (إجمالي الأجزاء): {fracDen2}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={fracDen2}
                    onChange={(e) => {
                      const newDen = Number(e.target.value);
                      setFracDen2(newDen);
                      if (fracNum2 > newDen) setFracNum2(newDen);
                    }}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>

            </div>

            {/* COMPARISON RESULT CARD */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {fracNum1 / fracDen1 === fracNum2 / fracDen2 ? '⚖️' : fracNum1 / fracDen1 > fracNum2 / fracDen2 ? '📈' : '📉'}
                </span>
                <div>
                  <span className="text-xs text-indigo-300 font-bold block">المقارنة الرياضية والتكافؤ:</span>
                  <span className="text-sm font-black">
                    {fracNum1 / fracDen1 === fracNum2 / fracDen2
                      ? `الكسران متكافئان تماماً (${fracNum1}/${fracDen1} = ${fracNum2}/${fracDen2})`
                      : fracNum1 / fracDen1 > fracNum2 / fracDen2
                      ? `الكسر الأول (${fracNum1}/${fracDen1}) أكبر من الكسر الثاني (${fracNum2}/${fracDen2})`
                      : `الكسر الأول (${fracNum1}/${fracDen1}) أصغر من الكسر الثاني (${fracNum2}/${fracDen2})`}
                  </span>
                </div>
              </div>

              <div className="text-xs font-mono font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                {(fracNum1 / fracDen1).toFixed(2)} vs {(fracNum2 / fracDen2).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* 3. MATCHING GAME UI */}
        {isMatching && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-black text-gray-700">
              <span>انقر على المفهوم ثم انقر على ما يقابله لتوصيلهما بدقة:</span>
              <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">النقاط: {gameScore}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column Items */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-black text-gray-500 block">المفاهيم / العناصر:</span>
                {activity.data.pairs.map((p: any) => {
                  const isMatched = matchedPairs.includes(p.id);
                  const cleanItem = cleanItemText(p.item);
                  const isSelected = selectedPairItem === cleanItem;
                  const isError = wrongMatch === cleanItem;

                  return (
                    <button
                      key={`item-${p.id}`}
                      disabled={isMatched}
                      onClick={() => handleItemClick(p.item, true, p.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm font-black transition flex items-center justify-between leading-relaxed ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-80'
                          : isError
                          ? 'bg-rose-50 border-rose-500 text-rose-950 animate-shake'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                          : 'bg-gray-50 hover:bg-indigo-50/50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <span>{cleanItem}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Right Column Matches */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-black text-gray-500 block">التفسير / التطبيق الصحيح:</span>
                {activity.data.pairs.map((p: any) => {
                  const isMatched = matchedPairs.includes(p.id);
                  const cleanMatch = cleanItemText(p.match);
                  const isSelected = selectedPairItem === cleanMatch;
                  const isError = wrongMatch === cleanMatch;

                  return (
                    <button
                      key={`match-${p.id}`}
                      disabled={isMatched}
                      onClick={() => handleItemClick(p.match, false, p.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm font-bold transition flex items-center justify-between leading-relaxed ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 opacity-80'
                          : isError
                          ? 'bg-rose-50 border-rose-500 text-rose-950 animate-shake'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                          : 'bg-gray-50 hover:bg-indigo-50/50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <span>{cleanMatch}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {matchedPairs.length === activity.data.pairs.length && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs font-black flex items-center justify-between animate-bounce">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>مبارك يا بطل! أتممت مطابقة جميع مفاهيم الدرس بنجاح بنسبة 100%!</span>
                </div>
                <button
                  onClick={() => {
                    setMatchedPairs([]);
                    setGameScore(0);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs"
                >
                  إعادة اللعب 🔁
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. INTERACTIVE VARIABLE SIMULATOR UI WITH DYNAMIC SVG CHART */}
        {isSimulator && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* SLIDERS */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                <span className="text-xs font-black text-gray-800 block">المتغيرات وعناصر التحكم:</span>
                {activity.data.variables.map((v: any) => (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{v.label}</span>
                      <span className="font-mono text-indigo-600">{sliderValues[v.id] ?? v.defaultValue ?? 50} {v.unit || ''}</span>
                    </div>
                    <input
                      type="range"
                      min={v.min ?? 0}
                      max={v.max ?? 100}
                      step={v.step ?? 1}
                      value={sliderValues[v.id] ?? v.defaultValue ?? 50}
                      onChange={(e) => setSliderValues(prev => ({ ...prev, [v.id]: Number(e.target.value) }))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                ))}
              </div>

              {/* LIVE DYNAMIC SVG BAR CHART & OBSERVATION PANEL */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/40 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                  <span className="text-xs font-bold text-indigo-300">التمثيل البياني المباشر</span>
                  <span className="text-xl">{activity.data.outcomes?.[0]?.visualEmoji || '📊'}</span>
                </div>

                {/* DYNAMIC SVG CHART BARS */}
                <div className="space-y-2">
                  {activity.data.variables.map((v: any) => {
                    const val = sliderValues[v.id] ?? v.defaultValue ?? 50;
                    const maxVal = v.max || 100;
                    const percentage = Math.min(100, Math.max(0, (val / maxVal) * 100));
                    return (
                      <div key={v.id} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <span>{v.label}</span>
                          <span className="font-mono text-amber-300">{val} {v.unit || ''}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-indigo-700/50">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-indigo-300 block">{activity.data.outcomes?.[0]?.stateTitle || 'الاستنتاج العلمي:'}</span>
                  <p className="text-xs sm:text-sm text-gray-200 font-medium mt-1 leading-relaxed">
                    {activity.data.outcomes?.[0]?.explanation || 'تحريك المتغيرات يوضح سلوك المفهوم وقوانينه خطوة بخطوة.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. DECISION SCENARIO UI */}
        {isDecision && (
          <div className="space-y-5 bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100">
            {activity.data.scenarioIntro && (
              <p className="text-xs sm:text-sm text-indigo-950 font-bold leading-relaxed">
                📖 {activity.data.scenarioIntro}
              </p>
            )}

            {activity.data.steps?.[scenarioStep] && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm">
                <h4 className="text-sm font-black text-gray-900">
                  {activity.data.steps[scenarioStep].question}
                </h4>

                <div className="space-y-2">
                  {activity.data.steps[scenarioStep].options?.map((opt: any, oIdx: number) => (
                    <button
                      key={oIdx}
                      onClick={() => setScenarioFeedback(opt)}
                      className="w-full p-3.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-right text-xs font-bold text-gray-800 transition"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {scenarioFeedback && (
                  <div className={`p-4 rounded-xl text-xs font-bold space-y-1 animate-fade-in ${
                    scenarioFeedback.isBest ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'bg-rose-50 text-rose-950 border border-rose-200'
                  }`}>
                    <span className="block font-black">{scenarioFeedback.isBest ? '✅ قرار ممتاز ومطابق للمفهوم!' : '⚠️ قرار يحتاج لمراجعة:'}</span>
                    <p>{scenarioFeedback.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: INVITING HERO BOX (OR BACKGROUND LOADER)
  // -------------------------------------------------------------
  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-8 shadow-xl border border-indigo-800/40 text-center space-y-6" dir="rtl">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black mx-auto shadow-lg">
        <Sparkles className="w-8 h-8 animate-spin-slow" />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
          المختبر التفاعلي الذكي والرسوم البيانية
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-white">
          {isGeneratingActivity ? 'جاري تجهيز المختبر التفاعلي في الخلفية...' : `توليد مختبر تفاعلي لدرس "${chapter.title}"`}
        </h3>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          يقوم الذكاء الاصطناعي الآن ببناء لوحة القيمة المكانية، النماذج الشريطية، الرسوم البيانية ومحاكاة المفاهيم خصيصاً لمحتوى هذا الدرس حتى تتدرب بصرياً وعملياً.
        </p>
      </div>

      {activityError && (
        <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800 max-w-md mx-auto">
          {activityError}
        </p>
      )}

      <button
        onClick={() => handleGenerateAiActivity(false)}
        disabled={isGeneratingActivity}
        className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
      >
        {isGeneratingActivity ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>جاري تحليل الفصل وتصميم المحاكي التفاعلي...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 fill-current" />
            <span>✨ اضغط لتوليد المحاكي والرسوم البيانية بالـ AI</span>
          </>
        )}
      </button>
    </div>
  );
}

