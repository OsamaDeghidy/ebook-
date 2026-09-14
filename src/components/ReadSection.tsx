import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Square, FileText, Lightbulb, ListCollapse, BookOpen, Volume2, RefreshCw } from 'lucide-react';
import { Chapter } from '../types';
import { useGlobalAudio } from '../hooks/useGlobalAudio';
import { ContextualAiTutor } from './ai/ContextualAiTutor';

export function ReadSection({ chapter }: { chapter: Chapter }) {
  const { isItemPlaying, isItemLoading, play, stop } = useGlobalAudio();

  const handleToggleAudio = (id: string, text: string) => {
    const isPlaying = isItemPlaying(id);
    const isLoading = isItemLoading(id);

    if (isPlaying || isLoading) {
      stop();
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) return;

    play(id, async () => {
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: 'male' }) // use male neural narrator
      });

      if (!res.ok) {
        throw new Error('Failed to fetch audio stream');
      }

      const blob = await res.blob();
      return blob;
    });
  };

  const renderSection = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode, textForAudio: string) => {
    const isPlaying = isItemPlaying(id);
    const isLoading = isItemLoading(id);

    return (
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3 text-indigo-700">
            {icon}
            <h4 className="text-lg font-black">{title}</h4>
          </div>
          <button
            onClick={() => handleToggleAudio(id, textForAudio)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isPlaying
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 animate-pulse'
                : isLoading
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>جاري تحميل الصوت...</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف القراءة</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>استماع</span>
              </>
            )}
          </button>
        </div>
        <div className="prose prose-slate max-w-none text-gray-700 text-xs sm:text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  };

  const conceptsArr = Array.isArray(chapter.concepts) ? chapter.concepts : [];
  const conceptsText = conceptsArr.map(c => typeof c === 'string' ? c : `${(c as any).concept || (c as any).title || ''}: ${(c as any).explanation || (c as any).description || ''}`).join('\n\n');

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-gray-900 mb-6">{chapter.title}</h3>

      {/* Summary Section */}
      {chapter.summary && renderSection(
        `read-summary-${chapter.id}`,
        'الملخص الميسر',
        <ListCollapse className="w-5 h-5" />,
        <ReactMarkdown>{chapter.summary}</ReactMarkdown>,
        chapter.summary
      )}

      {/* Concepts Section */}
      {conceptsArr.length > 0 && renderSection(
        `read-concepts-${chapter.id}`,
        'المفاهيم والشرح',
        <Lightbulb className="w-5 h-5" />,
        <div className="space-y-4">
          {conceptsArr.map((concept: any, idx: number) => {
            const cName = typeof concept === 'string' ? concept : (concept.concept || concept.title || `مفهوم ${idx+1}`);
            const cDesc = typeof concept === 'string' ? '' : (concept.explanation || concept.description || '');
            return (
              <div key={idx} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <h5 className="font-bold text-amber-900 mb-2">{cName}</h5>
                {cDesc && <p className="text-amber-800 text-sm">{cDesc}</p>}
              </div>
            );
          })}
        </div>,
        conceptsText
      )}

      {/* Full Content (Fallback / Advanced) */}
      {chapter.content && renderSection(
        `read-content-${chapter.id}`,
        'المحتوى التعليمي الموسع',
        <BookOpen className="w-5 h-5" />,
        <ReactMarkdown>{chapter.content}</ReactMarkdown>,
        chapter.content
      )}

      {/* Original Content Section */}
      {chapter.originalContent && renderSection(
        `read-original-${chapter.id}`,
        'النص الأصلي من المذكرة',
        <FileText className="w-5 h-5" />,
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100 font-serif">
          {chapter.originalContent}
        </div>,
        chapter.originalContent
      )}

      {/* 🧠 CONTEXTUAL AI TUTOR (SELECTION EXPLAINER) */}
      <ContextualAiTutor chapterTitle={chapter.title} />
    </div>
  );
}
