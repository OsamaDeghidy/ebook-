import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shuffle,
  Inbox,
  Award,
  Zap,
  Check,
  Flame
} from 'lucide-react';
import { Flashcard, Chapter } from '../types';

interface FlashcardsSectionProps {
  chapter: Chapter;
  onUpdateFlashcards?: (updated: Flashcard[]) => void;
}

type LeitnerBox = 'all' | 'box1' | 'box2' | 'box3';

export default function FlashcardsSection({ chapter, onUpdateFlashcards }: FlashcardsSectionProps) {
  // Generate initial flashcards from chapter concepts or text
  const initialCards: Flashcard[] = Array.isArray(chapter.flashcards) && chapter.flashcards.length > 0
    ? chapter.flashcards
    : (Array.isArray(chapter.concepts) && chapter.concepts.length > 0
        ? chapter.concepts.map((c, i) => ({
            id: `fc-${chapter.id}-${i + 1}`,
            front: typeof c === 'string' ? c : (c as any).concept || (c as any).title || `مفهوم ${i + 1}`,
            back: typeof c === 'string' ? 'شرح المفهوم وتطبيقاته التعليمية.' : (c as any).explanation || (c as any).description || '',
            difficulty: 'medium'
          }))
        : [
            {
              id: `fc-${chapter.id}-1`,
              front: `ما هي الفكرة الجوهرية لدرس "${chapter.title}"؟`,
              back: chapter.summary || 'استيعاب المفاهيم الأساسية وتطبيقها عملياً.',
              difficulty: 'medium'
            }
          ]);

  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [activeBoxFilter, setActiveBoxFilter] = useState<LeitnerBox>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Audio / Auto-Play Mode State
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioTimerSeconds, setAudioTimerSeconds] = useState(3);
  const audioTimeoutRef = useRef<any>(null);

  // Filter cards according to Leitner Boxes
  const filteredCards = cards.filter(card => {
    if (activeBoxFilter === 'all') return true;
    if (activeBoxFilter === 'box1') return card.difficulty === 'hard' || !card.difficulty;
    if (activeBoxFilter === 'box2') return card.difficulty === 'medium';
    if (activeBoxFilter === 'box3') return card.difficulty === 'easy';
    return true;
  });

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  // Box statistics
  const box1Count = cards.filter(c => c.difficulty === 'hard' || !c.difficulty).length;
  const box2Count = cards.filter(c => c.difficulty === 'medium').length;
  const box3Count = cards.filter(c => c.difficulty === 'easy').length;
  const masteryPercentage = Math.round((box3Count / Math.max(1, cards.length)) * 100);

  // Play audio TTS
  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isAr = /[\u0600-\u06FF]/.test(text);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play audio loop for flashcards
  useEffect(() => {
    if (!isAudioMode || !currentCard || completed) return;

    // Speak front, wait, flip, speak back, then next
    setIsFlipped(false);
    speakText(currentCard.front, () => {
      audioTimeoutRef.current = setTimeout(() => {
        setIsFlipped(true);
        speakText(currentCard.back, () => {
          audioTimeoutRef.current = setTimeout(() => {
            if (currentIndex + 1 < filteredCards.length) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setIsAudioMode(false);
              setCompleted(true);
            }
          }, 2500);
        });
      }, 1500);
    });

    return () => {
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isAudioMode, currentIndex, activeBoxFilter]);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < filteredCards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCompleted(false);
    }
  };

  const handleRate = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    const updated = cards.map(card =>
      card.id === currentCard.id ? { ...card, difficulty, lastReviewed: new Date().toISOString() } : card
    );
    setCards(updated);
    if (onUpdateFlashcards) onUpdateFlashcards(updated);

    handleNext();
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  const toggleAudioMode = () => {
    if (isAudioMode) {
      setIsAudioMode(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    } else {
      setIsAudioMode(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* HEADER WITH LEITNER SYSTEM INSIGHT */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>خوارزمية لايتنر للتكرار المتباعد (Leitner 3-Box Engine)</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">بطاقات الاستذكار السريع والتثبيت</h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              تنتقل البطاقات بين 3 صناديق ذكية: البطاقات الصعبة تظهر بتكرار مكثف حتى تنقلها بنفسك إلى صندوق الإتقان النهائي.
            </p>
          </div>

          {/* Mastery Stats Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3.5 rounded-2xl shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-black text-sm">
              {masteryPercentage}%
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-300 font-bold block">مستوى الإتقان التراكمي</span>
              <span className="text-sm font-black text-white">{box3Count} من {cards.length} بطاقات متقنة</span>
            </div>
          </div>
        </div>

        {/* 3-BOX LEITNER TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-indigo-800/50">
          <button
            onClick={() => { setActiveBoxFilter('all'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
              activeBoxFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>جميع البطاقات</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black">{cards.length}</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box1'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
              activeBoxFilter === 'box1'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/40'
                : 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border-rose-800/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
              <span>صندوق 1: يحتاج تركيز</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-[10px] font-black">{box1Count}</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box2'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
              activeBoxFilter === 'box2'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40'
                : 'bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border-amber-800/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>صندوق 2: قيد المراجعة</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] font-black">{box2Count}</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box3'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
              activeBoxFilter === 'box3'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>صندوق 3: أتقنتها تماماً</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-[10px] font-black">{box3Count}</span>
          </button>
        </div>
      </div>

      {/* CONTROLS BAR: AUDIO MODE & SHUFFLE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudioMode}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 border ${
              isAudioMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm animate-pulse'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {isAudioMode ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <Play className="w-4 h-4 text-indigo-600" />}
            <span>{isAudioMode ? 'إيقاف الاستماع التلقائي' : 'تشغيل وضع الاستماع التلقائي (Audio Flashcards)'}</span>
          </button>

          {isAudioMode && (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              🎙️ جاري النطق التفاعلي والتنقل التلقائي...
            </span>
          )}
        </div>

        <button
          onClick={handleShuffle}
          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          title="خلط ترتيب البطاقات"
        >
          <Shuffle className="w-3.5 h-3.5 text-gray-500" />
          <span>خلط البطاقات</span>
        </button>
      </div>

      {!completed && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
            <span>البطاقة {currentIndex + 1} من {filteredCards.length}</span>
            <span>{Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
            />
          </div>

          {/* Interactive Flipping Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer group relative min-h-[340px] bg-gradient-to-br from-white via-indigo-50/10 to-gray-50 border-2 border-indigo-100 hover:border-indigo-300 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between select-none"
          >
            <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
              <span className={`px-3.5 py-1 rounded-full text-xs font-black ${
                isFlipped
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {isFlipped ? '💡 الإجابة والشرح المعرفي' : '❓ المفهوم أو السؤال'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(isFlipped ? currentCard.back : currentCard.front);
                  }}
                  className="p-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded-lg transition"
                  title="نطق بصوت المعلم"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="flex items-center gap-1 text-gray-400 group-hover:text-indigo-600 transition text-[11px]">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>انقر للقلب</span>
                </span>
              </div>
            </div>

            <div className="my-auto text-center py-6 px-2">
              {isFlipped ? (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xl md:text-2xl font-black text-indigo-950 leading-relaxed font-sans">
                    {currentCard.back}
                  </h4>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-2xl md:text-3xl font-black text-gray-900 leading-snug font-sans">
                    {currentCard.front}
                  </h4>
                </div>
              )}
            </div>

            <div className="text-center text-[11px] text-gray-400 font-medium">
              {isFlipped ? 'قيّم استيعابك لنقل البطاقة إلى الصندوق المناسب' : 'خمّن الإجابة في ذهنك أولاً ثم انقر للاطلاع على التوضيح'}
            </div>
          </div>

          {/* Action buttons (Leitner Rating) */}
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-3 animate-fade-in">
              <button
                onClick={() => handleRate('hard')}
                className="p-3.5 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-800 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>لم أتقنه (صعب)</span>
                </div>
                <span className="text-[10px] text-rose-600/80 font-normal">نقل إلى صندوق 1 (تركيز)</span>
              </button>

              <button
                onClick={() => handleRate('medium')}
                className="p-3.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-900 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>تذكرته بصعوبة</span>
                </div>
                <span className="text-[10px] text-amber-700/80 font-normal">نقل إلى صندوق 2 (مراجعة)</span>
              </button>

              <button
                onClick={() => handleRate('easy')}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>أتقنته تماماً</span>
                </div>
                <span className="text-[10px] text-emerald-700/80 font-normal">نقل إلى صندوق 3 (إتقان)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-3 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-sm active:scale-95"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completion Screen */
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-black text-gray-900">أحسنت! أتممت مراجعة البطاقات</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            تم توزيع جميع البطاقات على صناديق لايتنر الثلاثة. يمكنك مراجعة بطاقات صندوق التركيز (صندوق 1) لرفع نسبة إتقانك إلى 100%!
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveBoxFilter('box1'); handleRestart(); }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition shadow-md"
            >
              مراجعة الصندوق الصعب ({box1Count})
            </button>
            <button
              onClick={() => { setActiveBoxFilter('all'); handleRestart(); }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition"
            >
              إعادة الكل ({cards.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

