import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Square, FileText, Lightbulb, ListCollapse, BookOpen } from 'lucide-react';
import { Chapter } from '../types';

export function ReadSection({ chapter }: { chapter: Chapter }) {
  const [activeAudioSection, setActiveAudioSection] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveAudioSection(null);
  };

  const playAudio = async (text: string, sectionId: string) => {
    stopAudio();
    if (!text.trim()) return;

    setActiveAudioSection(sectionId);

    try {
      const cleanText = text.replace(/[*_#`]/g, '').trim();
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: 'male' }) // use male/Hamed for narration
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onended = () => setActiveAudioSection(null);
        audio.onerror = () => setActiveAudioSection(null);
        
        audioRef.current = audio;
        await audio.play();
      } else {
        setActiveAudioSection(null);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
      setActiveAudioSection(null);
    }
  };

  const renderSection = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode, textForAudio: string) => {
    const isPlaying = activeAudioSection === id;

    return (
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3 text-indigo-700">
            {icon}
            <h4 className="text-lg font-black">{title}</h4>
          </div>
          <button
            onClick={() => isPlaying ? stopAudio() : playAudio(textForAudio, id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف القراءة</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
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
  const conceptsText = conceptsArr.map(c => `${c.concept}: ${c.explanation}`).join('\n\n');

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-gray-900 mb-6">{chapter.title}</h3>

      {/* Summary Section */}
      {chapter.summary && renderSection(
        'summary',
        'الملخص الميسر',
        <ListCollapse className="w-5 h-5" />,
        <ReactMarkdown>{chapter.summary}</ReactMarkdown>,
        chapter.summary
      )}

      {/* Concepts Section */}
      {conceptsArr.length > 0 && renderSection(
        'concepts',
        'المفاهيم والشرح',
        <Lightbulb className="w-5 h-5" />,
        <div className="space-y-4">
          {conceptsArr.map((concept, idx) => (
            <div key={idx} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-900 mb-2">{concept.concept}</h5>
              <p className="text-amber-800 text-sm">{concept.explanation}</p>
            </div>
          ))}
        </div>,
        conceptsText
      )}

      {/* Full Content (Fallback / Advanced) */}
      {chapter.content && renderSection(
        'content',
        'المحتوى التعليمي الموسع',
        <BookOpen className="w-5 h-5" />,
        <ReactMarkdown>{chapter.content}</ReactMarkdown>,
        chapter.content
      )}

      {/* Original Content Section */}
      {chapter.originalContent && renderSection(
        'originalContent',
        'النص الأصلي من المذكرة',
        <FileText className="w-5 h-5" />,
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100 font-serif">
          {chapter.originalContent}
        </div>,
        chapter.originalContent
      )}
    </div>
  );
}
