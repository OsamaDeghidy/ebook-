import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Radio,
  User,
  MessageSquare,
  Headphones,
  Info,
  Square
} from 'lucide-react';
import { useGlobalAudio } from '../hooks/useGlobalAudio';

interface TranscriptItem {
  speaker: string;
  text: string;
}

interface PodcastData {
  title: string;
  summary: string;
  transcript: TranscriptItem[];
  audioBase64?: string;
  mimeType?: string;
}

interface HostMessage {
  id: string;
  sender: 'user' | 'host';
  speakerName?: string;
  text: string;
  audioBase64?: string;
  mimeType?: string;
  timestamp: string;
}

interface PodcastLoungeProps {
  bookId?: string;
  chapterId?: string;
  chapterTitle: string;
  chapterContent: string;
  hasGeminiKey: boolean;
}

export default function PodcastLounge({
  bookId,
  chapterId,
  chapterTitle,
  chapterContent,
  hasGeminiKey
}: PodcastLoungeProps) {
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Global Audio Manager hook
  const { isItemPlaying, isItemLoading, play, stop } = useGlobalAudio();

  // Interactive Host Conversation State
  const [messages, setMessages] = useState<HostMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isTalkingToHost, setIsTalkingToHost] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isArabic = /[\u0600-\u06FF]/.test(chapterContent);

  const mainEpisodeId = `podcast-main-${chapterId || 'ch'}`;
  const isEpisodePlaying = isItemPlaying(mainEpisodeId);
  const isEpisodeLoading = isItemLoading(mainEpisodeId);

  // Check cached status on load instead of auto-generating
  useEffect(() => {
    checkPodcastStatus();
  }, [chapterId]);

  const checkPodcastStatus = async () => {
    if (!chapterId) return;
    try {
      const res = await fetch(`/api/ebooks/${bookId}/podcast/status?chapterId=${chapterId}&chapterTitle=${encodeURIComponent(chapterTitle)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ready') {
          setPodcast(data);
          setIsGenerating(false);
        } else if (data.status === 'generating') {
          setIsGenerating(true);
          setTimeout(checkPodcastStatus, 6000);
        }
      }
    } catch (e) {
      console.warn("Error checking podcast status:", e);
    }
  };

  const fetchOrCreatePodcast = async () => {
    if (!chapterId || !chapterContent) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/ebooks/${bookId}/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          chapterTitle,
          chapterContent
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start podcast generation.");
      }

      // Start polling for completion
      setTimeout(checkPodcastStatus, 5000);

      // Initial welcome message from the host
      if (messages.length === 0) {
        const initialHostMsg: HostMessage = {
          id: 'welcome',
          sender: 'host',
          speakerName: isArabic ? "فرح (مقدمة البودكاست)" : "Farah (Podcast Host)",
          text: isArabic
            ? `أهلاً بك في الاستوديو التفاعلي! جاري إعداد وتجهيز الحلقة في الخلفية الآن.. يمكنك سؤالي أي سؤال وسأجيبك بصوتي فوراً حتى يجهز البودكاست!`
            : `Welcome to the Interactive Studio! The podcast is currently generating in the background. Feel free to ask me any question and I'll reply with my real voice while we wait!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([initialHostMsg]);
      }
    } catch (err: any) {
      console.warn("Podcast generation error:", err);
      setError(err.message || "Podcast generation is temporarily unavailable.");
      setIsGenerating(false);
    }
  };

  // Play/Pause the full podcast episode or first dialogue line
  const togglePlayPodcast = () => {
    if (isEpisodePlaying || isEpisodeLoading) {
      stop();
      return;
    }

    if (podcast?.audioBase64) {
      play(mainEpisodeId, podcast.audioBase64);
    } else if (podcast?.transcript && podcast.transcript.length > 0) {
      // Chain play sequential lines
      playTranscriptLine(0);
    }
  };

  const playTranscriptLine = (index: number) => {
    if (!podcast?.transcript || index >= podcast.transcript.length) {
      stop();
      return;
    }
    const item = podcast.transcript[index];
    const lineId = `podcast-line-${chapterId}-${index}`;

    const isMale = item.speaker.includes('كريم') || item.speaker.toLowerCase().includes('alex');
    const cleanText = item.text.replace(/\[.*?\]/g, '').trim();

    play(
      lineId,
      async () => {
        const res = await fetch('/api/tts/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, speaker: isMale ? 'male' : 'female' })
        });
        if (!res.ok) throw new Error('TTS stream failed');
        return await res.blob();
      },
      {
        onEnded: () => {
          // Play next line in sequence
          if (index + 1 < podcast.transcript.length) {
            playTranscriptLine(index + 1);
          }
        }
      }
    );
  };

  // Play single snippet on click
  const playAudioSnippet = (text: string, base64Audio?: string, mimeType?: string, speaker?: string, customId?: string) => {
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    const itemId = customId || `podcast-snippet-${cleanText.substring(0, 20)}`;

    if (isItemPlaying(itemId) || isItemLoading(itemId)) {
      stop();
      return;
    }

    play(itemId, async () => {
      if (base64Audio) {
        return base64Audio;
      }
      const isMale = speaker && (speaker.includes('كريم') || speaker.toLowerCase().includes('alex') || speaker.includes('guest'));
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: isMale ? 'male' : 'female' })
      });
      if (!res.ok) throw new Error('TTS stream failed');
      return await res.blob();
    });
  };

  // Microphone Web Speech Recognition
  const toggleMicListening = () => {
    if (isListeningMic) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("التعرف على الصوت غير مدعوم في متصفحك. يرجى كتابة السؤال يدوياً.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isArabic ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningMic(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListeningMic(false);
      };
      recognition.onend = () => setIsListeningMic(false);

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setIsListeningMic(false);
    }
  };

  // Send question to Host
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isTalkingToHost) return;

    const userText = userInput.trim();
    setUserInput('');

    const userMsg: HostMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTalkingToHost(true);

    try {
      const res = await fetch(`/api/ebooks/${bookId}/podcast/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          chapterTitle,
          chapterContent,
          userMessage: userText
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "تعذر الحصول على رد من مقدمي البودكاست.");
      }

      const data = await res.json();
      const hostMsg: HostMessage = {
        id: `host-${Date.now()}`,
        sender: 'host',
        speakerName: data.speaker || (isArabic ? "فرح (مقدمة البودكاست)" : "Farah (Podcast Host)"),
        text: data.replyText,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/mp3',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, hostMsg]);

      // Automatically play response smoothly with global audio manager
      if (data.replyText) {
        playAudioSnippet(data.replyText, data.audioBase64, data.mimeType, 'فرح', `podcast-msg-${hostMsg.id}`);
      }
    } catch (err: any) {
      console.error("Host Talk Error:", err);
      const fallbackHostMsg: HostMessage = {
        id: `host-err-${Date.now()}`,
        sender: 'host',
        speakerName: isArabic ? "فرح (مقدمة البودكاست)" : "Farah (Podcast Host)",
        text: isArabic
          ? "اعتذر منك! وفقاً لمحتوى هذا الفصل، النقطة الأساسية تهدف لترسيخ المفاهيم المذكورة في الشرح."
          : "Thank you for asking! Based on this chapter, the primary takeaway is practical mastery.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackHostMsg]);
    } finally {
      setIsTalkingToHost(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* PODCAST HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black tracking-wide">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span>{isArabic ? "استوديو البودكاست التفاعلي المتطور" : "Interactive AI Podcast Studio"}</span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
              {podcast?.title || (isArabic ? `حلقة بودكاست: ${chapterTitle}` : `Podcast: ${chapterTitle}`)}
            </h3>

            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
              {podcast?.summary || (isArabic ? "حوار ممتع وطبيعي بين مقدمي البودكاست (كريم وفرح) يناقشان أهم مفاهيم هذا الفصل بشكل مبسط وشيق." : "An engaging, natural human conversation between podcast hosts breaking down this chapter's key ideas.")}
            </p>

            {/* HOST PERSONA BADGES */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center">
                  {isArabic ? "ك" : "A"}
                </div>
                <span className="text-xs font-bold text-gray-200">{isArabic ? "كريم (المحاور)" : "Alex (Co-Host)"}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs flex items-center justify-center">
                  {isArabic ? "ف" : "F"}
                </div>
                <span className="text-xs font-bold text-gray-200">{isArabic ? "فرح (الخبيرة)" : "Farah (Expert Host)"}</span>
              </div>
            </div>
          </div>

          {/* AUDIO CONTROLS & GENERATE BUTTON */}
          <div className="w-full md:w-auto flex flex-col items-stretch sm:items-end gap-3 shrink-0">
            {isGenerating ? (
              <div className="px-5 py-3 bg-indigo-900/60 border border-indigo-500/30 rounded-xl flex items-center gap-3 text-xs text-indigo-200">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>{isArabic ? "جاري إنتاج الحلقة والحوار الصوتي..." : "Producing podcast dialogue & voices..."}</span>
              </div>
            ) : podcast ? (
              <div className="space-y-2 w-full sm:w-auto">
                <button
                  onClick={togglePlayPodcast}
                  className={`w-full sm:w-auto px-6 py-3.5 font-black text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-lg transition active:scale-95 ${
                    isEpisodePlaying
                      ? 'bg-rose-500 hover:bg-rose-400 text-white'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  }`}
                >
                  {isEpisodeLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{isArabic ? "جاري تجهيز الصوت..." : "Loading Audio..."}</span>
                    </>
                  ) : isEpisodePlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>{isArabic ? "إيقاف البودكاست" : "Pause Episode"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                      <span>{isArabic ? "تشغيل الحلقة الصَوْتِيّة" : "Play Podcast Episode"}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={fetchOrCreatePodcast}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                <span>{isArabic ? "إنتاج البودكاست الصوتي" : "Generate Podcast Episode"}</span>
              </button>
            )}

            {error && (
              <p className="text-[11px] text-rose-300 bg-rose-950/50 p-2 rounded border border-rose-900 max-w-xs">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: PODCAST TRANSCRIPT & LIVE DISCUSSION LOUNGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT/MAIN: EPISODE TRANSCRIPT */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-600" />
              <span>{isArabic ? "نص حوار الحلقة الصوتي" : "Episode Dialogue Transcript"}</span>
            </h4>
            <span className="text-[10px] text-gray-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {isArabic ? "انقر على أي نص للاستماع بصوت الراوي البشري" : "Click any line to hear in human voice"}
            </span>
          </div>

          {podcast?.transcript && podcast.transcript.length > 0 ? (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {podcast.transcript.map((item, idx) => {
                const lineId = `podcast-line-${chapterId}-${idx}`;
                const isHost1 = item.speaker.includes('كريم') || item.speaker.toLowerCase().includes('alex');
                const isPlayingLine = isItemPlaying(lineId);
                const isLoadingLine = isItemLoading(lineId);

                return (
                  <div
                    key={idx}
                    onClick={() => playAudioSnippet(item.text, undefined, undefined, item.speaker, lineId)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer relative group ${
                      isPlayingLine
                        ? 'bg-indigo-50/90 border-indigo-400 shadow-sm'
                        : isHost1
                        ? 'bg-amber-50/30 border-amber-100 hover:border-amber-200'
                        : 'bg-rose-50/30 border-rose-100 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                        isHost1 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.speaker}
                      </span>
                      <button
                        className={`p-1 rounded transition ${
                          isPlayingLine ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                        }`}
                        title="Play dialogue line voice"
                      >
                        {isLoadingLine ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : isPlayingLine ? (
                          <Square className="w-3.5 h-3.5 fill-current text-rose-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <Radio className="w-8 h-8 mx-auto text-gray-400 animate-pulse" />
              <p className="text-xs">{isArabic ? "جاري تجهيز نص الحلقة الحواري..." : "Preparing episode script..."}</p>
            </div>
          )}
        </div>

        {/* RIGHT: LIVE VOICE & TEXT DISCUSSION WITH AI HOSTS */}
        <div className="lg:col-span-5 bg-white text-gray-900 rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-[580px]">
          
          {/* LOUNGE HEADER */}
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {isArabic ? "تحدث مع مقدمي البودكاست" : "Speak with Podcast Hosts"}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {isArabic ? "اطرح أي سؤال حول الفصل واستمع للرد الصوتي المباشر" : "Ask questions about the chapter & hear spoken replies"}
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-full">
              LIVE AI VOICE
            </span>
          </div>

          {/* CHAT MESSAGES LOG */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 custom-scrollbar">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const msgAudioId = `podcast-msg-${msg.id}`;
              const isMsgPlaying = isItemPlaying(msgAudioId);
              const isMsgLoading = isItemLoading(msgAudioId);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>{isUser ? (isArabic ? 'أنت' : 'You') : msg.speakerName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] relative group shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {!isUser && (
                      <button
                        onClick={() => playAudioSnippet(msg.text, msg.audioBase64, msg.mimeType, msg.speakerName, msgAudioId)}
                        className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                      >
                        {isMsgLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>{isArabic ? "جاري التجهيز..." : "Loading..."}</span>
                          </>
                        ) : isMsgPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-rose-600 animate-pulse" />
                            <span>{isArabic ? "إيقاف الصوت" : "Stop"}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>{isArabic ? "إعادة الاستماع للصوت" : "Replay Voice"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isTalkingToHost && (
              <div className="flex items-center gap-2 text-xs text-gray-600 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{isArabic ? "فرح تفكر وتصيغ الإجابة الصوتية..." : "Farah is formulating spoken answer..."}</span>
              </div>
            )}
          </div>

          {/* CHAT INPUT FORM (SPEECH MIC & TEXT INPUT) */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:border-indigo-500 transition">
              <button
                type="button"
                onClick={toggleMicListening}
                className={`p-2 rounded-lg transition ${
                  isListeningMic
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-white'
                }`}
                title="تحدث بالميكروفون"
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isArabic ? "اطرح سؤالك على فرح حول هذا الفصل..." : "Ask a question about this chapter..."}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none px-2"
              />

              <button
                type="submit"
                disabled={!userInput.trim() || isTalkingToHost}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
