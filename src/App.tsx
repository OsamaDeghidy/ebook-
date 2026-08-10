import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Shield, LogOut, User
} from 'lucide-react';
import { MarketplaceBook, UserRole } from './types';
import ContentUploader from './components/ContentUploader';
import MindMap from './components/MindMap';
import QuizSection from './components/QuizSection';
import VideoSection from './components/VideoSection';
import ChapterEditor from './components/ChapterEditor';
import PodcastLounge from './components/PodcastLounge';
import { ReadSection } from './components/ReadSection';
import { MarketplaceView } from './components/MarketplaceView';
import { AuthModal } from './components/AuthModal';
import { AddExternalBookModal } from './components/AddExternalBookModal';
import { supabase } from './lib/supabase';

function AppContent() {
  const [ebooks, setEbooks] = useState<MarketplaceBook[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [isAiCreateModalOpen, setIsAiCreateModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupabaseCatalog();
    checkAuthSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setUserRole('student');
        setIsAdminMode(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuthSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      fetchUserProfile(session.user.id);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile) {
        const role = (profile.role as UserRole) || 'student';
        setUserRole(role);
        if (role === 'admin') setIsAdminMode(true);
      }
    } catch (e) {
      console.warn("Profile fetch error:", e);
    }
  };

  const fetchSupabaseCatalog = async () => {
    try {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const res = await fetch('/api/ebooks');
        if (res.ok) {
          const localBooks = await res.json();
          const mapped: MarketplaceBook[] = localBooks.map((b: any) => ({
            ...b,
            author_name: b.author_name || 'د. كريم كامل',
            category: b.category || 'digital_book',
            tags: b.tags || ['كتاب_تفاعلي', 'كيمياء_عضوية'],
            price: b.price || 0,
            is_external: false,
            is_published: true,
            thumbnail_url: b.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
            rating: 5.0,
            reviews_count: 140
          }));
          setEbooks(mapped);
        }
      } else {
        const formatted: MarketplaceBook[] = data.map((b: any) => ({
          ...b,
          author_name: b.author_name || 'د. كريم كامل',
          category: b.category || 'digital_book',
          tags: b.tags || ['كتاب_تفاعلي'],
          price: b.price || 0,
          is_external: !!b.is_external,
          external_url: b.external_url,
          is_published: b.is_published !== false,
          thumbnail_url: b.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
          rating: b.rating || 5.0,
          reviews_count: b.reviews_count || 120,
          chapters: b.chapters || []
        }));
        setEbooks(formatted);
      }
    } catch (err: any) {
      console.error("Catalog fetch error:", err);
    }
  };

  const handleLaunchBook = (book: MarketplaceBook) => {
    navigate(`/book/${book.id}`);
  };

  const handleLaunchQuiz = (book: MarketplaceBook) => {
    navigate(`/book/${book.id}?tab=quiz`);
  };

  const handleTogglePublish = async (bookId: string) => {
    const target = ebooks.find(b => b.id === bookId);
    if (!target) return;
    const newPublished = !target.is_published;
    setEbooks(prev => prev.map(b => b.id === bookId ? { ...b, is_published: newPublished } : b));
    try {
      await supabase.from('books').update({ is_published: newPublished }).eq('id', bookId);
    } catch (e) {}
  };

  const handleDeleteBook = async (bookId: string) => {
    setEbooks(prev => prev.filter(b => b.id !== bookId));
    try {
      await supabase.from('books').delete().eq('id', bookId);
    } catch (e) {}
  };

  const handleAddExternalBook = async (bookData: any) => {
    const newBook: MarketplaceBook = {
      id: `ext-${Date.now()}`,
      title: bookData.title,
      description: bookData.description,
      author_name: bookData.authorName,
      category: bookData.category,
      tags: bookData.tags,
      price: bookData.price,
      is_external: true,
      external_url: bookData.externalUrl,
      is_published: true,
      thumbnail_url: bookData.thumbnailUrl,
      rating: 5.0,
      reviews_count: 1,
      chapters: []
    };
    setEbooks(prev => [newBook, ...prev]);
    try {
      await supabase.from('books').insert(newBook);
    } catch (e) {}
  };

  const handleConvert = async (payload: { promptText: string; fileBase64?: string; fileName?: string; fileType?: string }) => {
    setIsConverting(true);
    setProgressPercent(10);
    setProgressStep("بدء فحص وتحليل الملف...");
    try {
      const res = await fetch('/api/ebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("فشل توليد الكتاب التفاعلي");
      const data = await res.json();
      let generatedEbook: any = null;
      if (data.jobId) {
        while (!generatedEbook) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/api/ebooks/tasks/${data.jobId}`);
          if (pollRes.ok) {
            const jobData = await pollRes.json();
            setProgressPercent(jobData.progressPercent);
            setProgressStep(jobData.progressStep);
            if (jobData.status === 'completed') {
              generatedEbook = jobData.result;
            } else if (jobData.status === 'failed') {
              throw new Error(jobData.error || "فشل التوليد");
            }
          }
        }
      } else if (data.ebook) {
        generatedEbook = data.ebook;
      }
      if (!generatedEbook) throw new Error("لم يتم إرجاع بيانات الكتاب.");
      const newBook: MarketplaceBook = {
        ...generatedEbook,
        author_name: 'د. كريم كامل',
        category: 'digital_book',
        tags: ['كتاب_تفاعلي', 'ذكاء_اصطناعي'],
        price: 0,
        is_external: false,
        is_published: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviews_count: 1
      };
      setEbooks(prev => [newBook, ...prev]);
      try {
        await supabase.from('books').insert(newBook);
      } catch (e) {}
      setIsAiCreateModalOpen(false);
      navigate(`/book/${newBook.id}`);
    } catch (err: any) {
      console.error(err);
      alert(`عذراً، حدث خطأ أثناء التوليد: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRole('student');
    setIsAdminMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" dir="rtl">
      {/* GLOBAL SAAS NAVBAR (Light Theme) */}
      <header className="bg-white/90 border-b border-gray-200 sticky top-0 z-40 px-6 py-4 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm text-gray-900 tracking-tight">منصة المقررات الأكاديمية والكتب التفاعلية</h1>
            <p className="text-[11px] text-indigo-600 font-bold">Interactive Ebook LMS & Marketplace Studio</p>
          </div>
        </Link>

        {/* CONTROLS & AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border transition flex items-center gap-1.5 ${
                isAdminMode
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminMode ? 'وضع المسؤول 🛡️' : 'الانتقال لوضع الطالب'}</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-700">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentUser.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-gray-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <Routes>
          <Route path="/" element={
            <MarketplaceView
              books={ebooks}
              userRole={userRole}
              isAdminMode={isAdminMode}
              onLaunchBook={handleLaunchBook}
              onLaunchQuiz={handleLaunchQuiz}
              onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
              onOpenExternalModal={() => setIsExternalModalOpen(true)}
              onTogglePublish={handleTogglePublish}
              onDeleteBook={handleDeleteBook}
            />
          } />
          <Route path="/book/:id" element={<BookDetailsRoute books={ebooks} setEbooks={setEbooks} hasGeminiKey={hasGeminiKey} />} />
        </Routes>
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user, role) => {
          setCurrentUser(user);
          setUserRole(role);
          if (role === 'admin') setIsAdminMode(true);
        }}
      />

      <AddExternalBookModal
        isOpen={isExternalModalOpen}
        onClose={() => setIsExternalModalOpen(false)}
        onAddBook={handleAddExternalBook}
      />

      {isAiCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl">
            <ContentUploader
              onConvert={handleConvert}
              isConverting={isConverting}
              progressPercent={progressPercent}
              progressStep={progressStep}
            />
            <button
              onClick={() => setIsAiCreateModalOpen(false)}
              className="mt-4 w-full py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Extract BookDetailsRoute logic directly to read params
function BookDetailsRoute({ books, setEbooks, hasGeminiKey }: { books: MarketplaceBook[], setEbooks: React.Dispatch<React.SetStateAction<MarketplaceBook[]>>, hasGeminiKey: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as any) || 'read';

  const book = books.find(b => b.id === id);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'read' | 'podcast' | 'quiz' | 'mindmap' | 'videos' | 'editor'>(initialTab);
  const [isGeneratingAiQuestions, setIsGeneratingAiQuestions] = useState(false);

  useEffect(() => {
    if (book && book.chapters && book.chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(book.chapters[0].id);
    }
  }, [book, activeChapterId]);

  if (!book) {
    return <div className="p-8 text-center text-gray-500">جاري تحميل بيانات الكتاب...</div>;
  }

  const activeChapter = book.chapters?.find(c => c.id === activeChapterId) || book.chapters?.[0];

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
          setEbooks(prev => prev.map(b => {
            if (b.id === book.id) {
              const updatedChapters = b.chapters.map(ch => {
                if (ch.id === activeChapter.id) {
                  return { ...ch, quiz: [...(ch.quiz || []), ...data.questions] };
                }
                return ch;
              });
              return { ...b, chapters: updatedChapters };
            }
            return b;
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiQuestions(false);
    }
  };

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
    <div className="space-y-6 animate-fade-in flex flex-col md:flex-row gap-6">
      
      {/* CHAPTERS SIDEBAR */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-black text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">فهرس الكتاب</h3>
          <div className="space-y-1">
            {(book.chapters || []).map(chapter => (
              <button
                key={chapter.id}
                onClick={() => setActiveChapterId(chapter.id)}
                className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition ${
                  activeChapterId === chapter.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* BACK TO MARKETPLACE HEADER */}
        <div className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر والمكتبة الرقمية</span>
          </button>

          <h2 className="text-sm font-black text-gray-900">{book.title}</h2>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            { id: 'read', label: 'قراءة المقرر', icon: BookOpen },
            { id: 'podcast', label: 'استوديو البودكاست التفاعلي', icon: Radio },
            { id: 'quiz', label: 'بنك الأسئلة والاختبارات', icon: HelpCircle },
            { id: 'mindmap', label: 'الخريطة الذهنية التفاعلية', icon: Brain },
            { id: 'videos', label: 'المقاطع المرئية', icon: Youtube },
            { id: 'editor', label: 'محرر الفصل', icon: Edit }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition ${
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

        {activeTab === 'quiz' && activeChapter && (
          <QuizSection
            bookId={book.id}
            questions={Array.isArray(activeChapter.quiz) ? activeChapter.quiz : []}
            onUpdateQuestions={(updatedQuestions) => {
              setEbooks(prev => prev.map(b => {
                if (b.id === book.id) {
                  return {
                    ...b,
                    chapters: b.chapters.map(ch => ch.id === activeChapter.id ? { ...ch, quiz: updatedQuestions } : ch)
                  };
                }
                return b;
              }));
            }}
            onGenerateAiQuestions={handleGenerateAiQuestions}
            isGeneratingAiQuestions={isGeneratingAiQuestions}
          />
        )}

        {activeTab === 'mindmap' && activeChapter && (
          <MindMap
            nodes={Array.isArray(activeChapter.mindMap) ? activeChapter.mindMap : []}
            onUpdateNodes={() => {}}
            chapterContent={activeChapter.content}
          />
        )}

        {activeTab === 'videos' && activeChapter && (
          <VideoSection videos={Array.isArray(activeChapter.videos) ? activeChapter.videos : []} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
