import React, { useState, useMemo } from 'react';
import {
  Search, Filter, BookOpen, Star, Sparkles, ExternalLink, Play, HelpCircle,
  Plus, Shield, Eye, EyeOff, Trash2, Layers, GraduationCap, Calendar, Edit3, Tag
} from 'lucide-react';
import { MarketplaceBook, BookCategory, UserRole } from '../types';
import { EditBookModal, SUBCATEGORIES, GRADE_LEVELS, SEMESTERS, ACADEMIC_YEARS } from './EditBookModal';

interface MarketplaceViewProps {
  books: MarketplaceBook[];
  userRole: UserRole;
  isAdminMode: boolean;
  onLaunchBook: (book: MarketplaceBook) => void;
  onLaunchQuiz: (book: MarketplaceBook) => void;
  onOpenCreateModal: () => void;
  onOpenExternalModal: () => void;
  onTogglePublish: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onUpdateBook?: (updatedBook: MarketplaceBook) => Promise<void>;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  books,
  userRole,
  isAdminMode,
  onLaunchBook,
  onLaunchQuiz,
  onOpenCreateModal,
  onOpenExternalModal,
  onTogglePublish,
  onDeleteBook,
  onUpdateBook
}) => {
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

  // Edit Modal State
  const [editingBook, setEditingBook] = useState<MarketplaceBook | null>(null);

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

  // Comprehensive multi-criteria filtering and sorting
  const filteredBooks = useMemo(() => {
    let result = books.filter(book => {
      if (!isAdminMode && !book.is_published) return false;
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
      if (selectedTag !== 'all' && !book.tags?.includes(selectedTag)) return false;
      if (costFilter === 'free' && book.price > 0) return false;
      if (costFilter === 'paid' && book.price === 0) return false;
      if (minRating > 0 && (book.rating || 5) < minRating) return false;
      if (hasQuizFilter && (!book.question_bank || book.question_bank.length === 0)) return false;

      // Text search in title, author, description, tags, and subcategory
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = book.title?.toLowerCase().includes(q);
        const authorMatch = book.author_name?.toLowerCase().includes(q);
        const descMatch = book.description?.toLowerCase().includes(q);
        const subMatch = book.subcategory?.toLowerCase().includes(q);
        const gradeMatch = book.grade_level?.toLowerCase().includes(q);
        const tagMatch = book.tags?.some(t => t.toLowerCase().includes(q));
        if (!titleMatch && !authorMatch && !descMatch && !tagMatch && !subMatch && !gradeMatch) return false;
      }
      return true;
    });

    // Apply Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt!).getTime() : 0;
        const dateB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt!).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const dateA = a.created_at || a.createdAt ? new Date(a.created_at || a.createdAt!).getTime() : 0;
        const dateB = b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt!).getTime() : 0;
        return dateA - dateB; // Oldest first
      });
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [
    books, isAdminMode, selectedCategory, selectedSubcategory, selectedGradeLevel,
    selectedSemester, selectedAcademicYear, selectedTag, costFilter, minRating,
    hasQuizFilter, searchQuery, sortBy
  ]);

  const handleResetFilters = () => {
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
      {/* BANNER HEADER */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                المكتبة الرقمية والمقررات الأكاديمية
              </span>
              {isAdminMode && (
                <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  وضع المسؤول والإدارة مفعّل
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              المكتبة الرقمية والمقررات الأكاديمية والمحتوى التفاعلي
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              تشغيل الكتب التفاعلية، استعراض السجلات، حل بنوك الأسئلة، واستمع للبودكاست الأكاديمي الذكي الموثق من المراجع الأصلية.
            </p>
          </div>

          {isAdminMode && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 shadow-indigo-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>توليد كتاب بالـ AI</span>
              </button>

              <button
                onClick={onOpenExternalModal}
                className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>إضافة رابط خارجي</span>
              </button>
            </div>
          )}
        </div>
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

                      {/* BADGES */}
                      <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5">
                        {book.price === 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[10px] rounded-lg shadow-sm">
                            مجاني
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 font-black text-[10px] rounded-lg shadow-sm">
                            ${book.price}
                          </span>
                        )}

                        {book.is_external && (
                          <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            رابط مباشر
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

                  {/* BUTTONS */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                      {book.is_external ? (
                        <a
                          href={book.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm border border-indigo-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>فتح الرابط الخارجي</span>
                        </a>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onLaunchBook(book)}
                            className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>تشغيل الكتاب</span>
                          </button>

                          <button
                            onClick={() => onLaunchQuiz(book)}
                            className="py-2.5 bg-white hover:bg-gray-50 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>الاختبار التفاعلي</span>
                          </button>
                        </div>
                      )}

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
    </div>
  );
};
