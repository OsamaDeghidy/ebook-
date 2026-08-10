import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, X, FileText, Check } from 'lucide-react';
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
  const [content, setContent] = useState(chapter.content);
  const [imagePrompt, setImagePrompt] = useState(chapter.imagePrompt || '');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync state when active chapter changes
  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
    setImagePrompt(chapter.imagePrompt || '');
  }, [chapter]);

  const handleSave = () => {
    onSaveChapter({
      ...chapter,
      title,
      content,
      imagePrompt
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      
      {/* Title Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Chapter Workspace
          </h3>
          <p className="text-xs text-gray-400">Modify chapters, expand descriptions, or construct new modules.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onAddChapter}
            className="px-3 py-1.5 border hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Chapter
          </button>
          {canDelete && (
            <button
              onClick={onDeleteChapter}
              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Current
            </button>
          )}
        </div>
      </div>

      {/* Editing Area */}
      <div className="space-y-4 text-xs">
        
        {/* Chapter Title Input */}
        <div>
          <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Chapter Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition text-sm font-semibold"
          />
        </div>

        {/* Chapter Markdown Content Textarea */}
        <div>
          <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Chapter Content (Markdown Supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition font-mono leading-relaxed"
          />
          <span className="text-[10px] text-gray-400 mt-1 block leading-normal">
            Supports Standard Markdown syntax including headings, bold text, list items, and blockquotes.
          </span>
        </div>

        {/* Chapter Image Generation Prompt Input */}
        <div>
          <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            AI Visual Illustration Prompt
          </label>
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition"
          />
          <span className="text-[10px] text-gray-400 mt-1 block">
            Used to regenerate chapter banners via 'gemini-3.1-flash-lite-image'.
          </span>
        </div>

      </div>

      {/* Save Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="h-6">
          {showSavedToast && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" /> Changes successfully saved in chapter memory!
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Workspace Changes
        </button>
      </div>

    </div>
  );
}
