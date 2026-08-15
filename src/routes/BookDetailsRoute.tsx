import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Sparkles, RefreshCw, Layers, Terminal, Volume2, Eye, EyeOff, Check, Flame, Lock, ShoppingCart, CheckCircle2, ExternalLink } from 'lucide-react';
import { MarketplaceBook, MindMapNode, Flashcard, Chapter, UserRole } from '../types';
import MindMap from '../components/MindMap';
import QuizSection from '../components/QuizSection';
import VideoSection from '../components/VideoSection';
import PodcastLounge from '../components/PodcastLounge';
import { ReadSection } from '../components/ReadSection';
import ChapterEditor from '../components/ChapterEditor';
import FlashcardsSection from '../components/FlashcardsSection';
import DynamicDomainSandbox from '../components/DynamicDomainSandbox';
import FloatingAudioBar from '../components/FloatingAudioBar';
import { RelatedBooksSection } from '../components/RelatedBooksSection';
import { PurchaseModal } from '../components/PurchaseModal';
import { supabase } from '../lib/supabase';

interface BookDetailsRouteProps {
  books: MarketplaceBook[];
  setEbooks: React.Dispatch<React.SetStateAction<MarketplaceBook[]>>;
  hasGeminiKey: boolean;
  purchasedBookIds?: string[];
  onPurchaseBook?: (book: MarketplaceBook) => Promise<void>;
  userRole?: UserRole;
  isAdminMode?: boolean;
}

