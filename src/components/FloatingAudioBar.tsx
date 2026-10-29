import React, { useState } from 'react';
import { 
  Play, Pause, Volume2, RefreshCw, X, RotateCcw, RotateCw 
} from 'lucide-react';
import { useGlobalAudio } from '../hooks/useGlobalAudio';

interface FloatingAudioBarProps {
  onTriggerPlay?: () => void;
  chapterTitle?: string;
}

export default function FloatingAudioBar({ onTriggerPlay, chapterTitle }: FloatingAudioBarProps) {
  const { 
    activeId, 
    isPlaying, 
    isLoading, 
    currentTime, 
    duration, 
    togglePlayPause, 
    seek, 
    seekRelative, 
    stop, 
    setPlaybackRate 
  } = useGlobalAudio();

  const [speed, setSpeed] = useState<number>(1);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    setPlaybackRate(nextSpeed);
  };

  // If nothing is playing and no trigger is available, hide it
  if (!activeId && !isPlaying && !isLoading) {
    if (!onTriggerPlay) return null;
    
    // Sleek mini floating pill to start listening
    return (
      <div
        className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up"
        dir="rtl"
      >
        <button
          onClick={onTriggerPlay}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-950/90 hover:bg-slate-900 text-teal-300 font-bold text-xs shadow-xl border border-teal-500/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-3 h-3" />
          </div>
          <span>استمع للشرح صوتياً 🎧</span>
        </button>
      </div>
    );
  }

  const isHost = activeId?.includes('podcast') || activeId?.includes('host');
  const title = chapterTitle || (isHost ? 'حوار بودكاست تعليمي' : 'القارئ الصوتي للشرح');

  return (
    <div
      className="fixed bottom-16 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-slate-950/95 backdrop-blur-xl text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col gap-1.5 animate-slide-up"
      dir="rtl"
    >
      {/* Main Single Row Controls */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Playback Controls (-10s, Play/Pause, +10s) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => seekRelative(-10)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="ترجيع 10 ثوانٍ"
            aria-label="ترجيع 10 ثوانٍ"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-teal-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current mr-0.5" />
            )}
          </button>

          <button
            onClick={() => seekRelative(10)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="تقديم 10 ثوانٍ"
            aria-label="تقديم 10 ثوانٍ"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Track Title & Micro Time Counter */}
        <div className="min-w-0 flex-1 px-1 sm:px-2">
          <h4 className="text-[11px] sm:text-xs font-bold text-white truncate">{title}</h4>
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400">
            <span className="truncate max-w-[80px] sm:max-w-none">
              {isLoading ? 'تجهيز...' : isPlaying ? 'تشغيل' : 'مؤقت'}
            </span>
            <span>•</span>
            <span className="font-mono text-teal-300 font-bold shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Speed & Close Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile Speed Button (cycles) */}
          <button
            onClick={cycleSpeed}
            className="sm:hidden px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-300 font-bold text-[10px] transition cursor-pointer"
            title="تغيير السرعة"
          >
            {speed}x
          </button>

          {/* Desktop Speed Selector */}
          <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-[10px] font-bold">
            {[1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  setPlaybackRate(s);
                }}
                className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                  speed === s ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Close Player */}
          <button
            onClick={stop}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="إغلاق المشغل"
            aria-label="إغلاق المشغل"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Slim Integrated Scrubber */}
      <div className="flex items-center gap-1.5 px-0.5">
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 100}
          step={0.5}
          value={duration > 0 ? currentTime : 0}
          disabled={!duration || duration <= 0}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-hidden"
          aria-label="شريط تقدم الصوت"
        />
      </div>
    </div>
  );
}
