import React, { useState } from 'react';
import { Sparkles, RotateCw, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ArrowLeft, Trophy, Layers } from 'lucide-react';
import { Flashcard, Chapter } from '../types';

interface FlashcardsSectionProps {
  chapter: Chapter;
  onUpdateFlashcards?: (updated: Flashcard[]) => void;
}

export default function FlashcardsSection({ chapter, onUpdateFlashcards }: FlashcardsSectionProps) {
  // Generate initial flashcards from chapter concepts if not already populated
  const initialCards: Flashcard[] = Array.isArray(chapter.flashcards) && chapter.flashcards.length > 0
    ? chapter.flashcards
    : (Array.isArray(chapter.concepts) && chapter.concepts.length > 0
        ? chapter.concepts.map((c, i) => ({
            id: `fc-${chapter.id}-${i + 1}`,
            front: typeof c === 'string' ? c : (c as any).concept || (c as any).title || `مفهوم ${i + 1}`,
            back: typeof c === 'string' ? 'شرح المفهوم واستخدامه في السياق.' : (c as any).explanation || (c as any).description || '',
            difficulty: 'medium'
          }))
        : [
            {
              id: `fc-${chapter.id}-1`,
              front: `ما هي الفكرة الأساسية في "${chapter.title}"؟`,
              back: chapter.summary || 'ترسيخ المبادئ وتطبيقها بصورة عملية وواقعية.',
              difficulty: 'medium'
            }
          ]);

  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < cards.length) {
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
    const updated = cards.map((card, i) =>
      i === currentIndex ? { ...card, difficulty, lastReviewed: new Date().toISOString() } : card
    );
    setCards(updated);
    if (onUpdateFlashcards) onUpdateFlashcards(updated);

    if (difficulty === 'easy') {
      setMasteredCount(prev => prev + 1);
    }

    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCount(0);
    setCompleted(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">نظام التكرار المتباعد (Spaced Repetition)</span>
          </div>
          <h3 className="text-xl font-black text-gray-900">بطاقات المراجعة الذكية (Smart Flashcards)</h3>
          <p className="text-xs text-gray-500 mt-1">اختبر ذاكرتك واسترجع أهم المفاهيم عبر البطاقات التفاعلية لتثبيت المعلومة على المدى الطويل.</p>
        </div>

        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl shrink-0">
          <Trophy className="w-5 h-5 text-indigo-600" />
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-bold block">نسبة الإتقان</span>
            <span className="text-sm font-black text-indigo-900">{masteredCount} من {cards.length} مفاهيم</span>
          </div>
        </div>
      </div>

      {!completed && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
            <span>البطاقة {currentIndex + 1} من {cards.length}</span>
            <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Interactive Flipping Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer group relative min-h-[320px] bg-gradient-to-br from-white to-gray-50 border-2 border-indigo-100 hover:border-indigo-300 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between select-none"
          >
            <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                {isFlipped ? 'الإجابة والشرح' : 'المفهوم أو السؤال'}
              </span>
              <span className="flex items-center gap-1 text-gray-400 group-hover:text-indigo-600 transition">
                <RotateCw className="w-3.5 h-3.5" />
                <span>انقر لقلب البطاقة</span>
              </span>
            </div>

            <div className="my-auto text-center py-6">
              {isFlipped ? (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xl font-black text-indigo-950 leading-relaxed font-sans">
                    {currentCard.back}
                  </h4>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-2xl font-black text-gray-900 leading-snug font-sans">
                    {currentCard.front}
                  </h4>
                </div>
              )}
            </div>

            <div className="text-center text-[11px] text-gray-400 font-medium">
              {isFlipped ? 'قيّم مدى استيعابك للمفهوم أدناه لتحديد موعد المراجعة القادمة' : 'خمّن الإجابة في ذهنك أولاً ثم انقر للاطلاع على التوضيح'}
            </div>
          </div>

          {/* Action buttons (Rating) */}
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-3 animate-fade-in">
              <button
                onClick={() => handleRate('hard')}
                className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>يحتاج مراجعة (صعب)</span>
              </button>
              <button
                onClick={() => handleRate('medium')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>تذكرته بصعوبة (متوسط)</span>
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>أعرفه تماماً (سهل)</span>
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
          <h4 className="text-xl font-black text-gray-900">أحسنت! أتممت مراجعة كل البطاقات</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            تمت جدولة البطاقات التي تحتاج مراجعة وفق خوارزمية التكرار المتباعد لتثبيتها في الذاكرة طويلة المدى.
          </p>
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md"
          >
            إعادة المراجعة من البداية
          </button>
        </div>
      )}
    </div>
  );
}
