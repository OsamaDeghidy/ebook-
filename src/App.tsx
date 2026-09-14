import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Shield, LogOut, User, X, Sparkles, Compass, ShoppingCart
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
import { LandingPageView } from './components/LandingPageView';
import { AuthModal } from './components/AuthModal';
import { AddExternalBookModal } from './components/AddExternalBookModal';
import { AdminInstructorHub } from './components/admin/AdminInstructorHub';
import { StudentStreakBadge } from './components/gamification/StudentStreakBadge';
import { EduReelsFeedView } from './components/reels/EduReelsFeedView';
import BookDetailsRoute from './routes/BookDetailsRoute';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getPlatformConfig, PlatformConfig } from './services/platformConfigService';

function AppContent() {
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfig());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setPlatformConfig(e.detail || getPlatformConfig());
    };
    window.addEventListener('platform-config-changed', handleConfigChange);
    return () => window.removeEventListener('platform-config-changed', handleConfigChange);
  }, []);

  // 🌐 Dynamic Page Title Sync with Platform Brand Settings
  useEffect(() => {
    if (platformConfig.brandName) {
      document.title = `${platformConfig.brandName} | ${platformConfig.brandSubtitle || 'المنصة الذكية للكتب والمذكرات التعليمية'}`;
    }
  }, [platformConfig.brandName, platformConfig.brandSubtitle]);

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
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('purchased_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const navigate = useNavigate();


  const handlePurchaseBook = async (book: MarketplaceBook) => {
    try {
      const updated = Array.from(new Set([...purchasedBookIds, book.id]));
      setPurchasedBookIds(updated);
      localStorage.setItem('purchased_book_ids', JSON.stringify(updated));

      if (currentUser?.id) {
        try {
          await supabase.from('user_purchases').upsert({
            user_id: currentUser.id,
            book_id: book.id,
            amount_paid: book.price || 0,
            purchase_date: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn("Purchase database sync notice:", dbErr);
        }
      }
    } catch (err) {
      console.error("Purchase error:", err);
    }
  };

  const fetchUserPurchasedBooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('book_id')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const ids = data.map((item: any) => item.book_id).filter(Boolean);
        setPurchasedBookIds(prev => {
          const combined = Array.from(new Set([...prev, ...ids]));
          localStorage.setItem('purchased_book_ids', JSON.stringify(combined));
          return combined;
        });
      }
    } catch (e) {
      console.warn("User purchases fetch notice:", e);
    }
  };

  useEffect(() => {
    fetchSupabaseCatalog();
    checkAuthSession();

    // 🌐 Handle payment return redirects (PayPal / Paymob)
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const bookId = params.get('bookId');
    const amount = params.get('amount');
    const reason = params.get('reason');

    if (paymentStatus) {
      if (paymentStatus === 'success') {
        if (bookId) {
          setPurchasedBookIds(prev => {
            const updated = Array.from(new Set([...prev, bookId]));
            localStorage.setItem('purchased_book_ids', JSON.stringify(updated));
            return updated;
          });
          alert('🎉 تم تأكيد الدفع بنجاح عبر PayPal! تم تفعيل وتوفير الوصول الكامل للمقرر.');
          navigate(`/book/${bookId}?tab=read`);
        } else {
          alert('🎉 تم تأكيد الدفع بنجاح عبر PayPal!');
        }
      } else if (paymentStatus === 'recharge_success') {
        alert(`💳 تم شحن محفظتك بنجاح عبر PayPal ($${amount || ''} USD)!`);
      } else if (paymentStatus === 'cancelled') {
        alert('ℹ️ تم إلغاء عملية الدفع من قبل المستخدم.');
      } else if (paymentStatus === 'failed') {
        alert(`❌ تعذر إتمام عملية الدفع عبر PayPal: ${reason || 'يرجى المحاولة مرة أخرى.'}`);
      }

      // Clean query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id, session.user);
        await fetchUserPurchasedBooks(session.user.id);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id, session.user);
        await fetchUserPurchasedBooks(session.user.id);
      } else {
        // No active Supabase session
        setCurrentUser(null);
        setUserRole('student');
        setIsAdminMode(false);
        localStorage.removeItem('osera_auth_user');
        localStorage.removeItem('osera_auth_role');
        localStorage.removeItem('simplest_auth_user');
        localStorage.removeItem('simplest_auth_role');
      }
    } catch (e) {
      console.warn("Session check notice:", e);
    }
  };

  const fetchUserProfile = async (userId: string, authUser?: any) => {
    try {
      // 1. Check Supabase profiles table by ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.role) {
        const role = profile.role as UserRole;
        setUserRole(role);
        setIsAdminMode(role === 'admin');
        localStorage.setItem('osera_auth_role', role);
        localStorage.setItem('simplest_auth_role', role);
        return;
      }

      // 2. Check Supabase profiles table by Email
      if (authUser?.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (profileByEmail && profileByEmail.role) {
          const role = profileByEmail.role as UserRole;
          setUserRole(role);
          setIsAdminMode(role === 'admin');
          localStorage.setItem('osera_auth_role', role);
          localStorage.setItem('simplest_auth_role', role);
          return;
        }
      }

      // 3. Fallback to auth user metadata if profile not created yet
      const metaRole = (authUser?.user_metadata?.role as UserRole) || 'student';
      setUserRole(metaRole);
      setIsAdminMode(metaRole === 'admin');
      localStorage.setItem('osera_auth_role', metaRole);
      localStorage.setItem('simplest_auth_role', metaRole);

      // Auto-upsert profile to Supabase so it's permanently saved in DB
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: authUser?.email || '',
          full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || '',
          role: metaRole
        });
      } catch (e) {
        console.warn('Profile auto-create notice:', e);
      }
    } catch (e) {
      console.warn('Fetch profile error:', e);
      setUserRole('student');
      setIsAdminMode(false);
    }
  };

  const fetchSupabaseCatalog = async () => {
    try {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      
      if (!error && data) {
        const formatted: MarketplaceBook[] = data.map((b: any) => {
          let education_level = b.education_level;
          let academic_system = b.academic_system;
          let subcategory = b.subcategory;
          let grade_level = b.grade_level;
          let semester = b.semester;
          let academic_year = b.academic_year;
          let preview_video_url = b.preview_video_url;

          if (Array.isArray(b.tags)) {
            b.tags.forEach((t: string) => {
              if (t.startsWith('edu_level:') && !education_level) education_level = t.replace('edu_level:', '');
              if (t.startsWith('system:') && !academic_system) academic_system = t.replace('system:', '');
              if (t.startsWith('sub:') && !subcategory) subcategory = t.replace('sub:', '');
              if (t.startsWith('grade:') && !grade_level) grade_level = t.replace('grade:', '');
              if (t.startsWith('term:') && !semester) semester = t.replace('term:', '');
              if (t.startsWith('year:') && !academic_year) academic_year = t.replace('year:', '');
              if (t.startsWith('video:') && !preview_video_url) preview_video_url = t.replace('video:', '');
            });
          }

          return {
            ...b,
            author_name: b.author_name || 'د. كريم كامل',
            category: b.category || 'digital_book',
            education_level,
            academic_system,
            subcategory,
            grade_level,
            semester,
            academic_year,
            preview_video_url: preview_video_url || undefined,
            tags: b.tags || ['كتاب_تفاعلي'],
            price: Number(b.price) || 0,
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
    setEbooks(prev => prev.filter(b => b.id !== bookId));
    
    try {
      await supabase.from('books').delete().eq('id', bookId);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }

    try {
      await fetch(`/api/ebooks/${bookId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Server delete error:", e);
    }
  };

  const handleUpdateBook = async (updatedBook: MarketplaceBook) => {
    setEbooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));

    try {
      const basePayload: any = {
        title: updatedBook.title,
        description: updatedBook.description,
        author_name: updatedBook.author_name,
        category: updatedBook.category,
        tags: updatedBook.tags,
        price: Number(updatedBook.price) || 0,
        thumbnail_url: updatedBook.thumbnail_url,
        is_published: updatedBook.is_published !== false
      };

      if (updatedBook.chapters) basePayload.chapters = updatedBook.chapters;
      if (updatedBook.mind_map) basePayload.mind_map = updatedBook.mind_map;
      if (updatedBook.question_bank) basePayload.question_bank = updatedBook.question_bank;

      const { error: err1 } = await supabase.from('books').update({
        ...basePayload,
        preview_video_url: updatedBook.preview_video_url || null
      }).eq('id', updatedBook.id);

      if (err1) {
        console.warn("Retrying Supabase update with standard schema:", err1);
        const { error: err2 } = await supabase.from('books').update(basePayload).eq('id', updatedBook.id);
        if (err2) {
          console.error("Supabase update error:", err2);
        } else {
          console.log("Book updated successfully in Supabase (standard schema)!");
        }
      } else {
        console.log("Book updated successfully in Supabase (full schema)!");
      }
    } catch (e) {
      console.error("Supabase update exception:", e);
    }

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
    const authorName = bookData.authorName || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'د. كريم كامل';
    const newBook: MarketplaceBook = {
      id: crypto.randomUUID(),
      title: bookData.title,
      description: bookData.description,
      author_name: authorName,
      author_id: currentUser?.id,
      category: bookData.category,
      tags: bookData.tags,
      price: Number(bookData.price) || 0,
      is_external: true,
      external_url: bookData.externalUrl,
      preview_video_url: bookData.previewVideoUrl || undefined,
      is_published: true,
      thumbnail_url: bookData.thumbnailUrl,
      rating: 5.0,
      reviews_count: 1,
      chapters: []
    };
    setEbooks(prev => [newBook, ...prev]);
    try {
      const basePayload: any = {
        id: newBook.id,
        title: newBook.title,
        description: newBook.description,
        author_name: newBook.author_name,
        author_id: currentUser?.id || null,
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
      };

      const { error: err1 } = await supabase.from('books').upsert({
        ...basePayload,
        preview_video_url: newBook.preview_video_url || null
      });

      if (err1) {
        console.warn("Retrying external book upsert with standard schema:", err1);
        await supabase.from('books').upsert(basePayload);
      }
    } catch (e) {
      console.warn("Supabase external book insert error:", e);
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
    education_level?: string;
    academic_system?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    price?: number;
    preview_video_url?: string;
  }) => {
    setIsConverting(true);
    setProgressPercent(10);
    setProgressStep("بدء فحص وتحليل الملف...");
    try {
      const res = await fetch('/api/ebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userId: currentUser?.id,
          userRole: userRole,
          userEmail: currentUser?.email
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "فشل توليد الكتاب التفاعلي");
      }
      const data = await res.json();
      let generatedEbook: any = data.ebook || null;
      if (!generatedEbook && data.jobId) {
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
      }
      if (!generatedEbook) throw new Error("لم يتم إرجاع بيانات الكتاب.");

      const academicTags = [
        'كتاب_تفاعلي',
        'ذكاء_اصطناعي',
        payload.education_level ? `edu_level:${payload.education_level}` : '',
        payload.academic_system ? `system:${payload.academic_system}` : '',
        payload.subcategory ? `sub:${payload.subcategory}` : '',
        payload.grade_level ? `grade:${payload.grade_level}` : '',
        payload.semester ? `term:${payload.semester}` : '',
        payload.academic_year ? `year:${payload.academic_year}` : '',
        payload.preview_video_url ? `video:${payload.preview_video_url}` : ''
      ].filter(Boolean);

      const creatorAuthorName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'د. كريم كامل';
      const newBook: MarketplaceBook = {
        ...generatedEbook,
        author_name: creatorAuthorName,
        author_id: currentUser?.id,
        category: payload.category || 'academic_curriculum',
        track: payload.track || 'academic',
        education_level: payload.education_level,
        academic_system: payload.academic_system,
        subcategory: payload.subcategory,
        grade_level: payload.grade_level,
        semester: payload.semester,
        academic_year: payload.academic_year,
        source_file_name: payload.fileName,
        tags: academicTags,
        price: Number(payload.price) || 0,
        preview_video_url: payload.preview_video_url,
        is_external: false,
        is_published: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviews_count: 1,
        created_at: new Date().toISOString()
      };

      setEbooks(prev => [newBook, ...prev]);

      try {
        const basePayload: any = {
          id: newBook.id,
          title: newBook.title,
          description: newBook.description,
          author_name: newBook.author_name,
          author_id: currentUser?.id || null,
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

        const { error: insertError } = await supabase.from('books').upsert({
          ...basePayload,
          preview_video_url: newBook.preview_video_url || null
        });

        if (insertError) {
          console.warn("Retrying book insert with standard schema:", insertError);
          const { error: retryError } = await supabase.from('books').upsert(basePayload);
          if (retryError) console.error("Supabase upsert error:", retryError);
        } else {
          console.log("Book successfully confirmed in Supabase!");
        }
      } catch (dbErr) {
        console.error("Database save error:", dbErr);
      }

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
    localStorage.removeItem('osera_auth_user');
    localStorage.removeItem('osera_auth_role');
    localStorage.removeItem('simplest_auth_user');
    localStorage.removeItem('simplest_auth_role');
    setCurrentUser(null);
    setUserRole('student');
    setIsAdminMode(false);
  };

  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white" dir="rtl">
      {/* GLOBAL SAAS NAVBAR (Dynamic White-Label Branding) */}
      <header className="bg-white/95 border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 py-3.5 backdrop-blur-md flex items-center justify-between relative print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/25 text-white font-black text-xl group-hover:scale-105 transition">
              {platformConfig.brandName.charAt(0) || 'أ'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-slate-900 tracking-tight">{platformConfig.brandName}</span>
                <span className="text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md">AI LMS</span>
              </div>
              <p className="text-xs text-slate-700 font-bold">{platformConfig.brandSubtitle}</p>
            </div>
          </Link>
        </div>

        {/* 🌟 CENTERED MAIN NAVIGATION LINKS IN THE MIDDLE OF THE HEADER */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-bold absolute left-1/2 -translate-x-1/2">
          <Link
            to="/"
            className={`px-4 py-2 rounded-xl transition ${
              isLandingPage
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            الرئيسية
          </Link>

          <Link
            to="/marketplace"
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              location.pathname === '/marketplace'
                ? 'bg-sky-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>متجر ومكتبة المقررات</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${location.pathname === '/marketplace' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {ebooks.length}
            </span>
          </Link>

          {/* REELS LINK */}
          <Link
            to="/reels"
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              location.pathname === '/reels'
                ? 'bg-purple-600 text-white font-black shadow-xs'
                : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-purple-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>🎬 ريلز المعرفة</span>
          </Link>

          {/* INSTRUCTOR / ADMIN HUB LINK */}
          {currentUser && (userRole === 'admin' || userRole === 'instructor' || isAdminMode) && (
            <Link
              to={userRole === 'admin' || isAdminMode ? '/admin' : '/instructor'}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                location.pathname === '/admin' || location.pathname === '/instructor'
                  ? 'bg-indigo-600 text-white font-black shadow-xs'
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{userRole === 'admin' || isAdminMode ? 'لوحة التحكم والإدارة 🛡️' : 'لوحة المعلم والسنتر ⚡'}</span>
            </Link>
          )}
        </nav>

        {/* CONTROLS & AUTH BUTTONS */}
        <div className="flex items-center gap-2.5">
          {/* 🌟 GAMIFICATION / DAILY STREAK BADGE */}
          <StudentStreakBadge currentUser={currentUser} />


          {isLandingPage && (
            <Link
              to="/marketplace"
              className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-sm transition items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>تصفح المقررات</span>
            </Link>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-black border transition flex items-center gap-1.5 ${
                isAdminMode
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminMode ? 'وضع المسؤول 🛡️' : 'الانتقال لوضع الطالب'}</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>{currentUser.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={
            <LandingPageView
              books={ebooks}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          } />
          <Route path="/marketplace" element={
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <MarketplaceView
                books={ebooks}
                userRole={userRole}
                isAdminMode={isAdminMode}
                purchasedBookIds={purchasedBookIds}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLaunchBook={handleLaunchBook}
                onLaunchQuiz={handleLaunchQuiz}
                onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                onOpenExternalModal={() => setIsExternalModalOpen(true)}
                onTogglePublish={handleTogglePublish}
                onDeleteBook={handleDeleteBook}
                onUpdateBook={handleUpdateBook}
                onPurchaseBook={handlePurchaseBook}
              />
            </div>
          } />
          <Route path="/admin" element={
            !currentUser ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">هذه المنطقة مخصصة لإدارة المنصة</h3>
                <p className="text-xs text-slate-500">يرجى تسجيل الدخول بحساب المسؤول العام للوصول إلى لوحة التحكم المركزية.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تسجيل الدخول الآن 🔑
                </button>
              </div>
            ) : (userRole === 'instructor' && !isAdminMode) ? (
              <Navigate to="/instructor" replace />
            ) : (userRole !== 'admin' && !isAdminMode) ? (
              <Navigate to="/marketplace" replace />
            ) : (
              <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
                <AdminInstructorHub
                  books={ebooks}
                  userRole={userRole}
                  isAdminMode={isAdminMode}
                  currentUser={currentUser}
                  onBackToMarketplace={() => navigate('/marketplace')}
                  onLaunchBook={(id) => navigate(`/book/${id}`)}
                  onTogglePublish={handleTogglePublish}
                  onDeleteBook={handleDeleteBook}
                  onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                  onOpenExternalModal={() => setIsExternalModalOpen(true)}
                />
              </div>
            )
          } />
          <Route path="/instructor" element={
            !currentUser ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">هذه المنطقة مخصصة للمعلمين</h3>
                <p className="text-xs text-slate-500">يرجى تسجيل الدخول بحساب المعلم للوصول إلى استوديو المعلم وإصدار الكروت.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تسجيل الدخول كمعلم 👨‍🏫
                </button>
              </div>
            ) : (userRole === 'student' && !isAdminMode) ? (
              <div className="p-12 text-center bg-white border border-rose-100 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">عفواً، هذه اللوحة مخصصة للمعلمين فقط</h3>
                <p className="text-xs text-slate-500">حسابك مسجل كطالب. لوحة المعلم مخصصة للمدرسين لنشر المقررات التعليمية وإدارة كروت السنتر.</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تصفح ومتابعة المقررات 📚
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
                <AdminInstructorHub
                  books={ebooks}
                  userRole={userRole}
                  isAdminMode={isAdminMode}
                  currentUser={currentUser}
                  onBackToMarketplace={() => navigate('/marketplace')}
                  onLaunchBook={(id) => navigate(`/book/${id}`)}
                  onTogglePublish={handleTogglePublish}
                  onDeleteBook={handleDeleteBook}
                  onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                  onOpenExternalModal={() => setIsExternalModalOpen(true)}
                />
              </div>
            )
          } />
          <Route path="/book/:id" element={
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <BookDetailsRoute
                books={ebooks}
                setEbooks={setEbooks}
                hasGeminiKey={hasGeminiKey}
                purchasedBookIds={purchasedBookIds}
                onPurchaseBook={handlePurchaseBook}
                userRole={userRole}
                isAdminMode={isAdminMode}
                currentUser={currentUser}
              />
            </div>
          } />
          <Route path="/reels" element={
            <EduReelsFeedView
              currentUser={currentUser}
              onBack={() => navigate(-1)}
              onOpenBook={(bookId, chapterId) => navigate(`/book/${bookId}`)}
            />
          } />
          <Route path="/book/:bookId/reels" element={
            <EduReelsFeedView
              currentUser={currentUser}
              onBack={() => navigate(-1)}
              onOpenBook={(bookId, chapterId) => navigate(`/book/${bookId}`)}
            />
          } />
        </Routes>
      </main>

      {/* 🌟 DYNAMIC SAAS PLATFORM FOOTER */}
      {!location.pathname.startsWith('/reels') && !location.pathname.includes('/reels') && (
        <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 print:hidden" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-black text-sm">
                {platformConfig.brandName.charAt(0) || 'أ'}
              </div>
              <div>
                <p className="font-black text-white text-sm">{platformConfig.brandName}</p>
                <p className="text-[11px] text-slate-500">{platformConfig.brandSubtitle}</p>
              </div>
            </div>

            <div className="text-center md:text-right text-[11px] text-slate-500 space-y-1">
              <p>{platformConfig.copyrightText || `جميع الحقوق محفوظة © ${new Date().getFullYear()} لشركة ${platformConfig.companyName}`}</p>
              <p className="text-slate-600">{platformConfig.companyName} | مؤسس المنصة: {platformConfig.founderName}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              {platformConfig.supportEmail && (
                <a href={`mailto:${platformConfig.supportEmail}`} className="text-slate-400 hover:text-teal-400 transition">
                  الدعم الفني
                </a>
              )}
              {platformConfig.whatsappNumber && (
                <a 
                  href={`https://wa.me/${platformConfig.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-emerald-400 transition"
                >
                  واتساب
                </a>
              )}
            </div>
          </div>
        </footer>
      )}

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
              currentUser={currentUser}
              userRole={userRole}
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
