import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, BookOpen, Star, Sparkles, ExternalLink, Play, HelpCircle,
  Plus, Shield, Eye, EyeOff, Trash2, Layers, GraduationCap, Calendar, Edit3, Tag,
  ShoppingCart, CheckCircle2, Bookmark, Flame, Radio, Zap, Clock, Award, Heart, TrendingUp, School, Building2, X
} from 'lucide-react';
import { MarketplaceBook, BookCategory, UserRole } from '../types';
import { EditBookModal } from './EditBookModal';
import { 
  MAIN_CATEGORIES, 
  EDUCATION_LEVELS, 
  ACADEMIC_SYSTEMS, 
  ACADEMIC_SUBJECTS, 
  GENERAL_SUBJECTS, 
  SEMESTERS, 
  ACADEMIC_YEARS, 
  getGradesForSystem 
} from '../constants/taxonomy';
import { PurchaseModal } from './PurchaseModal';

interface MarketplaceViewProps {
  books: MarketplaceBook[];
  userRole: UserRole;
  isAdminMode: boolean;
  purchasedBookIds?: string[];
  onLaunchBook: (book: MarketplaceBook) => void;
  onLaunchQuiz: (book: MarketplaceBook) => void;
  onOpenCreateModal: () => void;
  onOpenExternalModal: () => void;
  onTogglePublish: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onUpdateBook?: (updatedBook: MarketplaceBook) => Promise<void>;
  onPurchaseBook?: (book: MarketplaceBook) => Promise<void>;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  books,
  userRole,
  isAdminMode,
  purchasedBookIds = [],
  onLaunchBook,
  onLaunchQuiz,
  onOpenCreateModal,
  onOpenExternalModal,
  onTogglePublish,
  onDeleteBook,
  onUpdateBook,
  onPurchaseBook
}) => {
  const [mainViewTab, setMainViewTab] = useState<'marketplace' | 'my_library'>('marketplace');
  const [quickFilter, setQuickFilter] = useState<'all' | 'bestsellers' | 'trending' | 'top_rated' | 'favorites' | 'read_later' | 'free' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('all');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  const [selectedAcademicSystem, setSelectedAcademicSystem] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [hasQuizFilter, setHasQuizFilter] = useState(false);
  const [hasMediaFilter, setHasMediaFilter] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // DEFAULT SORTING: Newest to Oldest (من الأحدث للأقدم)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'rating'>('newest');

  // Favorites & Read Later States (saved to localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readLater, setReadLater] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('read_later_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(bookId)
      ? favorites.filter(id => id !== bookId)
      : [...favorites, bookId];
    setFavorites(updated);
    localStorage.setItem('favorite_book_ids', JSON.stringify(updated));
  };

  const toggleReadLater = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = readLater.includes(bookId)
      ? readLater.filter(id => id !== bookId)
      : [...readLater, bookId];
    setReadLater(updated);
    localStorage.setItem('read_later_book_ids', JSON.stringify(updated));
  };

  // Edit & Purchase Modal States
  const [editingBook, setEditingBook] = useState<MarketplaceBook | null>(null);
  const [purchasingBook, setPurchasingBook] = useState<MarketplaceBook | null>(null);

  // Extract all clean tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      b.tags?.forEach(t => {
        if (!t.includes(':')) set.add(t);
      });
    });
    return Array.from(set);
  }, [books]);

  // My Library Books list
  const myLibraryBooks = useMemo(() => {
    return books.filter(b => {
      if (isAdminMode) return true;
      const isPurchased = purchasedBookIds.includes(b.id);
      const isFree = !b.price || b.price === 0;
      return isPurchased || isFree;
    });
  }, [books, purchasedBookIds, isAdminMode]);

  // Comprehensive multi-criteria filtering and sorting
  const filteredBooks = useMemo(() => {
    const sourceList = mainViewTab === 'my_library' ? myLibraryBooks : books;

    let result = sourceList.filter(book => {
      if (!isAdminMode && !book.is_published) return false;
      
      // Quick Filter Check
      if (quickFilter === 'favorites' && !favorites.includes(book.id)) return false;
      if (quickFilter === 'read_later' && !readLater.includes(book.id)) return false;
      if (quickFilter === 'free' && book.price && book.price > 0) return false;
      if (quickFilter === 'paid' && (!book.price || book.price === 0)) return false;

      // Category filter (support 10 main categories and legacy aliases)
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'academic_curriculum') {
          const isAcad = book.category === 'academic_curriculum' || book.category === 'digital_book' || book.track === 'academic';
          if (!isAcad) return false;
        } else if (selectedCategory === 'programming_ai') {
          const isProg = book.category === 'programming_ai' || book.category === 'technology' || book.track === 'programming_tech';
          if (!isProg) return false;
        } else if (selectedCategory === 'self_help') {
          const isSelf = book.category === 'self_help' || book.track === 'self_help';
          if (!isSelf) return false;
        } else if (selectedCategory === 'business_marketing') {
          const isBiz = book.category === 'business_marketing' || book.category === 'business' || book.track === 'business_finance';
          if (!isBiz) return false;
        } else if (selectedCategory === 'languages_translation') {
          const isLang = book.category === 'languages_translation' || book.track === 'languages';
          if (!isLang) return false;
        } else if (selectedCategory === 'literature_novels') {
          const isLit = book.category === 'literature_novels' || book.category === 'classics' || book.track === 'general_literature';
          if (!isLit) return false;
        } else if (selectedCategory === 'training_packages') {
          const isKit = book.category === 'training_packages' || book.category === 'training_kit';
          if (!isKit) return false;
        } else {
          if (book.category !== selectedCategory) return false;
        }
      }

      // Education Level filter
      if (selectedEducationLevel !== 'all') {
        const matchesEdu = book.education_level === selectedEducationLevel || book.tags?.includes(`edu_level:${selectedEducationLevel}`);
        if (!matchesEdu) return false;
      }

      // Academic System filter
      if (selectedAcademicSystem !== 'all') {
        const matchesSys = book.academic_system === selectedAcademicSystem || book.tags?.includes(`system:${selectedAcademicSystem}`);
        if (!matchesSys) return false;
      }
      
      // Subcategory filter (checks direct prop or tag)
      if (selectedSubcategory !== 'all') {
        const hasSub = book.subcategory === selectedSubcategory || book.tags?.includes(`sub:${selectedSubcategory}`);
        if (!hasSub) return false;
      }

      // Grade Level filter
      if (selectedGradeLevel !== 'all') {
        const hasGrade = book.grade_level === selectedGradeLevel || book.tags?.includes(`grade:${selectedGradeLevel}`);
        if (!hasGrade) return false;
      }

      // Semester filter
      if (selectedSemester !== 'all') {
        const hasSem = book.semester === selectedSemester || book.tags?.includes(`term:${selectedSemester}`);
        if (!hasSem) return false;
      }

      // Academic Year filter
      if (selectedAcademicYear !== 'all') {
        const hasYear = book.academic_year === selectedAcademicYear || book.tags?.includes(`year:${selectedAcademicYear}`);
        if (!hasYear) return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && (!book.tags || !book.tags.includes(selectedTag))) {
        return false;
      }

      // Cost filter (free vs paid)
      if (costFilter === 'free' && book.price && book.price > 0) return false;
      if (costFilter === 'paid' && (!book.price || book.price === 0)) return false;

      // Quiz and Media filters
      if (hasQuizFilter && (!book.question_bank || book.question_bank.length === 0)) return false;
      if (hasMediaFilter && (!book.chapters || !book.chapters.some(c => c.videos && c.videos.length > 0))) return false;

      // Rating filter
      if (minRating > 0 && (book.rating || 0) < minRating) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = book.title?.toLowerCase().includes(q);
        const inDesc = book.description?.toLowerCase().includes(q);
        const inAuthor = book.author_name?.toLowerCase().includes(q);
        const inTags = book.tags?.some(t => t.toLowerCase().includes(q));
        const inSub = book.subcategory?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inAuthor && !inTags && !inSub) return false;
      }

      return true;
    });

    // Quick Filter Sortings or Standard Sort
    if (quickFilter === 'bestsellers') {
      result.sort((a, b) => (b.sales_count || b.reviews_count || 0) - (a.sales_count || a.reviews_count || 0));
    } else if (quickFilter === 'trending') {
      result.sort((a, b) => ((b.rating || 5) * (b.reviews_count || 1)) - ((a.rating || 5) * (a.reviews_count || 1)));
    } else if (quickFilter === 'top_rated') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || a.createdAt || 0).getTime() - new Date(b.created_at || b.createdAt || 0).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [
    books, myLibraryBooks, mainViewTab, quickFilter, favorites, readLater, isAdminMode,
    selectedCategory, selectedEducationLevel, selectedAcademicSystem, selectedSubcategory, selectedGradeLevel,
    selectedSemester, selectedAcademicYear, selectedTag, costFilter, minRating,
    hasQuizFilter, searchQuery, sortBy
  ]);

  const handleResetFilters = () => {
    setQuickFilter('all');
    setSelectedCategory('all');
    setSelectedEducationLevel('all');
    setSelectedAcademicSystem('all');
    setSelectedSubcategory('all');
    setSelectedGradeLevel('all');
    setSelectedSemester('all');
    setSelectedAcademicYear('all');
    setSelectedTag('all');
    setCostFilter('all');
    setHasQuizFilter(false);
    setHasMediaFilter(false);
    setMinRating(0);
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* 🌟 MARKETING HERO & CALL TO ACTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 text-white p-7 sm:p-10 border border-teal-900/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-teal-300 text-xs font-black backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المنصة الأولى عربياً للكتب والمقررات التفاعلية بالذكاء الاصطناعي</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              تعلم أسرع، استمع بذكاء، واختبر فهمك فورياً 🎧📖
            </h1>

            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-medium">
              حوّل أي كتاب أو مذكرة إلى تجربة تعليمية متعددة الحواس: بودكاست حواري ذكي (كريم وفرح)، تسجيلات صوتية فائقة الوضوح، خرائط مفاهيم تفاعلية، وامتحانات تجريبية موقوتة.
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-bold text-teal-100">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Radio className="w-3.5 h-3.5 text-teal-300" />
                <span>بودكاست كريم وفرح</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>امتحانات موقوتة</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Zap className="w-3.5 h-3.5 text-emerald-300" />
                <span>توليد فوري بالـ AI</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Award className="w-3.5 h-3.5 text-cyan-300" />
                <span>شهادات إنجاز معتمدة</span>
              </div>
            </div>
          </div>

          {/* ADMIN & STATS PANEL */}
          <div className="flex flex-col gap-4 shrink-0 w-full lg:w-auto">
            {isAdminMode && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenCreateModal}
                  className="px-5 py-3.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-500/25 transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد كتاب جديد بالـ AI</span>
                </button>

                <button
                  onClick={onOpenExternalModal}
                  className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-2xl flex items-center gap-2 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>إضافة مقرر تفاعلي مدمج</span>
                </button>
              </div>
            )}

            {/* LIVE PLATFORM STATS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md">
              <div className="p-2">
                <span className="text-lg font-black text-white block">+{books.length}</span>
                <span className="text-[10px] text-teal-300 font-bold">مقرر تفاعلي</span>
              </div>
              <div className="p-2 border-r border-l border-white/10">
                <span className="text-lg font-black text-amber-300 block">5.0 ★</span>
                <span className="text-[10px] text-teal-300 font-bold">تقييم الطلاب</span>
              </div>
              <div className="p-2">
                <span className="text-lg font-black text-emerald-400 block">0ms</span>
                <span className="text-[10px] text-teal-300 font-bold">استجابة الصوت</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 MASTER TABS SWITCHER (المتجر العام vs مكتبتي الخاصة) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMainViewTab('marketplace')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition ${
              mainViewTab === 'marketplace'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>متجر المقررات والكتب (Marketplace)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${mainViewTab === 'marketplace' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {books.length}
            </span>
          </button>

          <button
            onClick={() => setMainViewTab('my_library')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition ${
              mainViewTab === 'my_library'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>مقرراتي ومكتبتي الخاصة (My Courses)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${mainViewTab === 'my_library' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {myLibraryBooks.length}
            </span>
          </button>
        </div>

        {mainViewTab === 'my_library' && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>جميع المقررات المملوكة والمجانية متاحة للقراءة الفورية</span>
          </span>
        )}
      </div>

      {/* 🔥 QUICK FILTER & DISCOVERY BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: '🌟 كل المحتويات', icon: null },
          { id: 'trending', label: '⚡ الكتب الرائجة (Trending)', icon: TrendingUp },
          { id: 'bestsellers', label: '🔥 الأكثر مبيعاً (Best Sellers)', icon: Flame },
          { id: 'top_rated', label: '🏆 الأعلى تقييماً (Top Rated)', icon: Star },
          { id: 'favorites', label: `❤️ المفضلة (${favorites.length})`, icon: Heart },
          { id: 'read_later', label: `🔖 القراءة لاحقاً (${readLater.length})`, icon: Bookmark },
          { id: 'free', label: '🆓 مجانية بالكامل', icon: null },
          { id: 'paid', label: '💎 مقررات مدفوعة', icon: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setQuickFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              quickFilter === tab.id
                ? 'bg-slate-900 text-white shadow-sm font-black scale-[1.02]'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* MOBILE HORIZONTAL CATEGORY SWIPER */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-gray-700'
          }`}
        >
          الكل ({books.length})
        </button>
        {MAIN_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as BookCategory)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP RIGHT SIDEBAR FILTERS */}
        <div className="hidden lg:block lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-5 space-y-5 shadow-sm sticky top-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              تصفية الكتب والأبحاث
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-gray-500 hover:text-indigo-600 font-bold"
            >
              إعادة ضبط
            </button>
          </div>

          {/* ACADEMIC & LIBRARY DEPARTMENTS (10 MAIN CATEGORIES) */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                أقسام المكتبة والمقررات
              </span>
              <span className="text-[10px] text-gray-400 font-bold">10 أقسام</span>
            </label>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              <button
                key="all"
                onClick={() => setSelectedCategory('all')}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-right flex items-center justify-between transition ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>جميع المحتويات</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedCategory === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {books.length}
                </span>
              </button>

              {MAIN_CATEGORIES.map(dept => {
                const count = books.filter(b => {
                  if (dept.id === 'academic_curriculum') {
                    return b.category === 'academic_curriculum' || b.category === 'digital_book' || b.track === 'academic';
                  }
                  if (dept.id === 'programming_ai') {
                    return b.category === 'programming_ai' || b.category === 'technology' || b.track === 'programming_tech';
                  }
                  if (dept.id === 'self_help') {
                    return b.category === 'self_help' || b.track === 'self_help';
                  }
                  if (dept.id === 'business_marketing') {
                    return b.category === 'business_marketing' || b.category === 'business' || b.track === 'business_finance';
                  }
                  if (dept.id === 'languages_translation') {
                    return b.category === 'languages_translation' || b.track === 'languages';
                  }
                  if (dept.id === 'literature_novels') {
                    return b.category === 'literature_novels' || b.category === 'classics' || b.track === 'general_literature';
                  }
                  if (dept.id === 'training_packages') {
                    return b.category === 'training_packages' || b.category === 'training_kit';
                  }
                  return b.category === dept.id;
                }).length;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedCategory(dept.id as BookCategory)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-right flex items-center justify-between transition ${
                      selectedCategory === dept.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{dept.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 mr-1.5 ${selectedCategory === dept.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EDUCATION LEVEL & ACADEMIC SYSTEM FILTERS (When in Academic or All) */}
          {(selectedCategory === 'all' || selectedCategory === 'academic_curriculum') && (
            <>
              {/* EDUCATION LEVEL */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  المرحلة التعليمية
                </label>
                <select
                  value={selectedEducationLevel}
                  onChange={(e) => {
                    setSelectedEducationLevel(e.target.value);
                    if (e.target.value === 'all') setSelectedAcademicSystem('all');
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل المراحل (قبل جامعي وجامعي)</option>
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                  ))}
                </select>
              </div>

              {/* ACADEMIC SYSTEM (If pre-university selected or all) */}
              {selectedEducationLevel === 'pre_university' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-black text-gray-700">مسار ونظام التعليم</label>
                  <select
                    value={selectedAcademicSystem}
                    onChange={(e) => setSelectedAcademicSystem(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">كل المسارات (عربي / لغات / دولي / فني)</option>
                    {ACADEMIC_SYSTEMS.map((sys) => (
                      <option key={sys.id} value={sys.id}>{sys.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* SUBCATEGORY / SUBJECT FILTER */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">المادة / التخصص الفرعي</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كل التخصصات والمواد</option>
              {Array.from(new Set([...ACADEMIC_SUBJECTS, ...GENERAL_SUBJECTS])).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* GRADE LEVEL FILTER */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              الصف / المرحلة الدراسية
            </label>
            <select
              value={selectedGradeLevel}
              onChange={(e) => setSelectedGradeLevel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">جميع المراحل والصفوف</option>
              {getGradesForSystem(
                selectedEducationLevel === 'university' ? 'university' : 'pre_university', 
                selectedAcademicSystem !== 'all' ? selectedAcademicSystem : 'general_arabic'
              ).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* SEMESTER FILTER */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              الفصل الدراسي
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">جميع الفصول الدراسية</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* ACADEMIC YEAR FILTER */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">السنة الدراسية</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كل السنوات</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* COST FILTER */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">تكلفة المقرر</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-200">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'free', label: 'مجاني' },
                { id: 'paid', label: 'مدفوع' }
              ].map(cost => (
                <button
                  key={cost.id}
                  onClick={() => setCostFilter(cost.id as any)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                    costFilter === cost.id ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {cost.label}
                </button>
              ))}
            </div>
          </div>

          {/* SPECIALTIES & TAGS */}
          {allTags.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                الوسوم والهاشتاجات
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    selectedTag === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  الكل
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LEFT COLUMN: SEARCH BAR + BOOK CARDS GRID */}
        <div className="lg:col-span-3 space-y-6">
          {/* SEARCH & SORT HEADER */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالعنوان، المادة، اسم الدكتور، الصف الدراسي..."
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
              </div>

              {/* MOBILE FILTER TRIGGER BUTTON */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-3.5 py-2.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0"
              >
                <Filter className="w-4 h-4 text-teal-600" />
                <span>تصفية</span>
                {((selectedCategory !== 'all' ? 1 : 0) + (selectedEducationLevel !== 'all' ? 1 : 0) + (selectedAcademicSystem !== 'all' ? 1 : 0) + (selectedSubcategory !== 'all' ? 1 : 0) + (selectedGradeLevel !== 'all' ? 1 : 0) + (costFilter !== 'all' ? 1 : 0)) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {(selectedCategory !== 'all' ? 1 : 0) + (selectedEducationLevel !== 'all' ? 1 : 0) + (selectedAcademicSystem !== 'all' ? 1 : 0) + (selectedSubcategory !== 'all' ? 1 : 0) + (selectedGradeLevel !== 'all' ? 1 : 0) + (costFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 w-full justify-between border-t border-gray-100 pt-2.5">
              <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
                المعروض: <span className="text-teal-600 font-black">{filteredBooks.length}</span> من {books.length}
              </span>

              {/* SORT DROPDOWN (Default: Newest first) */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-black focus:outline-none focus:border-teal-500"
              >
                <option value="newest">📅 الأحدث إضافة</option>
                <option value="oldest">⌛ الأقدم إضافة</option>
                <option value="popular">🔥 الأكثر شعبية</option>
                <option value="rating">⭐ الأعلى تقييماً</option>
              </select>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredBooks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
              <BookOpen className="w-14 h-14 text-indigo-200 mx-auto" />
              <h3 className="text-lg font-black text-gray-900">لا توجد كتب أو مقررات مطابقة للبحث أو التصفية</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {books.length === 0 
                  ? 'قاعدة البيانات فارغة حالياً. يمكنك توليد كتاب جديد بالذكاء الاصطناعي الآن عبر زر "توليد كتاب بالـ AI".'
                  : 'جرب تغيير معايير التصفية أو اضغط على "إعادة ضبط" لعرض كافة المقررات.'}
              </p>
              {books.length === 0 && isAdminMode && (
                <button
                  onClick={onOpenCreateModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد أول مقرر بالذكاء الاصطناعي</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 ${
                    !book.is_published ? 'opacity-60 border-dashed border-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div>
                    {/* THUMBNAIL */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden group">
                      <img
                        src={book.thumbnail_url || "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80"}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent opacity-80" />

                      {/* TOP LEFT: FAVORITES & READ LATER BUTTONS */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(book.id, e)}
                          title={favorites.includes(book.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                          className={`p-2 rounded-xl backdrop-blur-md transition shadow-sm ${
                            favorites.includes(book.id)
                              ? 'bg-rose-500 text-white shadow-rose-200'
                              : 'bg-white/90 text-gray-700 hover:text-rose-600 hover:bg-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.includes(book.id) ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => toggleReadLater(book.id, e)}
                          title={readLater.includes(book.id) ? "إزالة من القراءة لاحقاً" : "حفظ للقراءة لاحقاً"}
                          className={`p-2 rounded-xl backdrop-blur-md transition shadow-sm ${
                            readLater.includes(book.id)
                              ? 'bg-indigo-600 text-white shadow-indigo-200'
                              : 'bg-white/90 text-gray-700 hover:text-indigo-600 hover:bg-white'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${readLater.includes(book.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* TOP RIGHT: PRICE & EXTERNAL BADGES */}
                      <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5">
                        {!book.price || book.price === 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[10px] rounded-lg shadow-sm">
                            مجاني
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-400 text-amber-950 font-black text-[10px] rounded-lg shadow-sm">
                            {book.price} ج.م
                          </span>
                        )}

                        {book.is_external && (
                          <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            رابط خارجي
                          </span>
                        )}
                      </div>

                      {/* RATING */}
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 text-[11px] font-bold text-amber-600 shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{book.rating || 5.0}</span>
                        <span className="text-gray-500 text-[10px]">({book.reviews_count || 120})</span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600">
                        <span className="bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                          {book.category === 'digital_book' ? 'كتاب رقمي' : book.category === 'quiz_bank' ? 'بنك أسئلة' : 'مقرر تفاعلي'}
                        </span>
                        <span className="text-gray-500">{book.author_name}</span>
                      </div>

                      <h3 className="font-black text-gray-900 text-base leading-snug line-clamp-2 hover:text-indigo-600 transition">
                        {book.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {book.description || "كتاب تفاعلي يتضمن شروحات، خريطة ذهنية، وبنك أسئلة مدمج."}
                      </p>

                      {/* ACADEMIC METADATA PILLS */}
                      {(book.grade_level || book.semester || book.subcategory) && (
                        <div className="flex flex-wrap gap-1 text-[10px] font-bold text-gray-600 pt-1">
                          {book.grade_level && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {book.grade_level}
                            </span>
                          )}
                          {book.semester && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {book.semester}
                            </span>
                          )}
                          {book.subcategory && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {book.subcategory}
                            </span>
                          )}
                        </div>
                      )}

                      {/* TAGS */}
                      <div className="flex flex-wrap gap-1">
                        {book.tags?.filter(t => !t.includes(':')).slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-semibold rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS & MONETIZATION */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                      {(() => {
                        const isPurchased = purchasedBookIds.includes(book.id);
                        const isFree = !book.price || book.price === 0;
                        const isUnlocked = isFree || isPurchased || isAdminMode;

                        if (book.is_external) {
                          if (!isUnlocked) {
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setPurchasingBook(book)}
                                  className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shadow-amber-200"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>شراء ({book.price} ج.م)</span>
                                </button>

                                <button
                                  onClick={() => onLaunchBook(book)}
                                  className="py-2.5 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                                  <span>معاينة وتفاصيل</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              onClick={() => onLaunchBook(book)}
                              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shadow-teal-500/20"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>فتح المقرر التفاعلي 🔒</span>
                            </button>
                          );
                        }

                        if (!isUnlocked) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setPurchasingBook(book)}
                                className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shadow-amber-200"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>شراء ({book.price} ج.م)</span>
                              </button>

                              <button
                                onClick={() => onLaunchBook(book)}
                                className="py-2.5 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                                <span>معاينة مجانية</span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => onLaunchBook(book)}
                              className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isPurchased && !isFree ? 'متابعة القراءة' : 'تشغيل الكتاب'}</span>
                            </button>

                            <button
                              onClick={() => onLaunchQuiz(book)}
                              className="py-2.5 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>الاختبار التفاعلي</span>
                            </button>
                          </div>
                        );
                      })()}

                      {isAdminMode && (
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-[11px]">
                          <button
                            onClick={() => setEditingBook(book)}
                            className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل المقرر</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onTogglePublish(book.id)}
                              className="flex items-center gap-1 text-gray-500 hover:text-gray-900"
                            >
                              {book.is_published ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                  <span>إخفاء</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>إظهار</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onDeleteBook(book.id)}
                              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER MODAL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-xs p-0 sm:p-4" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <span>تصفية الكتب والمقررات</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-teal-600 font-bold hover:underline"
                >
                  إعادة ضبط
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">القسم الرئيسي</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BookCategory)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">جميع الأقسام ({books.length})</option>
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* EDUCATION LEVEL */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">المرحلة التعليمية</label>
              <select
                value={selectedEducationLevel}
                onChange={(e) => {
                  setSelectedEducationLevel(e.target.value);
                  if (e.target.value === 'all') setSelectedAcademicSystem('all');
                }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">كل المراحل</option>
                {EDUCATION_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                ))}
              </select>
            </div>

            {/* SYSTEM */}
            {selectedEducationLevel === 'pre_university' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700">مسار ونظام التعليم</label>
                <select
                  value={selectedAcademicSystem}
                  onChange={(e) => setSelectedAcademicSystem(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="all">كل المسارات</option>
                  {ACADEMIC_SYSTEMS.map(sys => (
                    <option key={sys.id} value={sys.id}>{sys.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* GRADE */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">الصف الدراسي</label>
              <select
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">جميع الصفوف</option>
                {getGradesForSystem(
                  selectedEducationLevel === 'university' ? 'university' : 'pre_university',
                  selectedAcademicSystem !== 'all' ? selectedAcademicSystem : 'general_arabic'
                ).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY / SUBJECT */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">المادة / التخصص</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">كل المواد والتخصصات</option>
                {Array.from(new Set([...ACADEMIC_SUBJECTS, ...GENERAL_SUBJECTS])).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* COST */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">التكلفة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'free', label: 'مجاني' },
                  { id: 'paid', label: 'مدفوع' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCostFilter(c.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      costFilter === c.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* APPLY ACTION */}
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md shadow-teal-600/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>عرض النتائج ({filteredBooks.length} مقرر)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOK MODAL */}
      {editingBook && onUpdateBook && (
        <EditBookModal
          isOpen={!!editingBook}
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={onUpdateBook}
        />
      )}

      {/* PURCHASE MODAL */}
      {purchasingBook && onPurchaseBook && (
        <PurchaseModal
          isOpen={!!purchasingBook}
          book={purchasingBook}
          onClose={() => setPurchasingBook(null)}
          onConfirmPurchase={onPurchaseBook}
        />
      )}
    </div>
  );
};
