import React, { useState } from 'react';
import { Play, Pause, Square, Volume2, Sparkles, RefreshCw, X } from 'lucide-react';
import { useGlobalAudio } from '../hooks/useGlobalAudio';

export default function FloatingAudioBar() {
  const { activeId, isPlaying, isLoading, stop } = useGlobalAudio();
  const [speed, setSpeed] = useState<number>(1);

  if (!activeId && !isPlaying && !isLoading) {
    return null;
  }

  const isHost = activeId?.includes('podcast') || activeId?.includes('host');
  const speakerName = isHost ? 'فرح (استوديو البودكاست)' : 'القارئ الصوتي الذكي';

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-slate-900/95 backdrop-blur-md text-white p-3.5 px-5 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center justify-between gap-4 animate-slide-up"
      dir="rtl"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          ) : isPlaying ? (
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-black text-white block truncate">{speakerName}</span>
          <span className="text-[10px] text-gray-400 block truncate">
            {isLoading ? 'جاري تجهيز البث الصوتي...' : 'جاري الاستماع الآن'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Playback speed switcher */}
        <div className="flex items-center bg-white/10 rounded-xl p-0.5 text-[10px] font-bold">
          {[1, 1.25, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                const audios = document.querySelectorAll('audio');
                audios.forEach(a => a.playbackRate = s);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                speed === s ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Stop button */}
        <button
          onClick={() => stop()}
          className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shadow-sm active:scale-95"
          title="إيقاف الصوت"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
