import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Shield, LogOut, User, X
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
import BookDetailsRoute from './routes/BookDetailsRoute';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';

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
      // Supabase is the primary authoritative database
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      
      if (!error && data) {
        const formatted: MarketplaceBook[] = data.map((b: any) => {
          // Extract structured academic tags if present
          let subcategory = b.subcategory;
          let grade_level = b.grade_level;
          let semester = b.semester;
          let academic_year = b.academic_year;

          if (Array.isArray(b.tags)) {
            b.tags.forEach((t: string) => {
              if (t.startsWith('sub:') && !subcategory) subcategory = t.replace('sub:', '');
              if (t.startsWith('grade:') && !grade_level) grade_level = t.replace('grade:', '');
              if (t.startsWith('term:') && !semester) semester = t.replace('term:', '');
              if (t.startsWith('year:') && !academic_year) academic_year = t.replace('year:', '');
            });
          }

          return {
            ...b,
            author_name: b.author_name || 'د. كريم كامل',
            category: b.category || 'digital_book',
            subcategory,
            grade_level,
            semester,
            academic_year,
            tags: b.tags || ['كتاب_تفاعلي'],
            price: b.price || 0,
            is_external: !!b.is_external,
            external_url: b.external_url,
            is_published: b.is_published !== false,
            thumbnail_url: b.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
            rating: b.rating || 5.0,
            reviews_count: b.reviews_count || 120,
            chapters: b.chapters || []
          };
        });

        setEbooks(formatted);
        return;
      }

      // Fallback only if Supabase fails (e.g., offline)
      try {
        const res = await fetch('/api/ebooks');
        if (res.ok) {
          const localBooks = await res.json();
          setEbooks(localBooks);
        }
      } catch (err) {
        console.warn("Could not fetch fallback local books:", err);
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
    } catch (e) {
      console.warn("Publish toggle error:", e);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    // 1. Remove from state immediately
    setEbooks(prev => prev.filter(b => b.id !== bookId));
    
    // 2. Delete from Supabase
    try {
      await supabase.from('books').delete().eq('id', bookId);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }

    // 3. Also delete from local server cache
    try {
      await fetch(`/api/ebooks/${bookId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Server delete error:", e);
    }
  };

  const handleUpdateBook = async (updatedBook: MarketplaceBook) => {
    // 1. Update state
    setEbooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));

    // 2. Update Supabase
    try {
      const sanitizedPayload = {
        title: updatedBook.title,
        description: updatedBook.description,
        author_name: updatedBook.author_name,
        category: updatedBook.category,
        tags: updatedBook.tags,
        price: updatedBook.price,
        thumbnail_url: updatedBook.thumbnail_url,
        is_published: updatedBook.is_published
      };
      await supabase.from('books').update(sanitizedPayload).eq('id', updatedBook.id);
    } catch (e) {
      console.error("Supabase update error:", e);
    }

    // 3. Update local server
    try {
      await fetch(`/api/ebooks/${updatedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      });
    } catch (e) {
      console.warn("Server update error:", e);
    }
  };

  const handleAddExternalBook = async (bookData: any) => {
    const newBook: MarketplaceBook = {
      id: crypto.randomUUID(),
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
      await supabase.from('books').insert({
        id: newBook.id,
        title: newBook.title,
        description: newBook.description,
        author_name: newBook.author_name,
        category: newBook.category,
        tags: newBook.tags,
        price: newBook.price,
        is_external: true,
        external_url: newBook.external_url,
        is_published: true,
        thumbnail_url: newBook.thumbnail_url,
        rating: 5.0,
        reviews_count: 1,
        chapters: []
      });
    } catch (e) {
      console.error("Add external book error:", e);
    }
  };

  const handleConvert = async (payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: any;
    track?: any;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
  }) => {
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

      // Build structured tags with academic metadata
      const academicTags = [
        'كتاب_تفاعلي',
        'ذكاء_اصطناعي',
        payload.subcategory ? `sub:${payload.subcategory}` : '',
        payload.grade_level ? `grade:${payload.grade_level}` : '',
        payload.semester ? `term:${payload.semester}` : '',
        payload.academic_year ? `year:${payload.academic_year}` : ''
      ].filter(Boolean);

      const newBook: MarketplaceBook = {
        ...generatedEbook,
        author_name: 'د. كريم كامل',
        category: payload.category || 'digital_book',
        subcategory: payload.subcategory,
        grade_level: payload.grade_level,
        semester: payload.semester,
        academic_year: payload.academic_year,
        source_file_name: payload.fileName,
        tags: academicTags,
        price: 0,
        is_external: false,
        is_published: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviews_count: 1,
        created_at: new Date().toISOString()
      };

      // 1. Add to local state immediately
      setEbooks(prev => [newBook, ...prev]);

      // 2. Insert into Supabase
      try {
        const supabasePayload = {
          id: newBook.id,
          title: newBook.title,
          description: newBook.description,
          author_name: newBook.author_name,
          category: newBook.category,
          tags: newBook.tags,
          price: newBook.price,
          is_external: false,
          is_published: true,
          thumbnail_url: newBook.thumbnail_url,
          rating: 5.0,
          reviews_count: 1,
          chapters: newBook.chapters,
          mind_map: newBook.mind_map || [],
          question_bank: newBook.question_bank || []
        };
        const { error: insertError } = await supabase.from('books').insert(supabasePayload);
        if (insertError) {
          console.error("Supabase insert error:", insertError);
        } else {
          console.log("Book successfully saved to Supabase!");
        }
      } catch (dbErr) {
        console.error("Database save error:", dbErr);
      }

      // 3. Close modal and redirect to book details route
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
              onUpdateBook={handleUpdateBook}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto" dir="rtl">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative my-auto custom-scrollbar">
            <button
              onClick={() => setIsAiCreateModalOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition z-10"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
            <ContentUploader
              onConvert={handleConvert}
              isConverting={isConverting}
              progressPercent={progressPercent}
              progressStep={progressStep}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
