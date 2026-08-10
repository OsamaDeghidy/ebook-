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
  Info
} from 'lucide-react';

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
  bookId: string;
  chapterId: string;
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

  // Main Podcast Audio Player State
  const [isPlayingPodcast, setIsPlayingPodcast] = useState<boolean>(false);
  const [podcastProgress, setPodcastProgress] = useState<number>(0);
  const podcastAudioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive Host Conversation State
  const [messages, setMessages] = useState<HostMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isTalkingToHost, setIsTalkingToHost] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const isArabic = /[\u0600-\u06FF]/.test(chapterContent);

  // Auto-generate or fetch cached podcast on load
  useEffect(() => {
    fetchOrCreatePodcast();
  }, [chapterId]);

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
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load podcast episode.");
      }

      const data = await res.json();
      setPodcast(data);

      if (data.audioBase64) {
        setupPodcastAudio(data.audioBase64, data.mimeType || 'audio/mp3');
      }

      // Initial welcome message from the host
      const initialHostMsg: HostMessage = {
        id: 'welcome',
        sender: 'host',
        speakerName: isArabic ? "سلمى (مقدمة البودكاست)" : "Sarah (Podcast Host)",
        text: isArabic
          ? `أهلاً بك في الاستوديو التفاعلي! أنا سلمى، ومعي كريم. استمع للحلقة أو اسألنا أي سؤال حول فصل "${chapterTitle}" وسنجيبك بصوتنا البشري مباشرة!`
          : `Welcome to the Interactive Studio! I'm Sarah, along with Alex. Listen to the episode or ask us any question about "${chapterTitle}" and we'll reply in human voice!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialHostMsg]);
    } catch (err: any) {
      console.warn("Podcast generation error:", err);
      setError(err.message || "Podcast generation is temporarily unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  const setupPodcastAudio = (base64Audio: string, mimeType: string) => {
    try {
      const binaryString = window.atob(base64Audio.trim());
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      if (podcastAudioRef.current) {
        podcastAudioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingPodcast(false);
        setPodcastProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPodcastProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      podcastAudioRef.current = audio;
    } catch (e) {
      console.warn("Failed to set up podcast audio blob:", e);
    }
  };

  const togglePlayPodcast = () => {
    if (!podcastAudioRef.current) return;
    stopAllAudio();
    if (isPlayingPodcast) {
      podcastAudioRef.current.pause();
      setIsPlayingPodcast(false);
    } else {
      podcastAudioRef.current.play().then(() => {
        setIsPlayingPodcast(true);
      }).catch(e => console.warn("Podcast playback error:", e));
    }
  };

  const stopAllAudio = () => {
    if (podcastAudioRef.current) {
      podcastAudioRef.current.pause();
      setIsPlayingPodcast(false);
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setActiveSpeechText(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Play a specific host audio snippet
  const playAudioSnippet = async (text: string, base64Audio?: string, mimeType?: string) => {
    stopAllAudio();

    if (activeSpeechText === text) {
      return;
    }

    if (base64Audio) {
      try {
        const binaryString = window.atob(base64Audio.trim());
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType || 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => setActiveSpeechText(null);
        audio.onerror = () => setActiveSpeechText(null);

        activeAudioRef.current = audio;
        setActiveSpeechText(text);
        await audio.play();
        return;
      } catch (e) {
        console.warn("Error playing audio snippet blob, falling back:", e);
      }
    }

    // Fallback: Fetch snippet TTS or browser speech
    try {
      setActiveSpeechText(text);
      const res = await fetch('/api/narrate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const binaryString = window.atob(data.audioBase64.trim());
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mimeType || 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          audio.onended = () => setActiveSpeechText(null);
          audio.onerror = () => setActiveSpeechText(null);

          activeAudioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Server audio fallback to browser synthesis:", e);
    }

    // Browser SpeechSynthesis fallback
    if (window.speechSynthesis) {
      const clean = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.onend = () => setActiveSpeechText(null);
      utterance.onerror = () => setActiveSpeechText(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Microhpone Web Speech Recognition
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
      alert("Microphone voice input is not supported in this browser. You can type your message below!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isArabic ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningMic(true);
      recognition.onend = () => setIsListeningMic(false);
      recognition.onerror = () => setIsListeningMic(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput(transcript);
          handleSendToHost(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListeningMic(false);
    }
  };

  // Send question/thought to AI Host
  const handleSendToHost = async (overrideText?: string) => {
    const textToSend = overrideText || userInput;
    if (!textToSend.trim() || isTalkingToHost) return;

    const userMsg: HostMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTalkingToHost(true);

    try {
      const res = await fetch(`/api/ebooks/${bookId}/podcast/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle,
          chapterContent,
          userMessage: textToSend.trim()
        })
      });

      if (!res.ok) {
        throw new Error("Host response failed.");
      }

      const data = await res.json();
      const hostMsg: HostMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'host',
        speakerName: data.speaker || (isArabic ? "سلمى (مقدمة البودكاست)" : "Sarah (Podcast Host)"),
        text: data.replyText,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, hostMsg]);

      // Automatically speak the host's spoken response!
      if (data.replyText) {
        playAudioSnippet(data.replyText, data.audioBase64, data.mimeType);
      }
    } catch (err: any) {
      console.warn("Error sending message to host:", err);
      const errorMsg: HostMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'host',
        speakerName: isArabic ? "سلمى (مقدمة البودكاست)" : "Sarah (Podcast Host)",
        text: isArabic
          ? "اعتذر جداً! حدث بطء مؤقت في البث الصوتي. لكن باختصار، هذه النقطة تهدف إلى تعزيز الفهم والتطبيق العملي."
          : "Pardon me! There was a brief pause in our audio stream. Briefly put, this topic reinforces hands-on learning.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTalkingToHost(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PODCAST PLAYER & EPISODE BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                {isArabic ? "استوديو البودكاست التفاعلي" : "AI Interactive Podcast Studio"}
              </span>
              {hasGeminiKey && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                  🎙️ Gemini Multi-Speaker HD Voice
                </span>
              )}
            </div>

            <h3 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
              {podcast?.title || (isArabic ? `حلقة بودكاست: ${chapterTitle}` : `Podcast Episode: ${chapterTitle}`)}
            </h3>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              {podcast?.summary || (isArabic ? "حوار حوار ممتع وطبيعي بين مقدمي البودكاست (كريم وسلمى) يناقشان أهم مفاهيم هذا الفصل بشكل مبسط وشيق." : "An engaging, natural human conversation between podcast hosts breaking down this chapter's key ideas.")}
            </p>

            {/* HOST PERSONA BADGES */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center">
                  {isArabic ? "ك" : "A"}
                </div>
                <span className="text-xs font-bold text-slate-200">{isArabic ? "كريم (المحاور)" : "Alex (Co-Host)"}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs flex items-center justify-center">
                  {isArabic ? "س" : "S"}
                </div>
                <span className="text-xs font-bold text-slate-200">{isArabic ? "سلمى (الخبيرة)" : "Sarah (Expert Host)"}</span>
              </div>
            </div>
          </div>

          {/* AUDIO CONTROLS & GENERATE BUTTON */}
          <div className="w-full md:w-auto flex flex-col items-stretch sm:items-end gap-3 shrink-0">
            {isGenerating ? (
              <div className="px-5 py-3 bg-indigo-950/80 border border-indigo-800 rounded-xl flex items-center gap-3 text-xs text-indigo-200">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>{isArabic ? "جاري إنتاج الحلقة والحوار الصوتي..." : "Producing podcast dialogue & voices..."}</span>
              </div>
            ) : podcast ? (
              <div className="space-y-2 w-full sm:w-auto">
                <button
                  onClick={togglePlayPodcast}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  {isPlayingPodcast ? (
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

                {podcastAudioRef.current && (
                  <div className="w-full bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full transition-all" style={{ width: `${podcastProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={fetchOrCreatePodcast}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
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
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {isArabic ? "انقر على أي نص للاستماع بصوت الراوي البشرية" : "Click any line to hear in human voice"}
            </span>
          </div>

          {podcast?.transcript && podcast.transcript.length > 0 ? (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {podcast.transcript.map((item, idx) => {
                const isHost1 = item.speaker.includes('كريم') || item.speaker.toLowerCase().includes('alex');
                const isSpeakingThis = activeSpeechText === item.text;

                return (
                  <div
                    key={idx}
                    onClick={() => playAudioSnippet(item.text)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer relative group ${
                      isSpeakingThis
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
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
                          isSpeakingThis ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                        }`}
                        title="Play dialogue line voice"
                      >
                        {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Radio className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
              <p className="text-xs">{isArabic ? "جاري تجهيز نص الحلقة الحواري..." : "Preparing episode script..."}</p>
            </div>
          )}
        </div>

        {/* RIGHT: LIVE VOICE & TEXT DISCUSSION WITH AI HOSTS */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between h-[580px]">
          
          {/* LOUNGE HEADER */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isArabic ? "تحدث مع مقدمي البودكاست" : "Speak with Podcast Hosts"}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isArabic ? "اطرح أي سؤال حول الفصل واستمع للرد الصوتي المباشر" : "Ask questions about the chapter & hear spoken replies"}
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold rounded-full">
              LIVE AI VOICE
            </span>
          </div>

          {/* CHAT MESSAGES LOG */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 custom-scrollbar">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSpeakingThis = activeSpeechText === msg.text;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{isUser ? (isArabic ? 'أنت' : 'You') : msg.speakerName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] relative group ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {!isUser && (
                      <button
                        onClick={() => playAudioSnippet(msg.text, msg.audioBase64, msg.mimeType)}
                        className="mt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3 h-3 animate-pulse text-amber-400" />
                            <span>{isArabic ? "جاري التحدث..." : "Speaking..."}</span>
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
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{isArabic ? "سلمى تفكر وتصيغ الإجابة الصوتية..." : "Sarah is formulating spoken answer..."}</span>
              </div>
            )}
          </div>

          {/* CHAT INPUT FORM (SPEECH MIC & TEXT INPUT) */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500 transition">
              <button
                type="button"
                onClick={toggleMicListening}
                className={`p-2 rounded-lg transition ${
                  isListeningMic
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title={isListeningMic ? "Stop Listening" : "Speak via Microphone"}
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendToHost();
                }}
                placeholder={
                  isListeningMic
                    ? (isArabic ? "جاري الاستماع لصوتك..." : "Listening to your voice...")
                    : (isArabic ? "اكتب سؤالك أو تحدث عبر المايك..." : "Ask a question or speak via mic...")
                }
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none px-2"
              />

              <button
                type="button"
                onClick={() => handleSendToHost()}
                disabled={!userInput.trim() || isTalkingToHost}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-lg font-bold transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>{isArabic ? "يمكنك التحدث بالصوت مباشرة أو الكتابة للحصول على إجابة صوتية بشرية" : "You can speak or type to receive realistic human audio replies"}</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
