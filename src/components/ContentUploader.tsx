import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, BookOpen, AlertCircle, RefreshCw, X, GraduationCap, Compass, BookMarked, Check, Wand2 } from 'lucide-react';
import { BookCategory, BookTrack } from '../types';
import { BOOK_TRACKS, SUBCATEGORIES, GRADE_LEVELS, SEMESTERS, ACADEMIC_YEARS } from './EditBookModal';
import { supabase } from '../lib/supabase';

export const ACADEMIC_SUBJECTS = [
  'الرياضيات والإحصاء',
  'الفيزياء والعلوم الطبيعية',
  'الكيمياء والعلوم التطبيقية',
  'الأحياء والجيولوجيا وعلوم الأرض',
  'اللغة العربية والنحو والبلاغة',
  'اللغة الإنجليزية والترجمة',
  'التاريخ والجغرافيا والدراسات الاجتماعية',
  'الفلسفة والمنطق وعلم النفس',
  'علوم الحاسب وتكنولوجيا المعلومات',
  'العلوم المالية وإدارة الأعمال والمحاسبة',
  'الطب والعلوم الصحية والصيدلة'
];

interface ContentUploaderProps {
  onConvert: (payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: BookCategory;
    track?: BookTrack;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
  }) => void;
  isConverting: boolean;
  progressPercent?: number;
  progressStep?: string;
}

