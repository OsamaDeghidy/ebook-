import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Code, Calculator, Sparkles, Terminal, BookOpen, Check, RefreshCw, 
  Languages, Zap, Lightbulb, Compass, Navigation, MapPin, Footprints, 
  FlaskConical, Gauge, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw,
  Gamepad2, CheckCircle2, XCircle, Brain, Target, Shuffle, Clock, Trophy,
  Plus, Minus, BarChart3, PieChart, Layers, Headphones, Volume2, VolumeX,
  Eye, EyeOff, FileText, CheckCircle, HelpCircle, Scroll, Landmark, Scale,
  Coins, TrendingUp, DollarSign, Building2, Gavel, FileCheck, Activity, Flame, ShieldCheck
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

  // Language & Listening Lab State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, number>>({});
  const [listeningScore, setListeningScore] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Story & Papyrus Explorer State
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [orderedEvents, setOrderedEvents] = useState<any[]>([]);
  const [hasCompletedTimeline, setHasCompletedTimeline] = useState(false);

  // Business & Financial Simulator State
  const [capital, setCapital] = useState(100000);
  const [unitPrice, setUnitPrice] = useState(50);
  const [unitCost, setUnitCost] = useState(30);
  const [fixedMonthlyCost, setFixedMonthlyCost] = useState(20000);
  const [salesVolume, setSalesVolume] = useState(1500);
  const [selectedBusinessChoice, setSelectedBusinessChoice] = useState<number | null>(null);

  // Legal Moot Court State
  const [selectedVerdictIdx, setSelectedVerdictIdx] = useState<number | null>(null);

  // Social Geography State
  const [activeCompassDir, setActiveCompassDir] = useState<string>('الشمال');
  const [selectedLandmark, setSelectedLandmark] = useState<any | null>(null);

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
    setSelectedVerdictIdx(null);
    setSelectedBusinessChoice(null);

    if (act.data?.artifacts && act.data.artifacts.length > 0) {
      setSelectedArtifactId(act.data.artifacts[0].id);
    }

    if (act.data?.storyEvents) {
      const shuffled = [...act.data.storyEvents].sort(() => Math.random() - 0.5);
      setOrderedEvents(shuffled);
      setHasCompletedTimeline(false);
    }

    if (act.data?.financialMetrics) {
      setCapital(act.data.financialMetrics.initialCapital || 100000);
      setUnitPrice(act.data.financialMetrics.unitPrice || 50);
      setUnitCost(act.data.financialMetrics.unitCost || 30);
      setFixedMonthlyCost(act.data.financialMetrics.fixedMonthlyCost || 20000);
      setSalesVolume(act.data.financialMetrics.expectedSales || 1500);
    }

    if (act.data?.landmarks && act.data.landmarks.length > 0) {
      setSelectedLandmark(act.data.landmarks[0]);
    }

    if (act.data?.targetNumber) {
      const num = Number(act.data.targetNumber) || 3524;
      setTargetNumber(num);
      const th = Math.floor((num % 10000) / 1000);
      const hu = Math.floor((num % 1000) / 100);
      const te = Math.floor((num % 100) / 10);
      const on = num % 10;
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

  // Timeline Event Move
  const handleMoveEvent = (index: number, direction: 'up' | 'down') => {
    const newEvents = [...orderedEvents];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newEvents.length) return;

    const temp = newEvents[index];
    newEvents[index] = newEvents[targetIdx];
    newEvents[targetIdx] = temp;
    setOrderedEvents(newEvents);

    // Check if sorted correctly
    const isSorted = newEvents.every((ev, i) => (ev.order ?? (i + 1)) === i + 1);
    if (isSorted && !hasCompletedTimeline) {
      setHasCompletedTimeline(true);
    }
  };

  // Financial Calculations
  const grossProfitPerUnit = Math.max(0, unitPrice - unitCost);
  const totalRevenue = unitPrice * salesVolume;
  const totalCost = (unitCost * salesVolume) + fixedMonthlyCost;
  const netProfit = totalRevenue - totalCost;
  const breakEvenUnits = grossProfitPerUnit > 0 ? Math.ceil(fixedMonthlyCost / grossProfitPerUnit) : 0;
  const breakEvenRevenue = breakEvenUnits * unitPrice;
  const monthlyROI = capital > 0 ? ((netProfit / capital) * 100).toFixed(1) : '0';
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // -------------------------------------------------------------
  // VIEW: DYNAMIC AI GENERATED ACTIVITY
  // -------------------------------------------------------------
  if (activity) {
    const isStoryPapyrus = activity.activityType === 'story_papyrus_explorer';
    const isBusinessSim = activity.activityType === 'business_financial_simulator';
    const isLegalMoot = activity.activityType === 'legal_moot_court';
    const isSocialGeography = activity.activityType === 'social_geography_explorer';
    const isScienceExperiment = activity.activityType === 'science_virtual_experiment';
    const isListeningLab = activity.activityType === 'language_listening_lab';
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
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md text-white ${
              isStoryPapyrus ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700' :
              isBusinessSim ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900' :
              isLegalMoot ? 'bg-gradient-to-br from-purple-600 via-indigo-700 to-slate-900' :
              isSocialGeography ? 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700' :
              isScienceExperiment ? 'bg-gradient-to-br from-cyan-500 via-teal-600 to-blue-700' :
              isListeningLab ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700' :
              isPlaceValue || isFraction ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700' :
              'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700'
            }`}>
              {isStoryPapyrus ? <Scroll className="w-6 h-6" /> :
               isBusinessSim ? <TrendingUp className="w-6 h-6" /> :
               isLegalMoot ? <Scale className="w-6 h-6" /> :
               isSocialGeography ? <Compass className="w-6 h-6" /> :
               isScienceExperiment ? <FlaskConical className="w-6 h-6" /> :
               isListeningLab ? <Headphones className="w-6 h-6" /> :
               isPlaceValue || isFraction ? <Calculator className="w-6 h-6" /> :
               <Gamepad2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  isStoryPapyrus ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  isBusinessSim ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  isLegalMoot ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  isSocialGeography ? 'bg-sky-50 text-sky-800 border-sky-200' :
                  isScienceExperiment ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                  isListeningLab ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isStoryPapyrus ? '📜 مستكشف البرديات والآثار التفاعلي' :
                   isBusinessSim ? '📊 محاكي دراسة الجدوى والنموذج المالي' :
                   isLegalMoot ? '⚖️ المحكمة الافتراضية وتحليل الدعوى' :
                   isSocialGeography ? '🧭 المستكشف الجغرافي وخريطة المعالم' :
                   isScienceExperiment ? '🧪 المختبر العلمي الافتراضي' :
                   isListeningLab ? '🎧 مختبر الاستماع والفهم اللغوي' :
                   isPlaceValue ? '🔢 معمل القيمة المكانية وبناء الأعداد' :
                   isFraction ? '📐 محاكي الكسور والنماذج الشريطية' :
                   '🎮 نشاط تفاعلي ذكي'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">الفصل: {chapter.title}</span>
              </div>
              <h3 className="font-black text-gray-900 text-base sm:text-lg mt-0.5">{activity.title}</h3>
            </div>
          </div>

          <button
            onClick={() => handleGenerateAiActivity(false)}
            disabled={isGeneratingActivity}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition border border-gray-200 self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingActivity ? 'animate-spin' : ''}`} />
            <span>{isGeneratingActivity ? 'جاري التوليد بالخلفية...' : 'توليد محاكي آخر 🔄'}</span>
          </button>
        </div>

        {/* INSTRUCTIONS */}
        {activity.instructions && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{activity.instructions}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. STORY & PAPYRUS EXPLORER UI (البرديات والتاريخ والشخصيات) */}
        {/* ========================================================================= */}
        {isStoryPapyrus && (
          <div className="space-y-6">
            {/* ARTIFACT CARDS EXPLORER */}
            {activity.data?.artifacts && activity.data.artifacts.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-black text-amber-950 block flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-amber-600" />
                  <span>انقر على البردية أو المعلم لاكتشاف أسرار الدرس:</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {activity.data.artifacts.map((art: any) => {
                    const isSelected = selectedArtifactId === art.id;
                    return (
                      <button
                        key={art.id}
                        onClick={() => setSelectedArtifactId(art.id)}
                        className={`p-4 rounded-2xl border-2 text-right transition flex flex-col justify-between space-y-2 text-xs font-bold ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-300/50'
                            : 'bg-white border-amber-100 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl">{art.icon || '📜'}</span>
                          {isSelected && <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">نشط</span>}
                        </div>
                        <h5 className="font-black text-sm text-gray-900">{art.name}</h5>
                        <p className="text-[11px] text-gray-600 line-clamp-2">{art.fact}</p>
                      </button>
                    );
                  })}
                </div>

                {/* SELECTED ARTIFACT DEEP DIVE */}
                {activity.data.artifacts.find((a: any) => a.id === selectedArtifactId) && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 border border-amber-300 text-amber-950 space-y-2 animate-fade-in shadow-inner">
                    {(() => {
                      const cur = activity.data.artifacts.find((a: any) => a.id === selectedArtifactId);
                      return (
                        <>
                          <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                            <span className="text-xl">{cur.icon || '📜'}</span>
                            <span>{cur.name}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                            📖 <strong>المعلومة التاريخية:</strong> {cur.fact}
                          </p>
                          {cur.significance && (
                            <p className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200 font-bold">
                              ⭐ <strong>الأهمية والدلالة:</strong> {cur.significance}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE EVENT SEQUENCING CHALLENGE */}
            {orderedEvents && orderedEvents.length > 0 && (
              <div className="space-y-3 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>تحدي المستكشف: رتّب أحداث ومراحل الدرس بالتسلسل الصحيح:</span>
                  </span>
                  {hasCompletedTimeline && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-bounce">
                      🏆 أحسنت! الترتيب مكتمل 100%!
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {orderedEvents.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-800">{ev.text}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveEvent(idx, 'up')}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={idx === orderedEvents.length - 1}
                          onClick={() => handleMoveEvent(idx, 'down')}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. BUSINESS & FINANCIAL SIMULATOR UI (إدارة الأعمال والمالية) */}
        {/* ========================================================================= */}
        {isBusinessSim && (
          <div className="space-y-6">
            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 block">صافي الربح الشهري</span>
                <span className={`text-base sm:text-lg font-black font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {netProfit.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1">
                <span className="text-[10px] font-bold text-teal-600 block">نقطة التعادل (Break-Even)</span>
                <span className="text-base sm:text-lg font-black font-mono text-teal-800">
                  {breakEvenUnits.toLocaleString('ar-EG')} وحدة
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <span className="text-[10px] font-bold text-amber-600 block">العائد الشهري (ROI)</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-800">
                  {monthlyROI}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
                <span className="text-[10px] font-bold text-purple-600 block">هامش الربح الصافي</span>
                <span className="text-base sm:text-lg font-black font-mono text-purple-800">
                  {profitMargin}%
                </span>
              </div>
            </div>

            {/* INTERACTIVE SLIDERS & LIVE FINANCIAL CHART */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* SLIDERS */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                <span className="text-xs font-black text-gray-800 block">المتغيرات المالية ونموذج التشغيل:</span>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>سعر بيع الوحدة:</span>
                    <span className="font-mono text-indigo-700">{unitPrice} ج.م</span>
                  </div>
                  <input
                    type="range" min={10} max={500} step={5} value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>التكلفة المتغيرة للوحدة:</span>
                    <span className="font-mono text-indigo-700">{unitCost} ج.م</span>
                  </div>
                  <input
                    type="range" min={5} max={400} step={5} value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>حجم المبيعات الشهري المتوقع:</span>
                    <span className="font-mono text-indigo-700">{salesVolume} وحدة</span>
                  </div>
                  <input
                    type="range" min={100} max={5000} step={50} value={salesVolume}
                    onChange={(e) => setSalesVolume(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>التكاليف الثابتة الشهرية (إيجار، رواتب):</span>
                    <span className="font-mono text-indigo-700">{fixedMonthlyCost} ج.م</span>
                  </div>
                  <input
                    type="range" min={5000} max={100000} step={1000} value={fixedMonthlyCost}
                    onChange={(e) => setFixedMonthlyCost(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* DYNAMIC SVG CHART */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/40 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                  <span className="text-xs font-bold text-indigo-300">مخطط الإيرادات والتكاليف التفاعلي</span>
                  <span className="text-xs font-mono font-bold text-amber-400">نقطة التعادل: {breakEvenRevenue.toLocaleString('ar-EG')} ج.م</span>
                </div>

                {/* SVG Visual Bars */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>إجمالي الإيرادات (Total Revenue)</span>
                      <span className="font-mono text-emerald-400 font-bold">{totalRevenue.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (totalRevenue / Math.max(1, totalRevenue, totalCost)) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>إجمالي التكاليف (Total Cost)</span>
                      <span className="font-mono text-rose-400 font-bold">{totalCost.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (totalCost / Math.max(1, totalRevenue, totalCost)) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-2xl border border-indigo-700/50 text-xs text-gray-200 font-medium leading-relaxed">
                  💡 <strong>التحليل المالي الذكي:</strong> {salesVolume >= breakEvenUnits
                    ? `المشروع يحقق أرباحاً تشغيلية قدرها (${netProfit.toLocaleString('ar-EG')} ج.م) شهرياً بتجاوز نقطة التعادل بـ (${salesVolume - breakEvenUnits}) وحدة.`
                    : `المشروع يعمل تحت نقطة التعادل ويحتاج لبيع (${breakEvenUnits - salesVolume}) وحدة إضافية لتغطية التكاليف.`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. LEGAL MOOT COURT SIMULATOR UI (المحكمة الافتراضية والقانون) */}
        {/* ========================================================================= */}
        {isLegalMoot && (
          <div className="space-y-6">
            {/* CASE SUMMARY BANNER */}
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-purple-800">
                <Gavel className="w-4 h-4" />
                <span>وقائع الدعوى المنظورة أمام المحكمة:</span>
              </div>
              <p className="text-xs sm:text-sm font-bold leading-relaxed text-gray-800">
                {activity.data?.caseSummary || 'نزاع قانوني معروض للفصل القضائي وفقاً لصحيح القانون والمبادئ المعتمدة.'}
              </p>
            </div>

            {/* CLAIMS VS DEFENSE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <span className="text-xs font-black text-blue-900 block">📜 دفوع وطلبات المدعي (Plaintiff):</span>
                <ul className="space-y-1.5 text-xs text-gray-700 font-medium list-disc list-inside">
                  {activity.data?.plaintiffClaims?.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  )) || <li>المطالبة بالحق القانوني والتعويض عن الأضرار.</li>}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                <span className="text-xs font-black text-rose-900 block">🛡️ دفوع المدعى عليه (Defense):</span>
                <ul className="space-y-1.5 text-xs text-gray-700 font-medium list-disc list-inside">
                  {activity.data?.defendantDefense?.map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  )) || <li>الدفع بعدم قبول الدعوى أو انتفاء المسؤولية.</li>}
                </ul>
              </div>
            </div>

            {/* VERDICT SELECTION CHALLENGE */}
            {activity.data?.verdictOptions && (
              <div className="space-y-3">
                <span className="text-xs font-black text-gray-900 block">⚖️ بصفتك القاضي، اختر الحكم القضائي الصحيح مع التأصيل:</span>
                <div className="space-y-2.5">
                  {activity.data.verdictOptions.map((v: any, vIdx: number) => {
                    const isSelected = selectedVerdictIdx === vIdx;
                    return (
                      <button
                        key={vIdx}
                        onClick={() => setSelectedVerdictIdx(vIdx)}
                        className={`w-full p-4 rounded-2xl border-2 text-right transition flex flex-col space-y-1.5 text-xs sm:text-sm font-bold ${
                          isSelected
                            ? (v.isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md' : 'bg-rose-50 border-rose-500 text-rose-950 shadow-md')
                            : 'bg-white border-gray-200 hover:border-purple-300 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm">{v.verdictTitle}</span>
                          {isSelected && (v.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />)}
                        </div>
                        {isSelected && (
                          <p className={`text-xs mt-1 pt-2 border-t font-medium leading-relaxed ${v.isCorrect ? 'border-emerald-200 text-emerald-900' : 'border-rose-200 text-rose-900'}`}>
                            📚 <strong>التأصيل القانوني:</strong> {v.reasoning}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SOCIAL & GEOGRAPHY EXPLORER UI (الجغرافيا والخرائط والبوصلة) */}
        {/* ========================================================================= */}
        {isSocialGeography && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* INTERACTIVE COMPASS */}
              <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-sky-900 text-white p-6 rounded-3xl border border-sky-800/40 text-center space-y-4">
                <span className="text-xs font-bold text-sky-300 block">وردة البوصلة التفاعلية (Compass Rose)</span>
                
                <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-sky-600/50 flex items-center justify-center bg-slate-950 shadow-inner">
                  <div className="absolute top-2 text-xs font-black text-amber-400">الشمال (N)</div>
                  <div className="absolute bottom-2 text-xs font-black text-sky-400">الجنوب (S)</div>
                  <div className="absolute left-2 text-xs font-black text-sky-400">الغرب (W)</div>
                  <div className="absolute right-2 text-xs font-black text-sky-400">الشرق (E)</div>
                  <Compass className="w-16 h-16 text-amber-400 animate-spin-slow" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['الشمال', 'الجنوب', 'الشرق', 'الغرب'].map(dir => (
                    <button
                      key={dir}
                      onClick={() => setActiveCompassDir(dir)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        activeCompassDir === dir ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-gray-300'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              {/* LANDMARKS MAP EXPLORER */}
              <div className="space-y-3">
                <span className="text-xs font-black text-gray-800 block">🗺️ معالم ومواقع الدرس على الخريطة:</span>
                <div className="space-y-2">
                  {activity.data?.landmarks?.map((lm: any) => (
                    <div
                      key={lm.id}
                      className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm">{lm.name}</span>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">{lm.coordinates || 'موقع استراتيجي'}</span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium">{lm.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SCIENCE VIRTUAL EXPERIMENT UI (العلوم والتجارب) */}
        {/* ========================================================================= */}
        {isScienceExperiment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                <span className="text-xs font-black text-gray-800 block">المتغيرات المعملية وعناصر التحكم:</span>
                {activity.data?.variables?.map((v: any) => (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{v.label}</span>
                      <span className="font-mono text-cyan-700 font-bold">{sliderValues[v.id] ?? v.defaultValue ?? 50} {v.unit || ''}</span>
                    </div>
                    <input
                      type="range" min={v.min ?? 0} max={v.max ?? 100}
                      value={sliderValues[v.id] ?? v.defaultValue ?? 50}
                      onChange={(e) => setSliderValues(prev => ({ ...prev, [v.id]: Number(e.target.value) }))}
                      className="w-full accent-cyan-600"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white p-6 rounded-3xl border border-cyan-800/40 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
                  <span className="text-xs font-bold text-cyan-300">الاستنتاج المعملي الحي</span>
                  <span className="text-2xl">{activity.data?.outcomes?.[0]?.visualEmoji || '🧪'}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                  {activity.data?.outcomes?.[0]?.explanation || 'تحريك المؤشرات المعملية يوضح سلوك المادة والتفاعل خطوة بخطوة.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. LANGUAGE & LISTENING COMPREHENSION LAB UI (اللغة والاستماع) */}
        {/* ========================================================================= */}
        {isListeningLab && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-700/50 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300 font-bold block">التسجيل الصوتي النقي للدرس:</span>
                    <h4 className="text-base font-black">{activity.title || chapter.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!audioRef.current) {
                        const audio = new Audio(`/api/tts/stream?text=${encodeURIComponent(activity.data?.transcript || chapter.content || '')}`);
                        audio.playbackRate = audioSpeed;
                        audio.onended = () => setIsPlayingAudio(false);
                        audioRef.current = audio;
                      }
                      if (isPlayingAudio) {
                        audioRef.current.pause();
                        setIsPlayingAudio(false);
                      } else {
                        audioRef.current.play().catch(() => {});
                        setIsPlayingAudio(true);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition shadow-md ${
                      isPlayingAudio ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    }`}
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isPlayingAudio ? 'إيقاف مؤقت' : 'تشغيل الاستماع 🎧'}</span>
                  </button>

                  <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-emerald-800/60 text-xs">
                    {[0.75, 1.0, 1.25].map(spd => (
                      <button
                        key={spd}
                        onClick={() => {
                          setAudioSpeed(spd);
                          if (audioRef.current) audioRef.current.playbackRate = spd;
                        }}
                        className={`px-2 py-1 rounded-lg font-mono font-bold transition ${
                          audioSpeed === spd ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-emerald-200">
                  💡 <strong>نصيحة تعليمية:</strong> استمع للتسجيل أولاً وأجب عن أسئلة الفهم، ثم أظهر النص للمطابقة وتدريب القراءة.
                </p>

                <button
                  onClick={() => setShowTranscript(prev => !prev)}
                  className="px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-bold flex items-center gap-2 transition self-start sm:self-auto shrink-0"
                >
                  {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showTranscript ? 'إخفاء النص (اختبار استماع) 🎧' : 'إظهار النص المكتوب للتدقيق 👁️'}</span>
                </button>
              </div>

              {showTranscript && (
                <div className="mt-3 p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/70 text-sm leading-relaxed text-gray-200 animate-fade-in font-arabic max-h-64 overflow-y-auto whitespace-pre-line">
                  {activity.data?.transcript || chapter.content}
                </div>
              )}
            </div>

            {/* QUESTIONS */}
            {activity.data?.listeningQuestions && activity.data.listeningQuestions.length > 0 && (
              <div className="space-y-4">
                <span className="text-xs font-black text-gray-800 block">أسئلة فهم المسموع والاستيعاب:</span>
                <div className="space-y-3">
                  {activity.data.listeningQuestions.map((q: any, qIdx: number) => {
                    const answered = listeningAnswers[q.id || `q-${qIdx}`] !== undefined;
                    const selectedIdx = listeningAnswers[q.id || `q-${qIdx}`];
                    const isCorrect = selectedIdx === (q.correctOptionIndex ?? 0);

                    return (
                      <div key={q.id || qIdx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                        <h5 className="font-bold text-sm text-gray-900">{qIdx + 1}. {q.question}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options?.map((optText: string, oIdx: number) => (
                            <button
                              key={oIdx}
                              disabled={answered}
                              onClick={() => {
                                setListeningAnswers(prev => ({ ...prev, [q.id || `q-${qIdx}`]: oIdx }));
                                if (oIdx === (q.correctOptionIndex ?? 0)) setListeningScore(s => s + 10);
                              }}
                              className={`p-3 rounded-xl border text-right text-xs transition ${
                                answered
                                  ? (oIdx === (q.correctOptionIndex ?? 0) ? 'bg-emerald-50 border-emerald-500 font-black text-emerald-950' : selectedIdx === oIdx ? 'bg-rose-50 border-rose-400 text-rose-950' : 'opacity-60 bg-gray-100')
                                  : 'bg-white hover:bg-emerald-50/40 text-gray-800'
                              }`}
                            >
                              {optText}
                            </button>
                          ))}
                        </div>
                        {answered && q.explanation && (
                          <p className={`p-3 rounded-xl text-xs font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. MATH PLACE VALUE & FRACTION VISUALIZER */}
        {/* ========================================================================= */}
        {isPlaceValue && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-300 block">تحدي بناء وتكوين العدد المطلوب:</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{targetNumber.toLocaleString('ar-EG')} ({targetNumber})</span>
              </div>
              {hasSolvedTarget && <span className="text-xs font-black bg-emerald-500 text-white px-3 py-1.5 rounded-xl animate-bounce">🏆 أحسنت! كونت العدد المطلوب!</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'الآحاد', val: ones, set: setOnes, color: 'emerald' },
                { label: 'العشرات', val: tens, set: setTens, color: 'amber' },
                { label: 'المئات', val: hundreds, set: setHundreds, color: 'teal' },
                { label: 'الألوف', val: thousands, set: setThousands, color: 'indigo' }
              ].map((slot, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-xs font-black text-gray-700">{slot.label}</span>
                  <div className="text-2xl font-black font-mono text-indigo-700">{slot.val}</div>
                  <div className="flex justify-center gap-1">
                    <button onClick={() => slot.set(v => (v + 1) % 10)} className="px-2 py-1 bg-indigo-100 rounded-lg text-xs font-bold">+</button>
                    <button onClick={() => slot.set(v => (v > 0 ? v - 1 : 9))} className="px-2 py-1 bg-indigo-100 rounded-lg text-xs font-bold">-</button>
                  </div>
                </div>
              ))}
            </div>
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
          {isGeneratingActivity ? 'جاري تجهيز المختبر التفاعلي في الخلفية...' : `توليد محاكي تفاعلي لدرس "${chapter.title}"`}
        </h3>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          يقوم الذكاء الاصطناعي الآن ببناء تجربة تفاعلية متخصصة ومصممة خصيصاً لمستوى الدرس والمادة (تاريخ وبرديات، محاكاة مالية، محكمة قانونية، مختبر علوم، أو لوحة قيمة مكانية).
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
