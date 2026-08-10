import React, { useState, useMemo } from 'react';
import {
  Search, Filter, BookOpen, Star, Sparkles, ExternalLink, Play, HelpCircle,
  Plus, Shield, Eye, EyeOff, Trash2, Layers, GraduationCap
} from 'lucide-react';
import { MarketplaceBook, BookCategory, UserRole } from '../types';

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
  onDeleteBook
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [hasQuizFilter, setHasQuizFilter] = useState(false);
  const [hasMediaFilter, setHasMediaFilter] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => b.tags?.forEach(t => set.add(t)));
    return Array.from(set);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (!isAdminMode && !book.is_published) return false;
      if (selectedCategory !== 'all' && book.category !== selectedCategory) return false;
      if (selectedTag !== 'all' && !book.tags?.includes(selectedTag)) return false;
      if (costFilter === 'free' && book.price > 0) return false;
      if (costFilter === 'paid' && book.price === 0) return false;
      if (minRating > 0 && (book.rating || 5) < minRating) return false;
      if (hasQuizFilter && (!book.question_bank || book.question_bank.length === 0)) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = book.title?.toLowerCase().includes(q);
        const authorMatch = book.author_name?.toLowerCase().includes(q);
        const descMatch = book.description?.toLowerCase().includes(q);
        const tagMatch = book.tags?.some(t => t.toLowerCase().includes(q));
        if (!titleMatch && !authorMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [books, isAdminMode, selectedCategory, selectedTag, costFilter, minRating, hasQuizFilter, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* BANNER HEADER (Light Theme) */}
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
                  وضع المسؤول والإدارة متفعل
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              المكتبة الرقمية والمقررات الأكاديمية والمحتوى التفاعلي
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              تشغيل الكتب التفاعلية، استعراض السجلات، حل بنوك الأسئلة مباشرة دون الحاجة لبرامج خارجية (.zip)، واستمع للبودكاست الأكاديمي الذكي.
            </p>
          </div>

          {isAdminMode && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95"
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
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-5 space-y-6 shadow-sm sticky top-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              تصفية الكتب والأبحاث
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTag('all');
                setCostFilter('all');
                setHasQuizFilter(false);
                setMinRating(0);
                setSearchQuery('');
              }}
              className="text-[11px] text-gray-500 hover:text-indigo-600 font-bold"
            >
              إعادة ضبط
            </button>
          </div>

          {/* ACADEMIC DEPARTMENTS */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              الأقسام الأكاديمية
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'جميع المحتويات والأبحاث', count: books.length },
                { id: 'digital_book', label: 'كتب رقمية ومقررات', count: books.filter(b => b.category === 'digital_book').length },
                { id: 'training_kit', label: 'حقائب تدريبية تفاعلية', count: books.filter(b => b.category === 'training_kit').length },
                { id: 'quiz_bank', label: 'امتحانات وبنوك أسئلة', count: books.filter(b => b.category === 'quiz_bank').length },
                { id: 'academic_paper', label: 'أوراق ودراسات أكاديمية', count: books.filter(b => b.category === 'academic_paper').length }
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

          {/* COST FILTER */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">تكلفة الحزمة والمقرر</label>
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

          {/* INTERACTIVE FEATURES */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">مزايا الحزمة التفاعلية</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={hasQuizFilter}
                  onChange={(e) => setHasQuizFilter(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>يحتوي اختباراً تفاعلياً وبنك أسئلة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={hasMediaFilter}
                  onChange={(e) => setHasMediaFilter(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>يتضمن وسائط صوتية وفيديو بودكاست</span>
              </label>
            </div>
          </div>

          {/* SPECIALTIES & TAGS */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-700">التخصصات والوسوم</label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
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
        </div>

        {/* LEFT COLUMN: SEARCH BAR + BOOK CARDS GRID */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان، المادة (مثل: فارماكولوجي)، د. كريم كامل، الوسوم..."
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-gray-500 font-bold">
                المعروض: <span className="text-indigo-600 font-black">{filteredBooks.length}</span> من أصل {books.length}
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="popular">الأكثر شعبية وزيارة</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="newest">الأحدث إضافة</option>
              </select>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">لا توجد كتب مطابقة لبحثك</h3>
              <p className="text-xs text-gray-500">جرب تغيير التصفية أو البحث برمز/عنوان آخر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 ${
                    !book.is_published ? 'opacity-60 border-dashed border-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden group">
                    <img
                      src={book.thumbnail_url || "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80"}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5">
                      {book.price === 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-lg shadow-sm border border-emerald-200">
                          مجاني
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 font-black text-[10px] rounded-lg shadow-sm">
                          ${book.price}
                        </span>
                      )}

                      {book.is_external && (
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-lg shadow-sm border border-indigo-200 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          رابط مباشر
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 text-[11px] font-bold text-amber-600 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{book.rating || 5.0}</span>
                      <span className="text-gray-500 text-[10px]">({book.reviews_count || 120})</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600">
                        <span>{book.category === 'digital_book' ? 'كتاب رقمي' : book.category === 'quiz_bank' ? 'امتحان وبنك أسئلة' : 'مقرر تفاعلي'}</span>
                        <span className="text-gray-500">{book.author_name}</span>
                      </div>

                      <h3 className="font-black text-gray-900 text-base leading-snug line-clamp-2 hover:text-indigo-600 transition">
                        {book.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {book.description || "كتاب تفاعلي يتضمن شروحات، خريطة ذهنية، وبنك أسئلة مدمج."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {book.tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-semibold rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

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
                                <span>إظهار بالمتجر</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteBook(book.id)}
                            className="flex items-center gap-1 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
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
    </div>
  );
};