export default function BookDetailsRoute({
  books,
  setEbooks,
  hasGeminiKey,
  purchasedBookIds = [],
  onPurchaseBook,
  userRole = 'student',
  isAdminMode = false
}: BookDetailsRouteProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as any) || 'read';

  const book = books.find(b => b.id === id);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'read' | 'podcast' | 'flashcards' | 'sandbox' | 'quiz' | 'mindmap' | 'videos' | 'editor'>(initialTab);
  const [isGeneratingAiQuestions, setIsGeneratingAiQuestions] = useState(false);
  const [isExpandingChapters, setIsExpandingChapters] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Batch pre-generation states
  const [isPregenerating, setIsPregenerating] = useState(false);
  const [pregenPercent, setPregenPercent] = useState(0);
  const [pregenStep, setPregenStep] = useState('');

  useEffect(() => {
    if (book && book.chapters && book.chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(book.chapters[0].id);
    }
  }, [book, activeChapterId]);

  // Check pregeneration status on load
  useEffect(() => {
    if (!book) return;
    const checkPregen = async () => {
      try {
        const res = await fetch(`/api/ebooks/${book.id}/pregenerate-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'processing') {
            setIsPregenerating(true);
            setPregenPercent(data.progressPercent || 10);
            setPregenStep(data.currentStep || 'جاري تجهيز الأصوات...');
            setTimeout(checkPregen, 4000);
          } else if (data.status === 'ready') {
            setIsPregenerating(false);
            setPregenPercent(100);
          }
        }
      } catch (e) {}
    };
    checkPregen();
  }, [book?.id]);

  if (!book) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="font-bold text-sm">جاري تحميل بيانات الكتاب الرقمي...</p>
      </div>
    );
  }

  const activeChapter = book.chapters?.find(c => c.id === activeChapterId) || book.chapters?.[0];

  const handleTogglePublish = async () => {
    if (!book) return;
    const newStatus = !book.is_published;
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, is_published: newStatus } : b));
    try {
      await fetch(`/api/ebooks/${book.id}/toggle-publish`, { method: 'POST' });
      await supabase.from('books').update({ is_published: newStatus }).eq('id', book.id);
    } catch (e) {
      console.warn("Toggle publish error:", e);
    }
  };

  const handlePregenerateAllAssets = async () => {
    if (!book || isPregenerating) return;
    setIsPregenerating(true);
    setPregenPercent(10);
    setPregenStep('بدء تجهيز كافة الأصوات والبودكاست...');

    try {
      const res = await fetch(`/api/ebooks/${book.id}/pregenerate-all-assets`, { method: 'POST' });
      if (res.ok) {
        const pollPregen = async () => {
          try {
            const statusRes = await fetch(`/api/ebooks/${book.id}/pregenerate-status`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setPregenPercent(statusData.progressPercent || 20);
              setPregenStep(statusData.currentStep || 'جاري المعالجة...');
              if (statusData.status === 'processing') {
                setTimeout(pollPregen, 3500);
              } else if (statusData.status === 'ready') {
                setIsPregenerating(false);
                setPregenPercent(100);
                setPregenStep('اكتمل تجهيز كافة الأصوات والبودكاست بنجاح!');
              } else {
                setIsPregenerating(false);
              }
            }
          } catch (e) {
            setIsPregenerating(false);
          }
        };
        setTimeout(pollPregen, 3000);
      }
    } catch (e) {
      console.warn(e);
      setIsPregenerating(false);
    }
  };

  const handleGenerateAiQuestions = async () => {
    if (!book || !activeChapter) return;
    setIsGeneratingAiQuestions(true);
    try {
      const res = await fetch(`/api/ebooks/${book.id}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: activeChapter.id, chapterContent: activeChapter.content })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions) {
          const updatedChapters = book.chapters.map(ch => {
            if (ch.id === activeChapter.id) {
              return { ...ch, quiz: [...(ch.quiz || []), ...data.questions] };
            }
            return ch;
          });

          setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
          try {
            await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiQuestions(false);
    }
  };

  const handleExpandChapters = async () => {
    if (!book) return;
    setIsExpandingChapters(true);
    try {
      const res = await fetch(`/api/ebooks/${book.id}/expand-chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalCount: 5 })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل استكمال وتوليد الفصول.');
      }
      const data = await res.json();
      if (data.newChapters && data.newChapters.length > 0) {
        const updatedChapters = [...(book.chapters || []), ...data.newChapters];
        setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
        try {
          await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
        } catch (e) {}
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء استكمال الفصول: ' + err.message);
    } finally {
      setIsExpandingChapters(false);
    }
  };

  const handleUpdateChapterMindMap = async (updatedNodes: MindMapNode[]) => {
    if (!book || !activeChapter) return;
    const updatedChapters = book.chapters.map(ch =>
      ch.id === activeChapter.id ? { ...ch, mindMap: updatedNodes } : ch
    );
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
    
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase mindmap update error:", e);
    }
  };

  const handleSaveChapter = async (updatedChapter: Chapter) => {
    if (!book) return;
    const updatedChapters = book.chapters.map(ch =>
      ch.id === updatedChapter.id ? updatedChapter : ch
    );
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase chapter save error:", e);
    }
  };

  const handleUpdateFlashcards = async (updatedFlashcards: Flashcard[]) => {
    if (!book || !activeChapter) return;
    const updatedChapters = book.chapters.map(ch =>
      ch.id === activeChapter.id ? { ...ch, flashcards: updatedFlashcards } : ch
    );
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase flashcards update error:", e);
    }
  };

  const isPurchased = purchasedBookIds.includes(book.id);
  const isFree = !book.price || book.price === 0;
  const isBookUnlocked = isFree || isPurchased || isAdminMode;

  if (book.is_external) {
    const embedUrl = book.preview_video_url ? (
      book.preview_video_url.includes('youtube.com/watch?v=')
        ? book.preview_video_url.replace('watch?v=', 'embed/')
        : book.preview_video_url.includes('youtu.be/')
        ? book.preview_video_url.replace('youtu.be/', 'www.youtube.com/embed/')
        : book.preview_video_url
    ) : null;

    return (
      <div className="space-y-10 animate-fade-in pb-24 text-right max-w-5xl mx-auto" dir="rtl">
        {/* TOP NAV BAR */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>العودة للمتجر والمكتبة الرقمية</span>
          </button>
          <span className="px-3 py-1 text-xs font-black bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            مرجع / مقرر خارجي معتمد
          </span>
        </div>

        {/* HERO CARD */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* COVER & QUICK ACTION */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-slate-900">
              <img
                src={book.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-md ${
                isFree ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
              }`}>
                {isFree ? 'مجاني بالكامل' : `${book.price} ج.م`}
              </span>
            </div>

            {/* ACTION / PAYWALL */}
            <div className="space-y-2">
              {!isBookUnlocked ? (
                <div className="space-y-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>هذا المقرر مدفوع ويتطلب الاشتراك للوصول للرابط الكامل</span>
                  </div>
                  <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shadow-amber-200"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>شراء المقرر وفتح الرابط ({book.price} ج.م)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تم فتح الوصول للمقرر بنجاح!</span>
                  </div>
                  <a
                    href={book.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 shadow-indigo-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>الانتقال للرابط التفاعلي والمحتوى الكامل</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* DETAILS & VIDEO */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {book.subcategory || 'مقرر عام'}
                </span>
                {book.grade_level && (
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">
                    {book.grade_level}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                {book.title}
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                المؤلف / المحاضر: <span className="font-bold text-gray-800">{book.author_name || 'خبير المحتوى'}</span>
              </p>
            </div>

            {/* VIDEO EXPLANATION EMBED */}
            {embedUrl ? (
              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-rose-600" />
                  <span>فيديو تعريفي وتوضيحي عن المقرر (شاهد قبل الشراء)</span>
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                  <iframe
                    src={embedUrl}
                    title="Explanatory Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-700">نبذة وتفاصيل المقرر:</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {book.description || 'يقدم هذا المرجع محتوى تعليمياً وتطبيقياً متخصصاً يغطي المفاهيم الأساسية والأمثلة العملية.'}
              </p>
            </div>
          </div>
        </div>

        {/* 📚 RELATED COURSES & BOOKS SECTION (AT THE FULL-WIDTH BOTTOM) */}
        <div className="w-full pt-8 border-t border-gray-200">
          <RelatedBooksSection
            currentBook={book}
            allBooks={books}
            onOpenBook={(bId) => {
              navigate(`/book/${bId}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* PURCHASE MODAL */}
        {isPurchaseModalOpen && onPurchaseBook && (
          <PurchaseModal
            isOpen={isPurchaseModalOpen}
            book={book}
            onClose={() => setIsPurchaseModalOpen(false)}
            onConfirmPurchase={onPurchaseBook}
          />
        )}
      </div>
    );
  }

  if (!activeChapter) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <BookOpen className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-bold mb-2">الكتاب قيد المعالجة</h3>
        <p>لا توجد فصول متوفرة بعد أو أن الكتاب لم يتم تحميله بالكامل.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-24 text-right" dir="rtl">
      
      {/* 2-COLUMN MAIN CONTENT (SIDEBAR + ACTIVE TAB AREA) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* CHAPTERS SIDEBAR */}
        <div className="w-full md:w-72 shrink-0 space-y-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>فهرس فصول الكتاب</span>
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
              {book.chapters?.length || 0} فصول
            </span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {(book.chapters || []).map((chapter, idx) => {
              const isPurchased = purchasedBookIds.includes(book.id);
              const isFree = !book.price || book.price === 0;
              const isBookUnlocked = isFree || isPurchased || isAdminMode;
              const isChapterLocked = !isBookUnlocked && idx > 0;
              const isSelected = activeChapterId === chapter.id;

              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    if (isChapterLocked) {
                      setIsPurchaseModalOpen(true);
                    } else {
                      setActiveChapterId(chapter.id);
                    }
                  }}
                  className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isChapterLocked
                      ? 'text-gray-400 bg-gray-50/70 hover:bg-gray-100 hover:text-gray-700 border border-gray-100'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isChapterLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : idx === 0 && !isBookUnlocked ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded shrink-0">معاينة</span>
                    ) : null}
                    <span className="truncate">{chapter.title}</span>
                  </div>
                  <span className={`text-[10px] shrink-0 mr-2 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ADMIN 1-CLICK BATCH ASSET PRE-GENERATION */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              onClick={handlePregenerateAllAssets}
              disabled={isPregenerating}
              className="w-full p-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              {isPregenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري تجهيز كافة الأصوات...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>⚡ تجهيز كافة الأصوات والبودكاست</span>
                </>
              )}
            </button>

            {isPregenerating && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-right">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                  <span className="truncate">{pregenStep}</span>
                  <span>{pregenPercent}%</span>
                </div>
                <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${pregenPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI INCREMENTAL EXPAND BUTTON */}
          <button
            onClick={handleExpandChapters}
            disabled={isExpandingChapters}
            className="w-full p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 hover:border-indigo-300 text-indigo-800 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-sm hover:shadow active:scale-95 disabled:opacity-60"
          >
            {isExpandingChapters ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>جاري استكمال وتوليد بقية الفصول...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                <span>استكمال وتوليد فصول إضافية بالـ AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* BACK TO MARKETPLACE & STATUS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 shadow-sm rounded-3xl p-4 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للمكتبة الرقمية</span>
            </button>
            <h2 className="text-sm font-black text-gray-900">{book.title}</h2>
          </div>

          {/* PUBLISH / DRAFT TOGGLE BADGE */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePublish}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
                book.is_published
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
              title="تغيير حالة النشر للطلاب"
            >
              {book.is_published ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>منشور للطلاب (جاهز للعرض)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>مسودة خاصة (مخفي عن الطلاب)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'read', label: 'قراءة المقرر', icon: BookOpen, enabled: true },
            { id: 'podcast', label: 'استوديو البودكاست', icon: Radio, enabled: book.feature_toggles?.show_podcast !== false },
            { id: 'flashcards', label: 'بطاقات المراجعة الذكية', icon: Layers, enabled: book.feature_toggles?.show_flashcards !== false },
            { id: 'sandbox', label: 'المختبر والتطبيق العملي', icon: Terminal, enabled: book.feature_toggles?.show_sandbox !== false },
            { id: 'quiz', label: 'بنك الأسئلة والاختبارات', icon: HelpCircle, enabled: book.feature_toggles?.show_quiz !== false },
            { id: 'mindmap', label: 'الخريطة المفاهيمية', icon: Brain, enabled: book.feature_toggles?.show_mindmap !== false },
            { id: 'videos', label: 'المقاطع المرئية', icon: Youtube, enabled: book.feature_toggles?.show_videos !== false },
            { id: 'editor', label: 'محرر الفصل وتصحيح النصوص', icon: Edit, enabled: true }
          ].filter(tab => tab.enabled).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE TAB CONTENT */}
        {activeTab === 'read' && activeChapter && (
          <ReadSection chapter={activeChapter} />
        )}

        {activeTab === 'podcast' && activeChapter && (
          <PodcastLounge
            bookId={book.id}
            chapterId={activeChapter.id}
            chapterTitle={activeChapter.title}
            chapterContent={activeChapter.content}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeTab === 'flashcards' && activeChapter && (
          <FlashcardsSection
            chapter={activeChapter}
            onUpdateFlashcards={handleUpdateFlashcards}
          />
        )}

        {activeTab === 'sandbox' && activeChapter && (
          <DynamicDomainSandbox
            book={book}
            chapter={activeChapter}
          />
        )}

        {activeTab === 'quiz' && activeChapter && (
          <QuizSection
            bookId={book.id}
            chapterTitle={activeChapter.title}
            questions={Array.isArray(activeChapter.quiz) ? activeChapter.quiz : []}
            onUpdateQuestions={(updatedQuestions) => {
              const updatedChapters = book.chapters.map(ch =>
                ch.id === activeChapter.id ? { ...ch, quiz: updatedQuestions } : ch
              );
              setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
              try {
                supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
              } catch (e) {}
            }}
            onGenerateAiQuestions={handleGenerateAiQuestions}
            isGeneratingAiQuestions={isGeneratingAiQuestions}
          />
        )}

        {activeTab === 'mindmap' && activeChapter && (
          <MindMap
            nodes={Array.isArray(activeChapter.mindMap) ? activeChapter.mindMap : []}
            ebookId={book.id}
            chapterId={activeChapter.id}
            chapterContent={activeChapter.content}
            onUpdateNodes={handleUpdateChapterMindMap}
          />
        )}

        {activeTab === 'videos' && activeChapter && (
          <VideoSection videos={Array.isArray(activeChapter.videos) ? activeChapter.videos : []} />
        )}

        {activeTab === 'editor' && activeChapter && (
          <ChapterEditor
            chapter={activeChapter}
            onSaveChapter={handleSaveChapter}
            onAddChapter={async () => {
              const newChapter = {
                id: `ch-${Date.now()}`,
                title: `فصل جديد ${book.chapters.length + 1}`,
                content: '# محتوى الفصل الجديد\n\nاكتب تفاصيل وشرح الفصل هنا...',
                summary: 'ملخص الفصل الجديد',
                videos: [],
                quiz: [],
                mindMap: []
              };
              const updated = [...book.chapters, newChapter];
              setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
              setActiveChapterId(newChapter.id);
              try {
                await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
              } catch (e) {
                console.warn(e);
              }
            }}
            onDeleteChapter={async () => {
              if (book.chapters.length <= 1) return;
              const updated = book.chapters.filter(c => c.id !== activeChapter.id);
              setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
              setActiveChapterId(updated[0]?.id || null);
              try {
                await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
              } catch (e) {
                console.warn(e);
              }
            }}
            canDelete={book.chapters.length > 1}
          />
        )}

        </div>
      </div>

      {/* 📚 RELATED COURSES & BOOKS SECTION (AT THE FULL-WIDTH BOTTOM) */}
      <div className="w-full">
        <RelatedBooksSection
          currentBook={book}
          allBooks={books}
          onOpenBook={(bId) => {
            navigate(`/book/${bId}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* PERSISTENT FLOATING AUDIO BAR */}
      <FloatingAudioBar />

      {/* PURCHASE MODAL */}
      {isPurchaseModalOpen && onPurchaseBook && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          book={book}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirmPurchase={onPurchaseBook}
        />
      )}
    </div>
  );
}