export default function ContentUploader({
  onConvert,
  isConverting,
  progressPercent,
  progressStep,
}: ContentUploaderProps) {
  const [promptText, setPromptText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ 
    name: string; 
    size: string; 
    type: string; 
    base64?: string;
    rawFile?: File;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);

  // Main Mode: Academic Curriculum vs General Digital Library Book
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true);

  // Academic metadata states
  const [category, setCategory] = useState<BookCategory>('digital_book');
  const [track, setTrack] = useState<BookTrack>('academic');
  const [subcategory, setSubcategory] = useState<string>(ACADEMIC_SUBJECTS[0]);
  const [gradeLevel, setGradeLevel] = useState<string>('الصف الأول الثانوي');
  const [semester, setSemester] = useState<string>(SEMESTERS[1]); // ترم أول
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]); // 2026-2027

  // General Library metadata states
  const [generalTrack, setGeneralTrack] = useState<BookTrack>('self_help');
  const [generalSubcategory, setGeneralSubcategory] = useState<string>(SUBCATEGORIES[0]);
  const [generalAudience, setGeneralAudience] = useState<string>(GRADE_LEVELS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      setErrorMsg("صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو صورة (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg("حجم الملف كبير جداً. الحد الأقصى المسموح به هو 100 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFile({
        name: file.name,
        size: formatBytes(file.size),
        type: file.type,
        base64: base64String,
        rawFile: file
      });
    };
    reader.onerror = () => {
      setErrorMsg("حدث خطأ أثناء قراءة الملف. يرجى المحاولة مرة أخرى.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() && !selectedFile) {
      setErrorMsg("يرجى تزويد النظام بمصدر تعليمي (رفع ملف PDF أو كتابة تعليمات/توجيه للكتاب).");
      return;
    }

    let fileUrl: string | undefined = undefined;

    // Direct cloud storage upload for large files or PDFs to bypass Vercel 4.5MB payload limit
    if (selectedFile?.rawFile && (selectedFile.rawFile.size > 2 * 1024 * 1024 || selectedFile.rawFile.type === 'application/pdf')) {
      setIsUploadingCloud(true);
      try {
        const uploadPath = `documents/${Date.now()}_file.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from('book-covers')
          .upload(uploadPath, selectedFile.rawFile, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('book-covers')
            .getPublicUrl(uploadPath);
          fileUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn("Supabase direct upload notice:", err);
      } finally {
        setIsUploadingCloud(false);
      }
    }

    onConvert({
      promptText,
      fileUrl,
      fileBase64: fileUrl ? undefined : selectedFile?.base64,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
      category: isAcademicMode ? 'digital_book' : 'self_help',
      track: isAcademicMode ? 'academic' : generalTrack,
      subcategory: isAcademicMode ? subcategory : generalSubcategory,
      grade_level: isAcademicMode ? gradeLevel : generalAudience,
      semester: isAcademicMode ? semester : 'كتاب عام مستمر',
      academic_year: academicYear
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" dir="rtl">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>استوديو تحويل الكتب والمناهج التفاعلية الذكي</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
          توليد كتاب أو مقرر تفاعلي جديد
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          ارفع ملف الـ PDF لتحويله إلى كتاب رقمي شامل بالصوت، الشرح، الخرائط المفاهيمية، وبنوك الأسئلة.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* PROMINENT TOGGLE: ACADEMIC VS GENERAL LIBRARY */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAcademicMode(true);
                setTrack('academic');
              }}
              className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition font-black text-xs sm:text-sm ${
                isAcademicMode
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>مقرر ومنهج دراسي (أكاديمي)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAcademicMode(false);
                setTrack(generalTrack);
              }}
              className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition font-black text-xs sm:text-sm ${
                !isAcademicMode
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookMarked className="w-5 h-5" />
              <span>كتاب عام ومكتبة رقمية (تطوير ذات / أعمال)</span>
            </button>
          </div>
        </div>

        {/* DRAG AND DROP ZONE */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500 bg-emerald-50/30'
              : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileInputChange}
            disabled={isConverting}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {selectedFile ? (
              <>
                <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-gray-800 flex items-center justify-center gap-1.5">
                    {selectedFile.name}
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition"
                      title="إزالة الملف"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </h4>
                  <p className="text-xs text-gray-400 font-bold">{selectedFile.type.toUpperCase()} • {selectedFile.size}</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-700">اسحب وأفلت ملف الـ PDF هنا، أو <span className="text-indigo-600 underline">تصفح جهازك</span></p>
                  <p className="text-xs text-gray-400">يدعم كتب الـ PDF، المذكرات، والمراجع حتى 100 ميجابايت</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI AUTO-INFERENCE BADGE */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
          <Wand2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ميزة التصنيف التلقائي: سيقوم الذكاء الاصطناعي تلقائياً بتحديد المادة والمرحلة الأنسب من محتوى الكتاب إن تركت الخيارات كما هي.</span>
        </div>

        {/* CONDITIONAL FORM FIELDS BASED ON SELECTED MODE */}
        {isAcademicMode ? (
          /* ACADEMIC FIELDS */
          <div className="p-5 bg-white border border-gray-200 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>بيانات المقرر والمادة الدراسية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">المادة الدراسية / التخصص</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {ACADEMIC_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">الصف / المرحلة التعليمية</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {GRADE_LEVELS.filter(g => !g.includes('للقراء') && !g.includes('مبتدئ')).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">الفصل الدراسي</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {SEMESTERS.filter(s => s.includes('ترم') || s.includes('مستمر') || s.includes('صيفي')).map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">السنة الدراسية</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* GENERAL LIBRARY FIELDS */
          <div className="p-5 bg-white border border-gray-200 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>تصنيف الكتاب في المكتبة العامة</span>
            </h4>

            {/* TRACK PICKER */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BOOK_TRACKS.filter(t => t.id !== 'academic').map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setGeneralTrack(t.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition text-right border ${
                    generalTrack === t.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">المجال / الموضوع الفرعي</label>
                <select
                  value={generalSubcategory}
                  onChange={(e) => setGeneralSubcategory(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {SUBCATEGORIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">المستوى والجمهور المستهدف</label>
                <select
                  value={generalAudience}
                  onChange={(e) => setGeneralAudience(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="عام / للقراء والمهتمين ورواد الأعمال">عام / للقراء والمهتمين ورواد الأعمال</option>
                  <option value="مستوى مبتدئ / تأسيسي">مستوى مبتدئ / تأسيسي</option>
                  <option value="مستوى متوسط وتطبيقي">مستوى متوسط وتطبيقي</option>
                  <option value="مستوى متقدم وتخصصي">مستوى متقدم وتخصصي</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PROMPT / TEXT PASTING ZONE */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            توجيهات إضافية للذكاء الاصطناعي (اختياري)
          </label>
          <textarea
            placeholder="مثال: ركز على الجوانب العملية والأمثلة التطبيقية، واجعل لغة الحوار ميسرة وممتعة..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isConverting}
            rows={3}
            className="w-full text-xs p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition resize-none leading-relaxed font-sans"
          />
        </div>

        {/* ACTIVE CONVERSION PROGRESS DISPLAY */}
        {isConverting && <ConversionProgressTracker percent={progressPercent} step={progressStep} />}

        {/* ERROR MESSAGES */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-bold">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isConverting || isUploadingCloud}
          className={`w-full py-4 rounded-2xl font-black text-sm text-white transition flex items-center justify-center gap-2.5 shadow-md ${
            isConverting || isUploadingCloud
              ? 'bg-slate-800 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-200'
          }`}
        >
          {isConverting || isUploadingCloud ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isUploadingCloud ? 'جاري فحص ورفع الملف السحابي...' : 'جاري التحليل والبناء بالذكاء الاصطناعي...'}</span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              <span>توليد وبناء الكتاب التفاعلي الآن</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}

// Sub-component to show live AI conversion progress steps
interface ProgressTrackerProps {
  percent?: number;
  step?: string;
}

function ConversionProgressTracker({ percent, step }: ProgressTrackerProps) {
  const [localStep, setLocalStep] = React.useState(0);
  
  const steps = [
    { label: "قراءة وتحليل مستند الـ PDF واستخراج الفصول والمفاهيم", desc: "فحص عميق للمادة وبناء الهيكل الرقمي" },
    { label: "تقسيم الكتاب إلى فصول تفصيلية دون اختصار", desc: "استخراج النصوص الأصلية وشرح المفاهيم الرئيسية" },
    { label: "صياغة التلخيص والأمثلة والخرائط المفاهيمية باللغة العربية الفصحى", desc: "إعداد الدروس المعمقة والملاحظات التعليمية" },
    { label: "إنشاء بنوك الأسئلة والاختبارات التفاعلية مع الإيضاحات", desc: "توليد أسئلة اختيار من متعدد مع التغذية الراجعة" },
    { label: "حفظ وتثبيت الكتاب في قاعدة البيانات السحابية Supabase", desc: "ربط المصادر وحفظ بيانات الفصول" }
  ];

  React.useEffect(() => {
    if (percent === undefined) {
      const timer = setInterval(() => {
        setLocalStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [percent, steps.length]);

  const displayPercent = percent !== undefined ? percent : Math.round(((localStep + 1) / steps.length) * 100);
  const displayStepText = step || steps[Math.min(localStep, steps.length - 1)].label;

  return (
    <div className="p-5 border border-indigo-100 bg-indigo-50/30 rounded-2xl space-y-3.5 animate-fade-in text-right">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-indigo-700 flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>{displayStepText}</span>
        </span>
        <span className="text-xs font-black text-indigo-900 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
          {displayPercent}%
        </span>
      </div>

      <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-50/80 text-[10px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>دقة تحليل المحتوى: 100%</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>النماذج السريعة: نشطة</span>
        </div>
      </div>
    </div>
  );
}
