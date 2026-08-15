import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, BookOpen, Star, Sparkles, ExternalLink, Play, HelpCircle,
  Plus, Shield, Eye, EyeOff, Trash2, Layers, GraduationCap, Calendar, Edit3, Tag,
  ShoppingCart, CheckCircle2, Bookmark, Flame, Radio, Zap, Clock, Award, Heart, TrendingUp
} from 'lucide-react';
import { MarketplaceBook, BookCategory, UserRole } from '../types';
import { EditBookModal, SUBCATEGORIES, GRADE_LEVELS, SEMESTERS, ACADEMIC_YEARS } from './EditBookModal';
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [hasQuizFilter, setHasQuizFilter] = useState(false);
  const [hasMediaFilter, setHasMediaFilter] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  
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

      if (selectedCategory !== 'all' && book.category !== selectedCategory) return false;
      
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
    selectedCategory, selectedSubcategory, selectedGradeLevel,
    selectedSemester, selectedAcademicYear, selectedTag, costFilter, minRating,
    hasQuizFilter, searchQuery, sortBy
  ]);

  const handleResetFilters = () => {
    setQuickFilter('all');
    setSelectedCategory('all');
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-7 sm:p-10 border border-indigo-900/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-black backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المنصة الأولى عربياً للكتب الرقمية والمقررات التفاعلية بالـ AI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              تعلم أسرع، استمع بذكاء، واختبر فهمك فورياً 🎧📖
            </h1>

            <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed font-medium">
              حوّل أي كتاب أو مذكرة إلى تجربة تعليمية متعددة الحواس: بودكاست حواري ذكي، تسجيلات صوتية فائقة الوضوح، خرائط مفاهيم تفاعلية، وامتحانات تجريبية موقوتة بشهادات إنجاز.
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-bold text-indigo-100">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>بودكاست كريم وفرح</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>امتحانات موقوتة</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>توليد فوري بالـ AI</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                <Award className="w-3.5 h-3.5 text-blue-400" />
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
                  className="px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد كتاب جديد بالـ AI</span>
                </button>

                <button
                  onClick={onOpenExternalModal}
                  className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-2xl flex items-center gap-2 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>إضافة رابط خارجي</span>
                </button>
              </div>
            )}

            {/* LIVE PLATFORM STATS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md">
              <div className="p-2">
                <span className="text-lg font-black text-white block">+{books.length}</span>
                <span className="text-[10px] text-indigo-300 font-bold">مقرر تفاعلي</span>
              </div>
              <div className="p-2 border-r border-l border-white/10">
                <span className="text-lg font-black text-amber-300 block">5.0 ★</span>
                <span className="text-[10px] text-indigo-300 font-bold">تقييم الطلاب</span>
              </div>
              <div className="p-2">
                <span className="text-lg font-black text-emerald-400 block">0ms</span>
                <span className="text-[10px] text-indigo-300 font-bold">استجابة الصوت</span>
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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>متجر المقررات والكتب (Marketplace)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${mainViewTab === 'marketplace' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {books.length}
            </span>
          </button>

          <button
            onClick={() => setMainViewTab('my_library')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition ${
              mainViewTab === 'my_library'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>مقرراتي ومكتبتي الخاصة (My Courses)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${mainViewTab === 'my_library' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* RIGHT SIDEBAR FILTERS */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-5 space-y-5 shadow-sm sticky top-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              تصفية الكتب والأبحاث
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-gray-500 hover:text-indigo-600 font-bold"
            >
              إعادة ضبط
            </button>
          </div>

          {/* ACADEMIC & LIBRARY DEPARTMENTS */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              أقسام المكتبة والمقررات
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'جميع المحتويات', count: books.length },
                { id: 'digital_book', label: 'مناهج ومقررات دراسية', count: books.filter(b => b.category === 'digital_book' || b.track === 'academic').length },
                { id: 'self_help', label: 'تطوير الذات والقيادة', count: books.filter(b => b.category === 'self_help' || b.track === 'self_help').length },
                { id: 'business', label: 'المالية والأعمال والاستثمار', count: books.filter(b => b.category === 'business' || b.track === 'business_finance').length },
                { id: 'technology', label: 'البرمجة والذكاء الاصطناعي', count: books.filter(b => b.category === 'technology' || b.track === 'programming_tech').length },
                { id: 'classics', label: 'روايات وكتب فكرية', count: books.filter(b => b.category === 'classics' || b.track === 'general_literature').length },
                { id: 'quiz_bank', label: 'بنوك أسئلة وامتحانات', count: books.filter(b => b.category === 'quiz_bank').length },
                { id: 'training_kit', label: 'حقائب تدريبية تفاعلية', count: books.filter(b => b.category === 'training_kit').length }
              ].map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedCategory(dept.id as BookCategory)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-right flex items-center justify-between transition ${
                    selectedCategory === dept.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{dept.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedCategory === dept.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {dept.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SUBCATEGORY FILTER */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">المادة / التخصص الفرعي</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كل التخصصات والمواد</option>
              {Array.from(new Set([...SUBCATEGORIES, 'الرياضيات والإحصاء', 'الفيزياء والكيمياء والعلوم', 'اللغة العربية والنحو', 'اللغة الإنجليزية والترجمة', 'التاريخ والجغرافيا', 'الأحياء والجيولوجيا'])).map((s) => (
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
              {GRADE_LEVELS.map((g) => (
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
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان، المادة (مثل: كيمياء)، اسم الدكتور، الصف الدراسي، الوسوم..."
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
                المعروض: <span className="text-indigo-600 font-black">{filteredBooks.length}</span> من {books.length}
              </span>

              {/* SORT DROPDOWN (Default: Newest first) */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-black focus:outline-none focus:border-indigo-500"
              >
                <option value="newest">📅 الأحدث إضافة (من الأحدث للأقدم)</option>
                <option value="oldest">⌛ الأقدم إضافة (من الأقدم للأحدث)</option>
                <option value="popular">🔥 الأكثر شعبية وزيارة</option>
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
                                  className="py-2.5 bg-white hover:bg-gray-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>التفاصيل والشرح</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={book.external_url}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح الرابط</span>
                              </a>

                              <button
                                onClick={() => onLaunchBook(book)}
                                className="py-2.5 bg-white hover:bg-gray-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>صفحة المقرر</span>
                              </button>
                            </div>
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
                                className="py-2.5 bg-white hover:bg-gray-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>معاينة مجانية</span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => onLaunchBook(book)}
                              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isPurchased && !isFree ? 'متابعة القراءة' : 'تشغيل الكتاب'}</span>
                            </button>

                            <button
                              onClick={() => onLaunchQuiz(book)}
                              className="py-2.5 bg-white hover:bg-gray-50 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
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
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
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
