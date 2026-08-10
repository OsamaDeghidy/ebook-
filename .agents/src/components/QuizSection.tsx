import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Plus, Trash2, Edit3, HelpCircle, Check, X, Sparkles } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizSectionProps {
  questions: QuizQuestion[];
  onUpdateQuestions: (updatedQuestions: QuizQuestion[]) => void;
  onGenerateAiQuestions?: () => void;
  isGeneratingAiQuestions?: boolean;
}

export default function QuizSection({ 
  questions, 
  onUpdateQuestions,
  onGenerateAiQuestions,
  isGeneratingAiQuestions = false
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showEditor, setShowEditor] = useState(false);

  // Question editing/adding state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editExplanation, setEditExplanation] = useState('');

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (optIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optIndex);
    setIsAnswered(true);
    if (optIndex === currentQuestion.correctOptionIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
  };

  // Add / Edit actions
  const startAddQuestion = () => {
    setEditingIndex(-1); // -1 means adding
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
    const updated = questions.filter((_, idx) => idx !== index);
    onUpdateQuestions(updated);
    if (currentQuestionIndex >= updated.length && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(updated.length - 1);
    }
    handleReset();
  };

  if (questions.length === 0) {
    return (
      <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center max-w-2xl mx-auto my-6">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-700 mb-1">No Quiz Questions Available</h3>
        <p className="text-sm text-slate-500 mb-4">You can add custom multiple choice questions to this section.</p>
        <button
          onClick={startAddQuestion}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs transition"
        >
          Create First Question
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Editor Panel Toggle */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="text-xs text-slate-600">
          <span className="font-bold">{questions.length}</span> Quiz Questions active on this Chapter
        </div>
        <div className="flex gap-2">
          {onGenerateAiQuestions && (
            <button
              onClick={onGenerateAiQuestions}
              disabled={isGeneratingAiQuestions}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 border border-indigo-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse fill-indigo-100" />
              {isGeneratingAiQuestions ? "Generating..." : "Generate AI Questions"}
            </button>
          )}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {showEditor ? "Hide Quiz Editor" : "Manage Quiz"}
          </button>
          <button
            onClick={startAddQuestion}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Question
          </button>
        </div>
      </div>

      {/* QUIZ EDITOR FORM */}
      {showEditor && (
        <div className="bg-white border-2 border-indigo-100 p-4 rounded-xl shadow-sm space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              {editingIndex === null ? "Manage Existing Questions" : editingIndex === -1 ? "Add New Quiz Question" : `Edit Question #${editingIndex + 1}`}
            </h3>
            {editingIndex !== null && (
              <button onClick={() => { setEditingIndex(null); }} className="text-slate-400 hover:text-slate-600 text-xs font-medium">
                Cancel Form
              </button>
            )}
          </div>

          {editingIndex === null ? (
            /* List of questions to choose for edit/delete */
            <div className="divide-y max-h-60 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="font-medium text-slate-700 truncate pr-4 max-w-lg">
                    {idx + 1}. {q.question}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditQuestion(idx)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Editing form contents */
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Question Prompt</label>
                <input
                  type="text"
                  placeholder="e.g., What is the powerhouse of the cell?"
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editOptions.map((opt, oIdx) => (
                  <div key={oIdx}>
                    <label className="block font-bold text-slate-600 mb-1">
                      Option {String.fromCharCode(65 + oIdx)} {editCorrectIndex === oIdx ? "(Correct)" : ""}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...editOptions];
                          updated[oIdx] = e.target.value;
                          setEditOptions(updated);
                        }}
                        className="flex-1 p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setEditCorrectIndex(oIdx)}
                        className={`px-2 rounded border font-medium ${editCorrectIndex === oIdx ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-400 hover:bg-slate-50"}`}
                      >
                        Set Correct
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Answer Explanation</label>
                <textarea
                  placeholder="Provide an educational explanation of why this answer is correct..."
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1.5 border hover:bg-slate-50 text-slate-700 rounded font-semibold"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Save Question
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUIZ PLAYER CARDS */}
      {!showEditor && (
        currentQuestionIndex < questions.length ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            
            {/* Header: Score and Progress */}
            <div className="flex justify-between items-center border-b pb-3.5 border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <div className="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-600">
                Score: {score} / {questions.length}
              </div>
            </div>

            {/* Question Prompt */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 text-base leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQuestion.correctOptionIndex;
                const showSuccess = isAnswered && isCorrect;
                const showFailure = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleOptionSelect(oIdx)}
                    disabled={isAnswered}
                    className={`p-3.5 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
                      showSuccess
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : showFailure
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                        : isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    {showSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />}
                    {showFailure && <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card displayed upon answer selection */}
            {isAnswered && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  {selectedOption === currentQuestion.correctOptionIndex ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Correct Answer!
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <X className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentQuestion.explanation || "No conceptual breakdown provided."}
                </p>
                
                {/* Navigation Button */}
                <div className="pt-2.5 flex justify-end">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded font-semibold text-xs transition-all"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs transition-all"
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Quiz Complete State */
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Quiz Complete!</h3>
              <p className="text-sm text-slate-500 mt-1">Excellent effort in reinforcing your understanding!</p>
            </div>

            {/* Score display with percentage */}
            <div className="bg-slate-50 py-4 px-6 rounded-lg max-w-xs mx-auto border">
              <span className="block text-3xl font-extrabold text-slate-800">
                {Math.round((score / questions.length) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Correct: {score} of {questions.length} questions
              </span>
            </div>

            <div>
              <button
                onClick={handleReset}
                className="px-4 py-2 border hover:bg-slate-50 rounded font-semibold text-xs text-slate-700 inline-flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
              </button>
            </div>
          </div>
        )
      )}

    </div>
  );
}
