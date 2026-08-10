import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Plus, Trash2, Edit3, HelpCircle, Check, X, Sparkles, Award, FileText, CheckSquare } from 'lucide-react';
import { QuizQuestion } from '../types';
import { supabase } from '../lib/supabase';

interface QuizSectionProps {
  bookId?: string;
  questions: QuizQuestion[];
  onUpdateQuestions?: (updatedQuestions: QuizQuestion[]) => void;
  onGenerateAiQuestions?: () => void;
  isGeneratingAiQuestions?: boolean;
}

export default function QuizSection({
  bookId,
  questions,
  onUpdateQuestions,
  onGenerateAiQuestions,
  isGeneratingAiQuestions = false
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState<{ questionId: string; selectedOption: number; isCorrect: boolean }[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isSavedToDb, setIsSavedToDb] = useState(false);

  // Question editing/adding state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editExplanation, setEditExplanation] = useState('');

  const currentQuestion = questions[currentQuestionIndex];
  const isFinished = currentQuestionIndex >= questions.length;

  const handleOptionSelect = (optIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optIndex);
    setIsAnswered(true);

    const isCorrect = optIndex === currentQuestion.correctOptionIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setAnswersLog(prev => [
      ...prev,
      {
        questionId: currentQuestion.id || `q-${currentQuestionIndex}`,
        selectedOption: optIndex,
        isCorrect
      }
    ]);
  };

  const handleNext = async () => {
    const nextIdx = currentQuestionIndex + 1;
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentQuestionIndex(nextIdx);

    // If finished, save results to Supabase
    if (nextIdx >= questions.length && bookId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quiz_attempts').insert({
            user_id: user.id,
            book_id: bookId,
            score: ((score + (selectedOption === currentQuestion?.correctOptionIndex ? 1 : 0)) / questions.length) * 100,
            total_questions: questions.length,
            answers_log: answersLog
          });
          setIsSavedToDb(true);
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
    setAnswersLog([]);
    setIsSavedToDb(false);
  };

  // Add / Edit actions
  const startAddQuestion = () => {
    setEditingIndex(-1);
    setEditQuestionText('');
    setEditOptions(['', '', '', '']);
    setEditCorrectIndex(0);
    setEditExplanation('');
    setShowEditor(true);
  };

  const startEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setEditQuestionText(q.question);
    setEditOptions([...q.options]);
    setEditCorrectIndex(q.correctOptionIndex);
    setEditExplanation(q.explanation);
    setShowEditor(true);
  };

  const handleSaveQuestion = () => {
    if (!editQuestionText.trim() || editOptions.some(o => !o.trim())) return;
    if (!onUpdateQuestions) return;

    const newQuestion: QuizQuestion = {
      id: editingIndex === -1 ? `q-new-${Date.now()}` : questions[editingIndex!].id,
      question: editQuestionText,
      options: [...editOptions],
      correctOptionIndex: editCorrectIndex,
      explanation: editExplanation
    };

    let updated: QuizQuestion[];
    if (editingIndex === -1) {
      updated = [...questions, newQuestion];
    } else {
      updated = questions.map((q, idx) => idx === editingIndex ? newQuestion : q);
    }

    onUpdateQuestions(updated);
    setShowEditor(false);
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!onUpdateQuestions) return;
    const updated = questions.filter((_, idx) => idx !== index);
    onUpdateQuestions(updated);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">لا توجد أسئلة أو بنك اختبارات حالياً</h3>
        <p className="text-xs text-gray-500">يمكنك إضافة أسئلة يدوياً أو توليدها بواسطة الذكاء الاصطناعي</p>

        {onGenerateAiQuestions && (
          <button
            onClick={onGenerateAiQuestions}
            disabled={isGeneratingAiQuestions}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 mx-auto transition"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{isGeneratingAiQuestions ? 'جاري توليد بنك الأسئلة...' : 'توليد بنك أسئلة بالـ AI'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 text-right shadow-sm">
      {/* HEADER & SCORE COUNTER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">بنك الأسئلة والاختبارات التفاعلية</h3>
            <p className="text-xs text-gray-500">اختبر فهمك للمعلومات الأكاديمية واستعرض التقييم العلمي</p>
          </div>
        </div>

        {onUpdateQuestions && (
          <div className="flex items-center gap-2">
            {onGenerateAiQuestions && (
              <button
                onClick={onGenerateAiQuestions}
                disabled={isGeneratingAiQuestions}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAiQuestions ? 'جاري التوليد...' : 'توليد AI'}</span>
              </button>
            )}
            <button
              onClick={startAddQuestion}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>إضافة سؤال</span>
            </button>
          </div>
        )}
      </div>

      {/* FINISHED RESULTS VIEW */}
      {isFinished ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto text-white shadow-lg animate-bounce">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-black text-gray-900">أحسنت! أكملت بنك الاختبار بنجاح</h4>
            <p className="text-gray-500 text-xs">
              حصلت على <span className="text-emerald-500 font-black text-base">{score}</span> من أصل <span className="text-gray-900 font-bold text-base">{questions.length}</span> درجة
            </p>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden p-0.5 border border-gray-300 max-w-md mx-auto">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(score / questions.length) * 100}%` }}
            />
          </div>

          {isSavedToDb && (
            <p className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" />
              تم تسجيل تقييمك في سجلات الأداء بالـ Backend في Supabase
            </p>
          )}

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 mx-auto shadow transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة محاولة الاختبار</span>
          </button>
        </div>
      ) : (
        /* ACTIVE QUESTION VIEW */
        <div className="space-y-6">
          {/* PROGRESS INDICATOR */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
            <span>السؤال <span className="text-indigo-600 font-black">{currentQuestionIndex + 1}</span> من {questions.length}</span>
            <span>النتيجة الحالية: <span className="text-emerald-600 font-black">{score}</span></span>
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* QUESTION CARD */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-base sm:text-lg font-black text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </h4>

              {onUpdateQuestions && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEditQuestion(currentQuestionIndex)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(currentQuestionIndex)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* OPTIONS GRID */}
            <div className="space-y-3">
              {currentQuestion.options.map((optionText, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrect = optIdx === currentQuestion.correctOptionIndex;

                let btnStyle = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm";
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm";
                  } else if (isSelected) {
                    btnStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-sm";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(optIdx)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border text-xs sm:text-sm font-semibold text-right flex items-center justify-between transition ${btnStyle}`}
                  >
                    <span className="leading-relaxed">{optionText}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* EXPLANATION */}
            {isAnswered && currentQuestion.explanation && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed space-y-1 animate-fade-in">
                <span className="font-bold text-indigo-700 block">التفسير العلمي والشرح:</span>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            {/* NEXT BUTTON */}
            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-98"
              >
                {currentQuestionIndex + 1 < questions.length ? 'السؤال التالي ➔' : 'عرض النتيجة والتقييم النهائي'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUESTION EDITOR MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">
              {editingIndex === -1 ? 'إضافة سؤال جديد' : 'تعديل السؤال'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">نص السؤال</label>
              <textarea
                rows={2}
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600">الخيارات (اختر الإجابة الصحيحة)</label>
              {editOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={editCorrectIndex === idx}
                    onChange={() => setEditCorrectIndex(idx)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...editOptions];
                      updated[idx] = e.target.value;
                      setEditOptions(updated);
                    }}
                    placeholder={`الخيار ${idx + 1}`}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">التفسير العلمي للشرح</label>
              <textarea
                rows={2}
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
              >
                حفظ السؤال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
