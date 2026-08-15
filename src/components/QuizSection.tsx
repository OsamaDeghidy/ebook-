import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Check,
  X,
  Sparkles,
  Award,
  Clock,
  FileCheck,
  Brain,
  Layers,
  ChevronRight,
  ChevronLeft,
  Printer,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { QuizQuestion, QuestionType } from '../types';
import { supabase } from '../lib/supabase';

interface QuizSectionProps {
  bookId?: string;
  chapterTitle?: string;
  questions: QuizQuestion[];
  onUpdateQuestions?: (updatedQuestions: QuizQuestion[]) => void;
  onGenerateAiQuestions?: () => void;
  isGeneratingAiQuestions?: boolean;
}

export default function QuizSection({
  bookId,
  chapterTitle,
  questions,
  onUpdateQuestions,
  onGenerateAiQuestions,
  isGeneratingAiQuestions = false
}: QuizSectionProps) {
  // Mode: 'practice' (instant feedback) vs 'exam' (timed mock test)
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');

  // Exam timer states
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);

  // Question editing/adding state
  const [showEditor, setShowEditor] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editType, setEditType] = useState<QuestionType>('mcq');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editExplanation, setEditExplanation] = useState('');

  const currentQuestion = questions[currentQuestionIndex];
  const isFinished = examMode === 'practice' ? currentQuestionIndex >= questions.length : isExamSubmitted;

  // Timer countdown in Exam Mode
  useEffect(() => {
    let interval: any = null;
    if (examMode === 'exam' && isTimerRunning && timeLeft > 0 && !isExamSubmitted) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examMode, isTimerRunning, timeLeft, isExamSubmitted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExamMode = () => {
    setExamMode('exam');
    setTimeLeft(Math.max(5, questions.length * 2) * 60); // 2 mins per question
    setIsTimerRunning(true);
    setCurrentQuestionIndex(0);
    setAnswersMap({});
    setIsExamSubmitted(false);
  };

  const handleOptionSelect = (optIndex: number) => {
    if (examMode === 'practice') {
      if (isAnswered) return;
      setSelectedOption(optIndex);
      setIsAnswered(true);
      if (optIndex === currentQuestion.correctOptionIndex) {
        setScore(prev => prev + 1);
      }
    } else {
      // Exam Mode: simply record chosen option
      setAnswersMap(prev => ({ ...prev, [currentQuestionIndex]: optIndex }));
    }
  };

  const handleNextPractice = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleExamSubmit = async () => {
    setIsTimerRunning(false);
    setIsExamSubmitted(true);

    // Calculate final score
    let totalCorrect = 0;
    questions.forEach((q, idx) => {
      if (answersMap[idx] === q.correctOptionIndex) {
        totalCorrect++;
      }
    });
    setScore(totalCorrect);

    if (bookId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quiz_attempts').insert({
            user_id: user.id,
            book_id: bookId,
            score: (totalCorrect / Math.max(1, questions.length)) * 100,
            total_questions: questions.length,
            answers_log: Object.entries(answersMap).map(([idx, opt]) => ({
              questionIndex: Number(idx),
              selectedOption: opt,
              isCorrect: opt === questions[Number(idx)]?.correctOptionIndex
            }))
          });
        }
      } catch (err) {
        console.warn("Quiz attempt log warning:", err);
      }
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setAnswersMap({});
    setIsExamSubmitted(false);
    setTimeLeft(15 * 60);
    setIsTimerRunning(false);
  };

  // Add / Edit actions
  const startAddQuestion = () => {
    setEditingIndex(-1);
    setEditQuestionText('');
    setEditType('mcq');
    setEditOptions(['', '', '', '']);
    setEditCorrectIndex(0);
    setEditExplanation('');
    setShowEditor(true);
  };

  const startEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setEditQuestionText(q.question);
    setEditType(q.questionType || 'mcq');
    setEditOptions([...(q.options || ['', '', '', ''])]);
    setEditCorrectIndex(q.correctOptionIndex);
    setEditExplanation(q.explanation || '');
    setShowEditor(true);
  };

  const handleSaveQuestion = () => {
    if (!editQuestionText.trim()) return;

    const newQuestion: QuizQuestion = {
      id: editingIndex !== null && editingIndex >= 0 ? questions[editingIndex].id : `q-${Date.now()}`,
      question: editQuestionText,
      questionType: editType,
      options: editType === 'true_false' ? ['صح (صواب)', 'خطأ (غير صحيح)'] : editOptions.filter(o => o.trim().length > 0),
      correctOptionIndex: editCorrectIndex,
      explanation: editExplanation
    };

    let updated: QuizQuestion[] = [];
    if (editingIndex === -1) {
      updated = [...questions, newQuestion];
    } else if (editingIndex !== null && editingIndex >= 0) {
      updated = questions.map((q, i) => i === editingIndex ? newQuestion : q);
    }

    if (onUpdateQuestions) {
      onUpdateQuestions(updated);
    }
    setShowEditor(false);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    if (onUpdateQuestions) {
      onUpdateQuestions(updated);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Brain className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">بنك الأسئلة والاختبارات التفاعلية المتقدم</span>
          </div>
          <h3 className="text-xl font-black text-gray-900">
            {chapterTitle ? `اختبار: ${chapterTitle}` : 'الاختبار التفاعلي الذكي'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">اختبر مدى استيعابك للمفاهيم عبر أسئلة الاختيار، الصواب والخطأ، وتحليلات الـ AI.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* MODE SWITCHER */}
          <button
            onClick={() => {
              setExamMode('practice');
              handleReset();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition ${
              examMode === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 وضع التدريب والتغذية الفورية
          </button>

          <button
            onClick={startExamMode}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              examMode === 'exam'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏱️ بدء الامتحان التجريبي المؤقت</span>
          </button>

          {onGenerateAiQuestions && (
            <button
              onClick={onGenerateAiQuestions}
              disabled={isGeneratingAiQuestions}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAiQuestions ? 'جاري التوليد...' : 'توليد أسئلة بالـ AI'}</span>
            </button>
          )}

          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>إدارة الأسئلة</span>
          </button>
        </div>
      </div>

      {/* QUESTION MANAGEMENT DRAWER / EDITOR */}
      {showEditor && (
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h4 className="font-black text-sm text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>إدارة بنك الأسئلة ({questions.length} سؤال)</span>
            </h4>
            <button
              onClick={startAddQuestion}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سؤال يدوي</span>
            </button>
          </div>

          {editingIndex !== null && (
            <div className="bg-white border border-indigo-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900">
                  {editingIndex === -1 ? 'إضافة سؤال جديد' : `تعديل السؤال رقم ${editingIndex + 1}`}
                </span>
                <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نص السؤال</label>
                <input
                  type="text"
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نوع السؤال</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as QuestionType)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="mcq">اختيار من متعدد (4 خيارات)</option>
                    <option value="true_false">صح أم خطأ</option>
                    <option value="case_study">دراسة حالة / تحليلي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الإجابة الصحيحة</label>
                  <select
                    value={editCorrectIndex}
                    onChange={(e) => setEditCorrectIndex(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    {editType === 'true_false' ? (
                      <>
                        <option value={0}>الخيار الأول: صح (صواب)</option>
                        <option value={1}>الخيار الثاني: خطأ (غير صحيح)</option>
                      </>
                    ) : (
                      editOptions.map((_, i) => (
                        <option key={i} value={i}>الخيار رقم {i + 1}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {editType !== 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">خيارات الإجابة</label>
                  {editOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editOptions];
                        newOpts[i] = e.target.value;
                        setEditOptions(newOpts);
                      }}
                      placeholder={`الخيار ${i + 1}`}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-sans"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">التوضيح والتعليل التعليمي (AI Explanation)</label>
                <textarea
                  rows={2}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="اكتب التوضيح التعليمي لسبب صحة الإجابة..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm"
                >
                  حفظ السؤال
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-gray-800 line-clamp-1">{q.question}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditQuestion(idx)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. PRACTICE MODE (Instant Feedback) */}
      {examMode === 'practice' && !isFinished && currentQuestion && (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
            <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
            <span>النتيجة الحالية: {score} نقاط</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h4 className="text-lg font-black text-gray-900 leading-snug font-sans">
              {currentQuestion.question}
            </h4>

            {/* Options */}
            <div className="space-y-3">
              {(currentQuestion.options || []).map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctOptionIndex;
                let optStyle = "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100";

                if (isAnswered) {
                  if (isCorrect) {
                    optStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-black";
                  } else if (isSelected) {
                    optStyle = "bg-rose-50 border-rose-500 text-rose-950 font-black";
                  } else {
                    optStyle = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm transition flex items-center justify-between font-sans ${optStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Educational Explanation */}
            {isAnswered && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs leading-relaxed space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-indigo-900 font-black">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>الإيضاح التعليمي والتغذية الراجعة:</span>
                </div>
                <p className="text-indigo-950 font-medium">
                  {currentQuestion.explanation || 'الإجابة المحددة هي الخيار الأكثر دقة وفقاً لما ورد في محتوى هذا الفصل.'}
                </p>
              </div>
            )}

            {isAnswered && (
              <button
                onClick={handleNextPractice}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{currentQuestionIndex + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة النهائية'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. TIMED MOCK EXAM MODE */}
      {examMode === 'exam' && !isExamSubmitted && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
          {/* TIMER BANNER */}
          <div className="bg-slate-900 text-white p-4 px-6 rounded-2xl shadow-md flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">الوقت المتبقي للامتحان</span>
                <span className="text-xl font-black font-mono text-white">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">
                تمت الإجابة: {Object.keys(answersMap).length} من {questions.length}
              </span>
              <button
                onClick={handleExamSubmit}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md active:scale-95"
              >
                تسليم الامتحان الآن
              </button>
            </div>
          </div>

          {/* QUESTION GRID NAVIGATION */}
          <div className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border border-gray-200">
            {questions.map((_, idx) => {
              const isAnsweredThis = answersMap[idx] !== undefined;
              const isCurrent = currentQuestionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                      : isAnsweredThis
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* ACTIVE EXAM QUESTION */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                السؤال رقم {currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-bold text-gray-400">درجة واحدة</span>
            </div>

            <h4 className="text-lg font-black text-gray-900 leading-snug font-sans">
              {currentQuestion.question}
            </h4>

            <div className="space-y-3">
              {(currentQuestion.options || []).map((option, idx) => {
                const isSelected = answersMap[currentQuestionIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm transition flex items-center justify-between font-sans ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-black shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              {currentQuestionIndex + 1 < questions.length ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleExamSubmit}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-md"
                >
                  <span>إنهاء وتسليم الاختبار</span>
                  <FileCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FINAL RESULT & CERTIFICATE SCREEN */}
      {isFinished && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">
                {score / questions.length >= 0.8 ? 'تهانينا! أداء استثنائي ومتميز 🏆' : 'أحسنت المحاولة! مراجعة جيدة'}
              </h3>
              <p className="text-xs text-gray-500">
                لقد حققت <span className="font-black text-indigo-600 text-sm">{score}</span> من إجمالي <span className="font-black text-gray-800 text-sm">{questions.length}</span> درجات بنسبة إتقان <span className="font-black text-emerald-600 text-sm">{Math.round((score / Math.max(1, questions.length)) * 100)}%</span>
              </p>
            </div>

            {/* PERFORMANCE BADGES */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] text-emerald-700 font-bold block">الإجابات الصحيحة</span>
                <span className="text-lg font-black text-emerald-950">{score}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-[10px] text-rose-700 font-bold block">الإجابات الخاطئة</span>
                <span className="text-lg font-black text-rose-950">{questions.length - score}</span>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <span className="text-[10px] text-indigo-700 font-bold block">التقدير العام</span>
                <span className="text-lg font-black text-indigo-950">
                  {score / questions.length >= 0.9 ? 'ممتاز (A+)' : score / questions.length >= 0.75 ? 'جيد جداً (B)' : 'يحتاج مراجعة (C)'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الاختبار من البداية</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة النتيجة</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
