import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FileText, Check, Search, Replace, Sparkles, AlertCircle } from 'lucide-react';
import { Chapter } from '../types';

interface ChapterEditorProps {
  chapter: Chapter;
  onSaveChapter: (updatedChapter: Chapter) => void;
  onAddChapter: () => void;
  onDeleteChapter: () => void;
  canDelete: boolean;
}

export default function ChapterEditor({
  chapter,
  onSaveChapter,
  onAddChapter,
  onDeleteChapter,
  canDelete
}: ChapterEditorProps) {
  const [title, setTitle] = useState(chapter.title);
  const [summary, setSummary] = useState(chapter.summary || '');
  const [content, setContent] = useState(chapter.content);
  const [originalContent, setOriginalContent] = useState(chapter.originalContent || '');
  const [imagePrompt, setImagePrompt] = useState(chapter.imagePrompt || '');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Find and Replace Tool State
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [replaceMessage, setReplaceMessage] = useState<string | null>(null);

  // Sync state when active chapter changes
  useEffect(() => {
    setTitle(chapter.title);
    setSummary(chapter.summary || '');
    setContent(chapter.content);
    setOriginalContent(chapter.originalContent || '');
    setImagePrompt(chapter.imagePrompt || '');
    setReplaceMessage(null);
  }, [chapter]);

  const handleSave = () => {
    onSaveChapter({
      ...chapter,
      title,
      summary,
      content,
      originalContent,
      imagePrompt
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleFindAndReplace = (scope: 'all' | 'content') => {
    if (!findWord.trim()) return;

    const regex = new RegExp(findWord, 'g');
    let count = 0;

    const countMatches = (text: string) => (text.match(regex) || []).length;
    count += countMatches(content);
    const newContent = content.replace(regex, replaceWord);
    setContent(newContent);

    let newTitle = title;
    let newSummary = summary;
    let newOriginal = originalContent;

    if (scope === 'all') {
      count += countMatches(title) + countMatches(summary) + countMatches(originalContent);
      newTitle = title.replace(regex, replaceWord);
      newSummary = summary.replace(regex, replaceWord);
      newOriginal = originalContent.replace(regex, replaceWord);
      setTitle(newTitle);
      setSummary(newSummary);
      setOriginalContent(newOriginal);
    }

    setReplaceMessage(`تم استبدال ${count} تطابق لكلمة "${findWord}" بـ "${replaceWord}" بنجاح! لا تنسَ الضغط على حفظ التعديلات.`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 space-y-6" dir="rtl">
      
      {/* Title Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>محرر وتصحيح محتوى الفصل</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">عدّل أي خطأ لغوي أو نصي، وحدّث الشرح والعناوين بكل سهولة دون الحاجة لإعادة توليد الكتاب.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onAddChapter}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فصل جديد</span>
          </button>
          {canDelete && (
            <button
              onClick={onDeleteChapter}
              className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف هذا الفصل</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK FIND & REPLACE TOOL */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>أداة البحث والاستبدال السريع للأخطاء الإملائية (Find & Replace)</span>
          </span>
          <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-100">
            تعديل بنقرة واحدة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1">الكلمة أو الخطأ المراد تغييره</label>
            <input
              type="text"
              placeholder="مثال: فقر (أو الكلمة التي قرأها OCR بالخطأ)"
              value={findWord}
              onChange={(e) => setFindWord(e.target.value)}
              className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-sans"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1">الكلمة الصحيحة البديلة</label>
            <input
              type="text"
              placeholder="مثال: الفقر (أو التصحيح الدقيق)"
              value={replaceWord}
              onChange={(e) => setReplaceWord(e.target.value)}
              className="w-full p-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        {replaceMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{replaceMessage}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleFindAndReplace('all')}
            disabled={!findWord.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>استبدال في كل نصوص الفصل والعنوان</span>
          </button>
        </div>
      </div>

      {/* Editing Area */}
      <div className="space-y-4">
        
        {/* Chapter Title Input */}
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5">
            عنوان الفصل
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-sm font-bold text-gray-900"
          />
        </div>

        {/* Chapter Summary Input */}
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5">
            الملخص الميسر للفصل
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-xs leading-relaxed text-gray-800 resize-none"
          />
        </div>

        {/* Chapter Markdown Content Textarea */}
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5">
            المحتوى التعليمي الموسع (يدعم تنسيق Markdown والعناوين)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-xs font-mono leading-relaxed text-gray-900"
          />
          <span className="text-[10px] text-gray-400 mt-1 block">
            يدعم كتابة الفقرات، القوائم النقطية، العناوين بالـ Markdown، والتشكيل باللغة العربية.
          </span>
        </div>

        {/* Original Parsed Content */}
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5">
            النص الأصلي المأخوذ من المذكرة أو الكتاب
          </label>
          <textarea
            value={originalContent}
            onChange={(e) => setOriginalContent(e.target.value)}
            rows={4}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-xs leading-relaxed text-gray-700 font-serif resize-none"
          />
        </div>

        {/* Chapter Image Generation Prompt Input */}
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5">
            وصف الصورة التوضيحية (AI Image Prompt)
          </label>
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-xs text-gray-800"
          />
        </div>

      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          {showSavedToast && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ تعديلات الفصل في قاعدة البيانات بنجاح!</span>
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات في الكتاب</span>
        </button>
      </div>

    </div>
  );
}
