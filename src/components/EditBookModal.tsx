import React, { useState } from 'react';
import { X, Save, BookOpen, Layers, Calendar, GraduationCap, Tag, DollarSign, Image, Sparkles } from 'lucide-react';
import { MarketplaceBook, BookCategory, BookTrack } from '../types';

interface EditBookModalProps {
  isOpen: boolean;
  book: MarketplaceBook | null;
  onClose: () => void;
  onSave: (updatedBook: MarketplaceBook) => Promise<void>;
}

export const BOOK_TRACKS: { id: BookTrack; label: string }[] = [
  { id: 'academic', label: 'مناهج دراسية ومقررات تعليمية' },
  { id: 'self_help', label: 'تطوير الذات والمهارات القيادية' },
  { id: 'business_finance', label: 'المالية والأعمال والاستثمار' },
  { id: 'programming_tech', label: 'البرمجة وهندسة البرمجيات والذكاء الاصطناعي' },
  { id: 'science_math', label: 'الرياضيات والعلوم والفيزياء' },
  { id: 'languages', label: 'اللغات والترجمة والأدب' },
  { id: 'general_literature', label: 'كتب عامة وروايات وفكر عالمي' }
];

export const SUBCATEGORIES = [
  'تطوير الذات والمهارات الحياتية',
  'المالية والاستثمار وإدارة الثروة',
  'البرمجة وعلوم الحاسب والذكاء الاصطناعي',
  'الرياضيات والإحصاء',
  'الفيزياء والكيمياء والعلوم الطبيعية',
  'إدارة الأعمال والتسويق والقيادة',
  'اللغات والترجمة والنحو',
  'الأدب والروايات والفكر الإنساني',
  'الطب والعلوم الصحية والصيدلة',
  'القانون والعلوم السياسية والإدارية'
];

export const GRADE_LEVELS = [
  'عام / للقراء والمهتمين ورواد الأعمال',
  'مستوى مبتدئ / تأسيسي',
  'مستوى متوسط وعملي',
  'مستوى متقدم وتخصصي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي (شهادة عامة)',
  'المرحلة الإعدادية / المتوسطة',
  'المرحلة الابتدائية',
  'المرحلة الجامعية - سنة أولى/ثانية',
  'المرحلة الجامعية - تخرج وتخصص',
  'دراسات عليا وتدريب مهني'
];

export const SEMESTERS = [
  'كتاب عام مستمر (بدون ترم)',
  'الفصل الدراسي الأول (ترم أول)',
  'الفصل الدراسي الثاني (ترم ثاني)',
  'الفصل الدراسي الصيفي',
  'مقرر سنوي مستمر'
];

