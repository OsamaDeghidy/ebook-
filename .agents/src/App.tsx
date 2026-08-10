import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  ArrowLeft,
  BookMarked,
  Brain,
  HelpCircle,
  Youtube,
  Edit,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  ChevronRight,
  User,
  Music,
  Check,
  AlertCircle,
  Volume2,
  VolumeX,
  Gamepad2,
  Radio
} from 'lucide-react';
import { Ebook, Chapter, QuizQuestion, VideoLink, MindMapNode } from './types';
import ContentUploader from './components/ContentUploader';
import BookCover from './components/BookCover';
import MindMap from './components/MindMap';
import QuizSection from './components/QuizSection';
import VideoSection from './components/VideoSection';
import ChapterEditor from './components/ChapterEditor';
import PodcastLounge from './components/PodcastLounge';

export default function App() {
  // Global Ebook Lists
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Loaders
  const [isConverting, setIsConverting] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tabs: 'read' | 'podcast' | 'quiz' | 'mindmap' | 'videos' | 'editor'
  const [activeTab, setActiveTab] = useState<'read' | 'podcast' | 'quiz' | 'mindmap' | 'videos' | 'editor'>('read');

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [loadingParagraph, setLoadingParagraph] = useState<string | null>(null);

  // Voice Synthesis custom parameters
  const [ttsRate, setTtsRate] = useState<number>(1.0); // 1.0 is standard natural human speech speed
  const [ttsPitch, setTtsPitch] = useState<number>(1.0); // 1.0 is standard natural human pitch
  const [ttsPreset, setTtsPreset] = useState<string>('natural');

  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText) return "";
    let text = rawText;

    // 1. Strip code blocks and inline code
    text = text.replace(/```[\s\S]*?```/g, " ");
    text = text.replace(/`[^`]*`/g, " ");

    // 2. Strip images and markdown links keeping link text
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, " ");
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

    // 3. Strip Markdown headings #, ##, ###, ####
    text = text.replace(/#{1,6}\s+/g, " ");

    // 4. Strip list numbers like "1.", "2.", "1-", "(1)", "١.", "٢." so TTS doesn't say "واحد نقطة" or "one dot"
    text = text.replace(/(^|\n|\s)[\d\u0660-\u0669]+[\.\-\)\:]\s*/g, "$1 ");

    // 5. Strip list bullets like "* ", "- ", "+ ", "• ", "> "
    text = text.replace(/(^|\n|\s)[\-\*\•\+\>]\s+/g, "$1 ");

    // 6. If mainly Arabic, strip English terms inside brackets e.g. "(Deductive Method)" or "(Howard Gardner)"
    const isMainlyArabic = /[\u0600-\u06FF]/.test(text);
    if (isMainlyArabic) {
      text = text.replace(/\([A-Za-z0-9\s,\.\-\&\/]+\)/g, " ");
    }

    // 7. Strip all brackets, quotes, and punctuation symbols that TTS engines read out loud
    text = text.replace(/[\(\)\[\]\{\}⟨⟩«»"'`“”‘’]/g, " ");
    text = text.replace(/[\/\\#*`>_\-~+=|:;•–—]/g, " ");

    // 8. Remove multiple dots / ellipses so it doesn't say "نقطة" or "dot"
    text = text.replace(/\.{2,}/g, " ");
    text = text.replace(/(?<=\s)\.(?=\s|$)/g, " ");

    // 9. Normalize white space
    text = text.replace(/\s+/g, " ").trim();

    return text;
  };

  const selectBestVoice = (isArabic: boolean): SpeechSynthesisVoice | null => {
    if (!synthRef.current && typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    if (isArabic) {
      const preferred = ['Google العَرَبِيَّة', 'Google Arabic', 'Maged', 'Tarik', 'Laila', 'Salma', 'Naayf', 'Zariyah', 'Shakir', 'Hoda', 'Arabic', 'ar'];
      for (const p of preferred) {
        const found = voices.find(v => v.lang.toLowerCase().startsWith('ar') && v.name.includes(p));
        if (found) return found;
      }
      const anyAr = voices.find(v => v.lang.toLowerCase().startsWith('ar'));
      if (anyAr) return anyAr;
    } else {
      const preferred = ['Google US English', 'Google UK English', 'Samantha', 'Daniel', 'Karen', 'Natural', 'en'];
      for (const p of preferred) {
        const found = voices.find(v => v.lang.toLowerCase().startsWith('en') && v.name.includes(p));
        if (found) return found;
      }
      const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;
    }

    return voices[0] || null;
  };

  const handleApplyPreset = (preset: string) => {
    setTtsPreset(preset);
    if (preset === 'natural') {
      setTtsRate(1.0);
      setTtsPitch(1.0);
    } else if (preset === 'fluent') {
      setTtsRate(1.1);
      setTtsPitch(1.0);
    } else if (preset === 'teacher') {
      setTtsRate(0.9);
      setTtsPitch(1.0);
    } else if (preset === 'storyteller') {
      setTtsRate(0.95);
      setTtsPitch(1.05);
    } else {
      setTtsRate(1.0);
      setTtsPitch(1.0);
    }
  };

  // New States for Paragraph Audio, Visual Concept Companion, and AI Quiz Generator
  const [speakingParagraph, setSpeakingParagraph] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isGeneratingQuizQuestions, setIsGeneratingQuizQuestions] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');

  // Load initial ebooks catalog and server configuration
  useEffect(() => {
    fetchEbooks();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setHasGeminiKey(!!data.hasApiKey);
      }
    } catch (err) {
      console.error("Failed to fetch server config:", err);
    }
  };

  const fetchEbooks = async () => {
    setIsLoadingCatalog(true);
    setActionError(null);
    try {
      const res = await fetch('/api/ebooks');
      if (!res.ok) throw new Error("Could not retrieve ebook catalog.");
      const data = await res.json();
      setEbooks(data);
    } catch (err: any) {
      console.error(err);
      setActionError("Failed to fetch catalogs. Running in local memory state.");
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const selectedBook = ebooks.find(b => b.id === selectedBookId) || null;
  const activeChapter = selectedBook?.chapters.find(c => c.id === activeChapterId) || null;

  // Sync tab and states when chapter changes
  useEffect(() => {
    // Reset audio and speech synthesis when moving chapters
    stopAllAudioAndSpeech();
    if (activeChapter) {
      // Re-initialize custom audio object if audioBase64 exists
      if (activeChapter.audioBase64) {
        setupAudioElement(activeChapter.audioBase64);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlaying(false);
        setAudioProgress(0);
        setAudioDuration(0);
      }
    }
  }, [activeChapterId]);

  // Handle conversion of PDF, Images, or raw prompt to interactive ebook
  const handleConvert = async (payload: {
    promptText: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
  }) => {
    setIsConverting(true);
    setActionError(null);
    setProgressPercent(5);
    setProgressStep('Dispatching study materials to AI queue...');
    try {
      const res = await fetch('/api/ebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let errMsg = "Failed to initialize conversion task.";
        try {
          const errorData = await res.json();
          errMsg = errorData.error || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }
      
      const { jobId } = await res.json();
      if (!jobId) {
        throw new Error("No job tracker returned from the server.");
      }

      // Poll the job progress every 1500ms
      let completedBook = null;
      while (true) {
        await new Promise(r => setTimeout(r, 1500));
        const statusRes = await fetch(`/api/ebooks/tasks/${jobId}`);
        if (!statusRes.ok) {
          throw new Error("Lost connection to active conversion task.");
        }
        const job = await statusRes.json();
        
        setProgressPercent(job.progressPercent || 0);
        setProgressStep(job.progressStep || 'Processing...');

        if (job.status === 'completed') {
          completedBook = job.result;
          break;
        } else if (job.status === 'failed') {
          throw new Error(job.error || "AI background conversion failed.");
        }
      }

      if (!completedBook) {
        throw new Error("Ebook generated is missing content schema.");
      }

      setEbooks(prev => [completedBook, ...prev]);
      
      // Auto-open newly generated ebook
      setSelectedBookId(completedBook.id);
      if (completedBook.chapters && completedBook.chapters.length > 0) {
        setActiveChapterId(completedBook.chapters[0].id);
      }
      setActiveTab('read');
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Ebook conversion failed. Please double check prompt details.");
    } finally {
      setIsConverting(false);
      setProgressPercent(0);
      setProgressStep('');
    }
  };

  // Delete Ebook
  const handleDeleteBook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ebooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Could not delete book");
      setEbooks(prev => prev.filter(b => b.id !== id));
      if (selectedBookId === id) {
        setSelectedBookId(null);
        setActiveChapterId(null);
      }
    } catch (err) {
      console.error(err);
      // Fallback local memory delete
      setEbooks(prev => prev.filter(b => b.id !== id));
    }
  };

  // Update complete ebook structure to Express backend
  const updateEbookOnServer = async (updatedBook: Ebook) => {
    try {
      const res = await fetch(`/api/ebooks/${updatedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      });
      if (!res.ok) throw new Error("Failed to synchronize ebook updates.");
      const synced = await res.json();
      setEbooks(prev => prev.map(b => b.id === synced.id ? synced : b));
    } catch (err) {
      console.error("Sync failed, updating local state only:", err);
      setEbooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    }
  };

  // Save current chapter modifications
  const handleSaveChapter = (updatedChapter: Chapter) => {
    if (!selectedBook) return;
    const updatedChapters = selectedBook.chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c);
    const updatedBook = { ...selectedBook, chapters: updatedChapters };
    updateEbookOnServer(updatedBook);
  };

  // Add Chapter to Ebook
  const handleAddChapter = () => {
    if (!selectedBook) return;
    const newChapterId = `ch-${selectedBook.id}-${Date.now()}`;
    const newChapter: Chapter = {
      id: newChapterId,
      title: "New Interactive Section",
      content: "### Introduction\n\nEdit this space inside the workspace to add customized learning materials for your students.",
      imagePrompt: "Educational graphic, modern vector illustration",
      quiz: [],
      videos: [],
      mindMap: []
    };
    const updatedBook = { ...selectedBook, chapters: [...selectedBook.chapters, newChapter] };
    updateEbookOnServer(updatedBook);
    setActiveChapterId(newChapterId);
  };

  // Delete Chapter
  const handleDeleteChapter = () => {
    if (!selectedBook || !activeChapterId) return;
    const updatedChapters = selectedBook.chapters.filter(c => c.id !== activeChapterId);
    if (updatedChapters.length === 0) return; // Prevent deleting last remaining chapter

    const updatedBook = { ...selectedBook, chapters: updatedChapters };
    updateEbookOnServer(updatedBook);
    setActiveChapterId(updatedChapters[0].id);
  };

  // Update specific chapter sections (Quiz, Videos, Mind Map)
  const handleUpdateQuiz = (quiz: QuizQuestion[]) => {
    if (!activeChapter) return;
    handleSaveChapter({ ...activeChapter, quiz });
  };

  const handleUpdateVideos = (videos: VideoLink[]) => {
    if (!activeChapter) return;
    handleSaveChapter({ ...activeChapter, videos });
  };

  const handleUpdateMindMap = (mindMap: MindMapNode[]) => {
    if (!activeChapter) return;
    handleSaveChapter({ ...activeChapter, mindMap });
  };

  // --- NARRATOR / SOUNDTRACK GENERATION & PLAYBACK ---
  
  const setupAudioElement = (base64Audio: string, mimeType: string = 'audio/mp3') => {
    if (!base64Audio) return;
    try {
      const trimmed = base64Audio.trim();
      if (!trimmed) return;

      const binaryString = window.atob(trimmed);
      const len = binaryString.length;
      if (len === 0) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType || 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio();
      
      audio.addEventListener('error', (e) => {
        console.warn("Audio playback failed or format not supported by the current browser environment:", audio.error?.message || e);
        setIsPlaying(false);
        setAudioProgress(0);
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      
      audio.src = url;
      audioRef.current = audio;
    } catch (e) {
      console.warn("Failed to decode base64 audio or initialize Audio element:", e);
    }
  };

  const generateChapterSoundtrack = async () => {
    if (!selectedBook || !activeChapter) return;
    setIsGeneratingAudio(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/ebooks/${selectedBook.id}/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapter.id,
          text: activeChapter.content
        })
      });
      
      if (!res.ok) {
        let errMsg = "Failed to generate TTS narration.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errMsg = errorData.error || errMsg;
          } else {
            const text = await res.text();
            errMsg = text.substring(0, 200) || errMsg;
          }
        } catch (e) {
          console.error("Error parsing narrate response:", e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.audioBase64) {
        // Update local memory and sync
        const updatedChapters = selectedBook.chapters.map(c => 
          c.id === activeChapter.id ? { ...c, audioBase64: data.audioBase64, audioMimeType: data.mimeType } : c
        );
        const updatedBook = { ...selectedBook, chapters: updatedChapters };
        setEbooks(prev => prev.map(b => b.id === selectedBook.id ? updatedBook : b));
        
        setupAudioElement(data.audioBase64, data.mimeType || 'audio/mp3');
        setIsPlaying(false);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Narrator generation unavailable. Falling back to native browser reader.");
      handleBrowserSpeak();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        stopAllAudioAndSpeech();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.warn("Audio playback playPromise was blocked or rejected:", error);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(true);
        }
      }
    } else {
      // If no pre-loaded audio, offer to generate or use native browser reader fallback
      if (activeChapter?.content) {
        if (hasGeminiKey) {
          generateChapterSoundtrack();
        } else {
          handleBrowserSpeak();
        }
      }
    }
  };

  // Browser Speak (Native Instant TTS)
  const handleBrowserSpeak = () => {
    if (!activeChapter) return;

    if (!synthRef.current && typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }

    if (!synthRef.current) return;

    if (isBrowserSpeaking) {
      synthRef.current.cancel();
      setIsBrowserSpeaking(false);
      setSpeakingParagraph(null);
      return;
    }

    stopAllAudioAndSpeech();

    const cleanText = cleanTextForSpeech(activeChapter.content);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;
    
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const selectedVoice = selectBestVoice(isArabic);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      setIsBrowserSpeaking(false);
      setSpeakingParagraph(null);
    };

    utterance.onerror = () => {
      setIsBrowserSpeaking(false);
      setSpeakingParagraph(null);
    };

    utteranceRef.current = utterance;
    setIsBrowserSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const stopAllAudioAndSpeech = () => {
    // Stop server-generated audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);

    // Stop browser TTS
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsBrowserSpeaking(false);
    setSpeakingParagraph(null);
    setLoadingParagraph(null);
  };

  // Speaks a specific paragraph or block of text with instant native browser speech synthesis
  const handleParagraphSpeak = (blockText: string) => {
    if (speakingParagraph === blockText) {
      stopAllAudioAndSpeech();
      return;
    }

    stopAllAudioAndSpeech();

    const cleanText = cleanTextForSpeech(blockText);
    if (!cleanText) return;

    if (!synthRef.current && typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }

    if (!synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;

    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const selectedVoice = selectBestVoice(isArabic);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      setSpeakingParagraph(null);
      setIsBrowserSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeakingParagraph(null);
      setIsBrowserSpeaking(false);
    };

    utteranceRef.current = utterance;
    setSpeakingParagraph(blockText);
    setIsBrowserSpeaking(true);
    synthRef.current.speak(utterance);
  };

  // Triggers the API request to generate 3 new AI questions for the current chapter
  const handleGenerateQuizQuestions = async () => {
    if (!selectedBookId || !activeChapterId || !activeChapter) return;
    setIsGeneratingQuizQuestions(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/ebooks/${selectedBookId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapterId,
          chapterContent: activeChapter.content
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate questions. Server error.");
      }

      const data = await res.json();
      if (data.success && data.questions) {
        // Append newly generated questions to the existing chapter quiz list
        const updatedQuiz = [...(activeChapter.quiz || []), ...data.questions];
        handleUpdateQuiz(updatedQuiz);
      } else {
        throw new Error(data.error || "No questions payload returned.");
      }
    } catch (err: any) {
      console.error(err);
      setActionError(`AI Question Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingQuizQuestions(false);
    }
  };

  // --- VISUAL BANNER GENERATION ---
  
  const generateChapterVisual = async () => {
    if (!selectedBook || !activeChapter) return;
    setIsGeneratingVisual(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/ebooks/${selectedBook.id}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapter.id,
          prompt: activeChapter.imagePrompt || `Educational graphic for ${activeChapter.title}`
        })
      });

      if (!res.ok) {
        let errMsg = "Failed to generate chapter visual.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errMsg = errorData.error || errMsg;
          } else {
            const text = await res.text();
            errMsg = text.substring(0, 200) || errMsg;
          }
        } catch (e) {
          console.error("Error parsing generate-image response:", e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.imageUrl) {
        // Update local memory and sync
        const updatedChapters = selectedBook.chapters.map(c => 
          c.id === activeChapter.id ? { ...c, imageUrl: data.imageUrl } : c
        );
        const updatedBook = { ...selectedBook, chapters: updatedChapters };
        setEbooks(prev => prev.map(b => b.id === selectedBook.id ? updatedBook : b));
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to generate visual banner. Using stylized fallbacks.");
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedBookId(null)}>
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-gray-900">Interactive Ebook Studio</h1>
            <p className="text-[10px] text-gray-400 font-medium">Create multi-sensory textbooks using AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Status Loader or Profile */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>Learning Dashboard</span>
          </div>
        </div>
      </header>

      {/* ERROR BANNER */}
      {actionError && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-2 animate-fadeIn z-50">
          <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
        
        {!selectedBook ? (
          /* ================= CATALOGUE HOME PAGE ================= */
          <div className="space-y-10 animate-fadeIn">
            
            {/* HERO INTRODUCTION BANNER */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between border shadow-sm">
              <div className="space-y-3 max-w-xl text-center md:text-left z-10">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 px-2.5 py-1 bg-indigo-950/50 border border-indigo-900 rounded-full">
                  Educational Engine v2.5
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
                  Turn Static Material Into Immersive Classrooms
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provide text prompts, blog entries, leaf snap pictures, or PDF files. Ebook Studio designs interactive lessons automatically populated with concept mind maps, sound streams, test quizzes, and YouTube visual modules.
                </p>
              </div>
              <div className="bg-indigo-600/10 p-4 border border-indigo-500/20 rounded-2xl z-10 hidden lg:block shrink-0">
                <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <Music className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <span>TTS Sounds</span>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <Brain className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                    <span>Mind Maps</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CONVERTER MODULE */}
            <ContentUploader
              onConvert={handleConvert}
              isConverting={isConverting}
              progressPercent={progressPercent}
              progressStep={progressStep}
            />

            {/* BOOK spine collection catalog */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Your Educational Bookshelf</h3>
                  <p className="text-xs text-gray-400">Read and edit your existing interactive library books.</p>
                </div>
                {isLoadingCatalog && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
              </div>

              {isLoadingCatalog && ebooks.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-150 h-56 rounded-2xl animate-pulse flex flex-col justify-between p-5">
                      <div className="h-6 bg-slate-100 rounded-lg w-2/3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-5/6" />
                      </div>
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : ebooks.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-2xl bg-white space-y-2">
                  <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-semibold text-slate-700">No Books on Your Bookshelf</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Upload a PDF textbook above or describe a subject to begin generating your first ebook!</p>
                </div>
              ) : (
                <BookCover ebooks={ebooks} onSelectBook={(id) => {
                  setSelectedBookId(id);
                  const book = ebooks.find(b => b.id === id);
                  if (book?.chapters && book.chapters.length > 0) {
                    setActiveChapterId(book.chapters[0].id);
                  }
                  setActiveTab('read');
                }} onDeleteBook={handleDeleteBook} />
              )}
            </div>

          </div>
        ) : (
          /* ================= ACTIVE INTERACTIVE BOOK VIEW ================= */
          <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fadeIn">
            
            {/* LEFT CHAPTER LIST NAVIGATION SIDEBAR */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <button
                onClick={() => {
                  stopAllAudioAndSpeech();
                  setSelectedBookId(null);
                  setActiveChapterId(null);
                }}
                className="w-full py-2 px-3 border border-gray-200 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm bg-gray-50/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Bookshelf
              </button>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                <div>
                  <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider font-mono">Chapters</h4>
                  <p className="text-[10px] text-gray-500 font-semibold truncate leading-tight mt-0.5">{selectedBook.title}</p>
                </div>

                <nav className="space-y-1 max-h-96 overflow-y-auto">
                  {selectedBook.chapters.map((ch, idx) => {
                    const isActive = activeChapterId === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChapterId(ch.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-2">{idx + 1}. {ch.title}</span>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* MAIN CORE READING LAYOUT AREA */}
            <section className="flex-1 min-w-0 space-y-6">
              
              {/* INTERACTIVE HERO BANNER */}
              <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-sm relative aspect-[21/9] sm:aspect-[24/7] flex flex-col justify-end p-6 group">
                {activeChapter?.imageUrl ? (
                  <img
                    src={activeChapter.imageUrl}
                    referrerPolicy="no-referrer"
                    alt={activeChapter.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-[1.01] transition-transform duration-700"
                  />
                ) : (
                  /* Stylized default graphic */
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/80 opacity-90" />
                )}

                {/* Floating Generate Visual Action */}
                <div className="absolute top-4 right-4 z-20">
                  {hasGeminiKey && (
                    <button
                      onClick={generateChapterVisual}
                      disabled={isGeneratingVisual}
                      className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-950 backdrop-blur-sm border border-slate-700 text-white font-semibold text-[10px] rounded flex items-center gap-1 transition"
                    >
                      {isGeneratingVisual ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                      )}
                      {activeChapter?.imageUrl ? "Regenerate Image" : "Generate Chapter Illustration"}
                    </button>
                  )}
                </div>

                {/* Ebook Text overlay */}
                <div className="relative z-10 space-y-2 max-w-2xl">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 px-2.5 py-0.5 bg-indigo-950/70 border border-indigo-900 rounded-full inline-block">
                    {selectedBook.title}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {activeChapter?.title}
                  </h2>
                </div>
              </div>

              {/* AUDIO NARRATOR / SOUNDTRACK BAR */}
              {activeChapter && (
                <div className="bg-slate-900 border border-slate-800 text-white rounded-xl px-5 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                      <Music className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold leading-normal">Narration Soundtrack</h5>
                      <p className="text-[10px] text-slate-400">
                        {activeChapter.audioBase64 
                          ? "Chapter Narrated by Gemini AI" 
                          : isBrowserSpeaking 
                          ? "Offline Browser Voice Reading..." 
                          : "Narrate this chapter to listen while studying."}
                      </p>
                    </div>
                  </div>

                  {/* CHILD-FRIENDLY VOICE CONTROLS (Middle Section) */}
                    <div className="flex flex-wrap items-center gap-4 bg-slate-950/40 p-2 rounded-xl border border-slate-800 text-[10px] w-full lg:w-auto justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">Voice Style:</span>
                      <select
                        value={ttsPreset}
                        onChange={(e) => handleApplyPreset(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-bold"
                      >
                        <option value="natural">🗣️ Natural Arabic/English (1.0x)</option>
                        <option value="fluent">⚡ Fluent Reader (1.1x)</option>
                        <option value="teacher">🎒 Calm Educator (0.9x)</option>
                        <option value="storyteller">🎙️ Document Narrator (0.95x)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">Speed:</span>
                      <input
                        type="range"
                        min="0.6"
                        max="1.4"
                        step="0.05"
                        value={ttsRate}
                        onChange={(e) => {
                          setTtsRate(parseFloat(e.target.value));
                          setTtsPreset('custom');
                        }}
                        className="w-16 sm:w-20 accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-full appearance-none"
                      />
                      <span className="text-slate-300 font-mono w-6 text-right">{ttsRate.toFixed(2)}x</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">Pitch:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={ttsPitch}
                        onChange={(e) => {
                          setTtsPitch(parseFloat(e.target.value));
                          setTtsPreset('custom');
                        }}
                        className="w-16 sm:w-20 accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-full appearance-none"
                      />
                      <span className="text-slate-300 font-mono w-6 text-right">{ttsPitch.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Playback Controls / Sizing */}
                  <div className="flex items-center gap-3.5 w-full lg:w-auto justify-end">
                    
                    {/* Fast Instant Browser Speak Button */}
                    <button
                      onClick={handleBrowserSpeak}
                      className={`px-3.5 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                        isBrowserSpeaking
                          ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white'
                      }`}
                      title="Instant browser speech synthesis reader"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {isBrowserSpeaking ? "Stop Speech" : "🔊 Instant Read Aloud"}
                    </button>

                    {/* Pre-recorded Audio Player if available */}
                    {activeChapter.audioBase64 && (
                      <div className="flex items-center gap-3.5">
                        <div className="w-24 sm:w-36 h-1 bg-slate-700 rounded-full overflow-hidden relative">
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${audioProgress}%` }} />
                        </div>

                        <button
                          onClick={handlePlayPause}
                          className="p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full shadow-sm transition active:scale-95 shrink-0"
                          title="Play pre-recorded narration"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* NAVIGATION TABS */}
              <div className="border-b border-gray-200 flex overflow-x-auto gap-4 no-scrollbar">
                {[
                  { id: 'read', label: '📖 Read', icon: BookOpen },
                  { id: 'podcast', label: '🎙️ AI Podcast Studio', icon: Radio },
                  { id: 'mindmap', label: '🧠 Concept Map', icon: Brain },
                  { id: 'quiz', label: '❓ Interactive Test', icon: HelpCircle },
                  { id: 'videos', label: '🎥 Curated Videos', icon: Youtube },
                  { id: 'editor', label: '🛠️ Workspace Editor', icon: Edit },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap px-1 ${
                        isActive
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB SUB-VIEW RENDERERS */}
              {activeChapter && (
                <div className="min-h-[400px]">
                  
                  {/* 1. READ CONTENT VIEW */}
                  {activeTab === 'read' && (() => {
                    const selectedConcept = activeChapter.mindMap?.find(n => n.id === selectedConceptId) || null;
                    return (
                      <div className="space-y-6">
                        {/* CHAPTER CONCEPTUAL BLUEPRINT BOARD */}
                        {activeChapter.mindMap && activeChapter.mindMap.length > 0 && (
                          <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-indigo-50/20 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <Brain className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">💡 Interactive Visual Concept Companion</h4>
                                <p className="text-[10px] text-slate-500">Click on any core element to activate your conceptual learning assistant</p>
                              </div>
                            </div>

                            {/* Concept Nodes Grid/Timeline */}
                            <div className="flex flex-wrap gap-2">
                              {activeChapter.mindMap.map((node) => {
                                const isSelected = selectedConceptId === node.id;
                                return (
                                  <button
                                    key={node.id}
                                    onClick={() => setSelectedConceptId(isSelected ? null : node.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm scale-[1.01]'
                                        : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-indigo-50/10'
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-ping' : 'bg-indigo-500'}`} />
                                    {node.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected Concept Deep Explanation card */}
                            {selectedConcept && (
                              <div className="mt-4 bg-white border border-slate-200/60 rounded-xl p-4 shadow-xs space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                                    Core Concept Assistant Definition
                                  </span>
                                  <button
                                    onClick={() => handleParagraphSpeak(`${selectedConcept.label}: ${selectedConcept.description}`)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" /> Hear Explanation
                                  </button>
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800 text-sm mb-1">{selectedConcept.label}</h5>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {selectedConcept.description || "This element is a crucial building block of the chapter's conceptual framework."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Text paragraphs */}
                        <article className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 prose prose-slate max-w-none shadow-sm leading-relaxed text-gray-800">
                          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                              Click any paragraph to speak it instantly with fast browser voice
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-full flex items-center gap-1">
                                ⚡ Fast Instant Reader
                              </span>
                              {speakingParagraph && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-full animate-pulse">
                                  Reading Active
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            {activeChapter.content.split(/\n\s*\n/).filter(p => p.trim()).map((block, idx) => {
                              const isCurrentlySpeaking = speakingParagraph === block;
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => handleParagraphSpeak(block)}
                                  className={`group relative px-4 py-3 rounded-xl transition-all duration-300 border cursor-pointer select-text ${
                                    isCurrentlySpeaking
                                      ? 'bg-emerald-50/70 border-emerald-300/80 shadow-sm'
                                      : 'hover:bg-slate-50/80 hover:border-slate-200 border-transparent'
                                  }`}
                                >
                                  <div className="markdown-body prose-sm">
                                    <ReactMarkdown>{block}</ReactMarkdown>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleParagraphSpeak(block);
                                    }}
                                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all border ${
                                      isCurrentlySpeaking
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 opacity-100'
                                        : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isCurrentlySpeaking ? "Stop Reading" : "Click to speak this paragraph instantly"}
                                  >
                                    {isCurrentlySpeaking ? (
                                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                                    ) : (
                                      <Volume2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      </div>
                    );
                  })()}

                  {/* 2. MIND MAP TAB */}
                  {activeTab === 'mindmap' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Section Mind Map</h3>
                        <p className="text-xs text-gray-400">Click on nodes to study relations or add new connecting concepts to map the textbook flow.</p>
                      </div>
                      <MindMap
                        nodes={activeChapter.mindMap || []}
                        onUpdateNodes={handleUpdateMindMap}
                        ebookId={selectedBook.id}
                        chapterId={activeChapter.id}
                        chapterContent={activeChapter.content}
                      />
                    </div>
                  )}

                  {/* 2. PODCAST LOUNGE TAB */}
                  {activeTab === 'podcast' && (
                    <PodcastLounge
                      bookId={selectedBook.id}
                      chapterId={activeChapter.id}
                      chapterTitle={activeChapter.title}
                      chapterContent={activeChapter.content}
                      hasGeminiKey={hasGeminiKey}
                    />
                  )}

                  {/* 3. INTERACTIVE QUIZ TEST TAB */}
                  {activeTab === 'quiz' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Knowledge Checkpoint</h3>
                        <p className="text-xs text-gray-400">Answer multiple-choice conceptual questions and review explanations to check understanding.</p>
                      </div>
                      <QuizSection
                        questions={activeChapter.quiz || []}
                        onUpdateQuestions={handleUpdateQuiz}
                        onGenerateAiQuestions={handleGenerateQuizQuestions}
                        isGeneratingAiQuestions={isGeneratingQuizQuestions}
                      />
                    </div>
                  )}

                  {/* 4. CURATED EXPLANATORY VIDEOS TAB */}
                  {activeTab === 'videos' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Explanatory Video Tutorials</h3>
                        <p className="text-xs text-gray-400">View curated lectures and video results to solidify core chapter elements.</p>
                      </div>
                      <VideoSection
                        videos={activeChapter.videos || []}
                        onUpdateVideos={handleUpdateVideos}
                      />
                    </div>
                  )}

                  {/* 5. WORKSPACE TEXT EDITOR TAB */}
                  {activeTab === 'editor' && (
                    <ChapterEditor
                      chapter={activeChapter}
                      onSaveChapter={handleSaveChapter}
                      onAddChapter={handleAddChapter}
                      onDeleteChapter={handleDeleteChapter}
                      canDelete={selectedBook.chapters.length > 1}
                    />
                  )}

                </div>
              )}

            </section>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6 px-6 mt-12 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 Interactive Ebook Studio. All rights reserved. Created in Cloud Native Workspace.</p>
        <p className="font-mono text-[10px]">Version 1.0.0 (Express + React + Gemini AI)</p>
      </footer>

    </div>
  );
}
