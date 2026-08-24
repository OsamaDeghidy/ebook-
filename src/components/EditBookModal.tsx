import React, { useState } from 'react';
import { X, Save, BookOpen, Layers, Calendar, GraduationCap, Tag, DollarSign, Image, Sparkles, School, Building2 } from 'lucide-react';
import { MarketplaceBook, BookCategory, BookTrack } from '../types';
import { 
  MAIN_CATEGORIES, 
  EDUCATION_LEVELS, 
  ACADEMIC_SYSTEMS, 
  ACADEMIC_SUBJECTS, 
  GENERAL_SUBJECTS, 
  UNIVERSITY_FACULTIES, 
  SEMESTERS, 
  ACADEMIC_YEARS, 
  getGradesForSystem 
} from '../constants/taxonomy';

// Re-export for compatibility
export { ACADEMIC_SUBJECTS, GENERAL_SUBJECTS, SEMESTERS, ACADEMIC_YEARS };
export const SUBCATEGORIES = GENERAL_SUBJECTS;
export const GRADE_LEVELS = getGradesForSystem('pre_university', 'general_arabic');
export const BOOK_TRACKS: { id: BookTrack; label: string }[] = [
  { id: 'academic', label: 'مناهج دراسية ومقررات تعليمية' },
  { id: 'self_help', label: 'تطوير الذات والمهارات القيادية' },
  { id: 'business_finance', label: 'المالية والأعمال والاستثمار' },
  { id: 'programming_tech', label: 'البرمجة وهندسة البرمجيات والذكاء الاصطناعي' },
  { id: 'science_math', label: 'الرياضيات والعلوم والفيزياء' },
  { id: 'languages', label: 'اللغات والترجمة والأدب' },
  { id: 'general_literature', label: 'كتب عامة وروايات وفكر عالمي' }
];

interface EditBookModalProps {
  isOpen: boolean;
  book: MarketplaceBook | null;
  onClose: () => void;
  onSave: (updatedBook: MarketplaceBook) => Promise<void>;
}

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
  const [category, setCategory] = useState<BookCategory>(book.category || 'academic_curriculum');
  
  // Cascading Academic states
  const [educationLevel, setEducationLevel] = useState<string>(book.education_level || 'pre_university');
  const [academicSystem, setAcademicSystem] = useState<string>(book.academic_system || 'general_arabic');
  const [gradeLevel, setGradeLevel] = useState<string>(book.grade_level || 'الصف الأول الثانوي');
  const [subcategory, setSubcategory] = useState(book.subcategory || ACADEMIC_SUBJECTS[0]);
  const [universityFaculty, setUniversityFaculty] = useState(book.subcategory || UNIVERSITY_FACULTIES[0]);
  const [semester, setSemester] = useState(book.semester || SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState(book.academic_year || ACADEMIC_YEARS[0]);
  
  const [externalUrl, setExternalUrl] = useState(book.external_url || '');
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

  const isAcademic = category === 'academic_curriculum' || book.track === 'academic';

  const handleEducationLevelChange = (level: string) => {
    setEducationLevel(level);
    const validGrades = getGradesForSystem(level, academicSystem);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
  };

  const handleAcademicSystemChange = (system: string) => {
    setAcademicSystem(system);
    const validGrades = getGradesForSystem(educationLevel, system);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanTags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const activeSubcategory = isAcademic 
        ? (educationLevel === 'university' ? universityFaculty : subcategory)
        : subcategory;

      const structuredTags = [
        ...cleanTags,
        `track:${isAcademic ? 'academic' : 'general_literature'}`,
        `sub:${activeSubcategory}`,
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
        track: isAcademic ? 'academic' : 'general_literature',
        education_level: isAcademic ? educationLevel : undefined,
        academic_system: isAcademic ? (educationLevel === 'university' ? 'تعليم جامعي' : academicSystem) : undefined,
        subcategory: activeSubcategory,
        grade_level: gradeLevel,
        semester,
        academic_year: academicYear,
        tags: structuredTags,
        price: Number(price) || 0,
        external_url: book.is_external ? externalUrl.trim() : book.external_url,
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
          
          {/* 10 MAIN CATEGORIES PICKER */}
          <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2.5">
            <label className="text-xs font-black text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>قسم وتصنيف الكتاب في المكتبة الرقمية</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                10 أقسام رئيسية
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MAIN_CATEGORIES.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as BookCategory)}
                  className={`p-2 rounded-xl text-[11px] font-black transition text-center border leading-tight flex items-center justify-center min-h-[44px] ${
                    category === c.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {c.label}
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
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {book.is_external && (
              <div className="pt-2 border-t border-amber-200/60">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  رابط حزمة المحتوى التفاعلي السحابي (يتم تضمينه بأمان داخل مشغل المنصة)
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-teal-700 mt-1 font-bold">
                  🔒 يتم تشغيل هذا المحتوى للمشتركين حصرياً داخل مشغل المنصة المدمج دون توجيه أو كشف للرابط.
                </p>
              </div>
            )}
          </div>

          {/* DYNAMIC CASCADING TAXONOMY */}
          {isAcademic ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>الهيكلية الأكاديمية للمقرر</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  مناهج ومقررات دراسية
                </span>
              </div>

              {/* 1. Education Level */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">1. المرحلة التعليمية</label>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => handleEducationLevelChange(lvl.id)}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition border ${
                        educationLevel === lvl.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {lvl.id === 'pre_university' ? <School className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      <span>{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Cascading Fields */}
              {educationLevel === 'pre_university' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">2. مسار التعليم</label>
                    <select
                      value={academicSystem}
                      onChange={(e) => handleAcademicSystemChange(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {ACADEMIC_SYSTEMS.map((sys) => (
                        <option key={sys.id} value={sys.id}>{sys.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">3. الصف الدراسي</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('pre_university', academicSystem).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">2. الكلية / التخصص الجامعي</label>
                    <select
                      value={universityFaculty}
                      onChange={(e) => setUniversityFaculty(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {UNIVERSITY_FACULTIES.map((fac) => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">3. الفرقة الدراسية</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('university').map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">المادة الدراسية</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ACADEMIC_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">الفصل الدراسي</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">السنة / الطبعة</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">الموضوع / التخصص الفرعي</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {GENERAL_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">المستوى والجمهور المستهدف</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="عام / للقراء والمهتمين ورواد الأعمال">عام / للقراء والمهتمين ورواد الأعمال</option>
                  <option value="مستوى مبتدئ / تأسيسي">مستوى مبتدئ / تأسيسي</option>
                  <option value="مستوى متوسط وتطبيقي">مستوى متوسط وتطبيقي</option>
                  <option value="مستوى متقدم وتخصصي">مستوى متقدم وتخصصي</option>
                </select>
              </div>
            </div>
          )}

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