export const ACADEMIC_YEARS = [
  'إصدار عام 2026 - 2027',
  'إصدار 2025 - 2026',
  'إصدار 2024 - 2025',
  'طبعة كلاسيكية عالمية'
];

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  book,
  onClose,
  onSave
}) => {
  if (!isOpen || !book) return null;

  const [title, setTitle] = useState(book.title || '');
  const [description, setDescription] = useState(book.description || '');
  const [authorName, setAuthorName] = useState(book.author_name || 'د. كريم كامل');
  const [category, setCategory] = useState<BookCategory>(book.category || 'digital_book');
  const [track, setTrack] = useState<BookTrack>(book.track || 'general_literature');
  const [subcategory, setSubcategory] = useState(book.subcategory || SUBCATEGORIES[0]);
  const [gradeLevel, setGradeLevel] = useState(book.grade_level || GRADE_LEVELS[0]);
  const [semester, setSemester] = useState(book.semester || SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState(book.academic_year || ACADEMIC_YEARS[0]);
  const [tagsInput, setTagsInput] = useState((book.tags || []).filter(t => !t.includes(':')).join(', '));
  const [price, setPrice] = useState<number>(book.price || 0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>(() => {
    if (book.preview_video_url) return book.preview_video_url;
    const vTag = book.tags?.find(t => t.startsWith('video:'));
    return vTag ? vTag.replace('video:', '') : '';
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(book.thumbnail_url || '');
  const [showPodcast, setShowPodcast] = useState(book.feature_toggles?.show_podcast !== false);
  const [showFlashcards, setShowFlashcards] = useState(book.feature_toggles?.show_flashcards !== false);
  const [showSandbox, setShowSandbox] = useState(book.feature_toggles?.show_sandbox !== false);
  const [showQuiz, setShowQuiz] = useState(book.feature_toggles?.show_quiz !== false);
  const [showMindmap, setShowMindmap] = useState(book.feature_toggles?.show_mindmap !== false);
  const [showVideos, setShowVideos] = useState(book.feature_toggles?.show_videos !== false);
  const [isSaving, setIsSaving] = useState(false);

  const isAcademic = track === 'academic';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanTags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const structuredTags = [
        ...cleanTags,
        `track:${track}`,
        `sub:${subcategory}`,
        `grade:${gradeLevel}`,
        `term:${semester}`,
        `year:${academicYear}`,
        ...(previewVideoUrl.trim() ? [`video:${previewVideoUrl.trim()}`] : [])
      ];

      const updated: MarketplaceBook = {
        ...book,
        title,
        description,
        author_name: authorName,
        category,
        track,
        subcategory,
        grade_level: gradeLevel,
        semester,
        academic_year: academicYear,
        tags: structuredTags,
        price: Number(price) || 0,
        preview_video_url: previewVideoUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl || book.thumbnail_url,
        feature_toggles: {
          show_podcast: showPodcast,
          show_flashcards: showFlashcards,
          show_sandbox: showSandbox,
          show_quiz: showQuiz,
          show_mindmap: showMindmap,
          show_videos: showVideos
        }
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-3xl w-full shadow-2xl my-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">تعديل بيانات وتصنيف الكتاب / المقرر</h3>
              <p className="text-xs text-gray-500">تخصيص التصنيف الأكاديمي أو العام والوسوم التعليمة للمكتبة الرقمية</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* TRACK SELECTION */}
          <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>المسار والنوع الرئيسي للكتاب</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BOOK_TRACKS.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTrack(t.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition text-right border ${
                    track === t.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">عنوان الكتاب</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم المؤلف أو المعلم</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">وصف الكتاب والمحتوى</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white leading-relaxed resize-none"
            />
          </div>

          {/* 💰 PRICE & VIDEO MONETIZATION */}
          <div className="p-4 bg-gradient-to-r from-amber-50/60 to-indigo-50/60 border border-amber-200/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>تسعير المقرر وإعدادات الشراء (ج.م)</span>
              </label>
              <div className="flex items-center gap-1 text-xs font-bold">
                {[0, 50, 100, 150].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setPrice(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      price === preset
                        ? 'bg-amber-500 text-amber-950 font-black shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {preset === 0 ? 'مجاني' : `${preset} ج.م`}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">سعر المقرر (0 = مجاني بالكامل)</label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  placeholder="0 للمجاني"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">رابط فيديو توضيحي / تمهيدي للمقرر</label>
                <input
                  type="url"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC TAXONOMY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">التخصص / المجال الفرعي</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              >
                {SUBCATEGORIES.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isAcademic ? 'الصف / المرحلة التعليمية' : 'المستوى المستهدف'}
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isAcademic ? 'الفصل الدراسي' : 'طبيعة الإصدار'}
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              >
                {SEMESTERS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">السنة / الطبعة</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
              >
                {ACADEMIC_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">الوسوم والكلمات الدلالية (مفصولة بفاصلة)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: ثقافة_مالية, استثمار, عادات_النجاح"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* FEATURE TOGGLES */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
            <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>إظهار أو إخفاء أقسام وميزات الكتاب (Feature Toggles)</span>
            </label>
            <p className="text-[11px] text-gray-500">اختر الأقسام التي تود تفعيلها وظهورها للطلاب في هذا الكتاب تحديداً:</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showPodcast}
                  onChange={(e) => setShowPodcast(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>استوديو البودكاست</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showFlashcards}
                  onChange={(e) => setShowFlashcards(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>بطاقات المراجعة الذكية</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showSandbox}
                  onChange={(e) => setShowSandbox(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>المختبر والتطبيق العملي</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showQuiz}
                  onChange={(e) => setShowQuiz(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>بنك الأسئلة والاختبارات</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showMindmap}
                  onChange={(e) => setShowMindmap(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>الخريطة المفاهيمية</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={showVideos}
                  onChange={(e) => setShowVideos(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>المقاطع المرئية</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات في المكتبة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
