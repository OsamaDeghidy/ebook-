import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Sparkles, X, GraduationCap, BookMarked, Wand2, School, Building2, BookOpen, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { BookCategory, BookTrack } from '../types';
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
import { supabase } from '../lib/supabase';

interface ContentUploaderProps {
  currentUser?: any;
  userRole?: string;
  onConvert: (payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: BookCategory;
    track?: BookTrack;
    education_level?: string;
    academic_system?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    price?: number;
    preview_video_url?: string;
  }) => void;
  isConverting: boolean;
  progressPercent?: number;
  progressStep?: string;
}

interface AiQuotaInfo {
  usedCount: number;
  freeLimit: number;
  remainingFree: number;
  isFree: boolean;
  costPerBook: number;
  walletBalance: number;
  canGenerate: boolean;
}

export default function ContentUploader({
  currentUser,
  userRole = 'instructor',
  onConvert,
  isConverting,
  progressPercent,
  progressStep,
}: ContentUploaderProps) {
  const [promptText, setPromptText] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('');
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

  // AI Quota & Pricing State
  const [quotaInfo, setQuotaInfo] = useState<AiQuotaInfo | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuota = async () => {
      if (!currentUser?.id) return;
      setIsLoadingQuota(true);
      try {
        const res = await fetch(`/api/user/ai-quota/${currentUser.id}?role=${userRole}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.quota) setQuotaInfo(data.quota);
        }
      } catch (err) {
        console.warn('Could not fetch AI quota:', err);
      } finally {
        setIsLoadingQuota(false);
      }
    };
    fetchQuota();
  }, [currentUser?.id, userRole]);

  // Main Mode: Academic Curriculum vs General Digital Library Book
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true);

  // Cascading Academic metadata states
  const [educationLevel, setEducationLevel] = useState<string>('pre_university');
  const [academicSystem, setAcademicSystem] = useState<string>('general_arabic');
  const [gradeLevel, setGradeLevel] = useState<string>('الصف الأول الثانوي');
  const [subcategory, setSubcategory] = useState<string>(ACADEMIC_SUBJECTS[0]);
  const [universityFaculty, setUniversityFaculty] = useState<string>(UNIVERSITY_FACULTIES[0]);
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]);

  // General Library metadata states (9 Non-academic Categories)
  const [generalCategory, setGeneralCategory] = useState<BookCategory>('programming_ai');
  const [generalSubcategory, setGeneralSubcategory] = useState<string>(GENERAL_SUBJECTS[0]);
  const [generalAudience, setGeneralAudience] = useState<string>('عام / للقراء والمهتمين ورواد الأعمال');

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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

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
    if (!selectedFile && !promptText.trim()) {
      setErrorMsg("يرجى كتابة فكرة الكتاب أو رفع ملف PDF للبدء.");
      return;
    }

    let fileUrl: string | undefined = undefined;

    // 1. Direct Cloud Upload to Supabase Storage if file is attached
    if (selectedFile?.rawFile) {
      try {
        setIsUploadingCloud(true);
        const fileExt = selectedFile.rawFile.name.split('.').pop();
        const safeId = crypto.randomUUID();
        const fileName = `${Date.now()}-${safeId}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ebook-files')
          .upload(filePath, selectedFile.rawFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('ebook-files')
            .getPublicUrl(filePath);
          fileUrl = publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Direct storage upload failed, falling back to base64 payload:", uploadErr);
      } finally {
        setIsUploadingCloud(false);
      }
    }

    const activeSubcategory = isAcademicMode 
      ? (educationLevel === 'university' ? universityFaculty : subcategory)
      : generalSubcategory;

    const activeGrade = isAcademicMode ? gradeLevel : generalAudience;

    onConvert({
      promptText,
      fileUrl,
      fileBase64: fileUrl ? undefined : selectedFile?.base64,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
      category: isAcademicMode ? 'academic_curriculum' : generalCategory,
      track: isAcademicMode ? 'academic' : 'general_literature',
      education_level: isAcademicMode ? educationLevel : undefined,
      academic_system: isAcademicMode ? (educationLevel === 'university' ? 'تعليم جامعي' : academicSystem) : undefined,
      subcategory: activeSubcategory,
      grade_level: activeGrade,
      semester: isAcademicMode ? semester : 'كتاب عام مستمر',
      academic_year: academicYear,
      price: Number(price) || 0,
      preview_video_url: previewVideoUrl.trim() || undefined
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

      {/* 🎁 AI QUOTA & FREE BOOKS BANNER */}
      {quotaInfo && (
        userRole === 'admin' ? (
          <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="font-bold">حساب إدارة المنصة (Admin Mode):</span>
              <span className="text-emerald-400 font-black">توليد غير محدود مجاناً 100% 🛡️</span>
            </div>
          </div>
        ) : quotaInfo.remainingFree > 0 ? (
          <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-2xl text-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs">🎁 هدية المعلم</span>
                <span className="text-xs font-black text-slate-900">باقة المعلم المجانية بالذكاء الاصطناعي:</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  متبقي لك {quotaInfo.remainingFree} من {quotaInfo.freeLimit} مذكرات مجانية (Free)!
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                أول {quotaInfo.freeLimit} مذكرات مجاناً 100%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((quotaInfo.freeLimit - quotaInfo.remainingFree) / quotaInfo.freeLimit) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={`p-3.5 rounded-2xl border ${quotaInfo.walletBalance >= quotaInfo.costPerBook ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-amber-50 border-amber-200 text-amber-900'} space-y-2`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs">⚡ باقة الإنتاج</span>
                <span className="text-xs font-black">تكلفة التوليد (بعد استهلاك الـ {quotaInfo.freeLimit} مذكرات المجانية):</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {quotaInfo.costPerBook} ج.م / مذكرة
                </span>
                <span className="text-xs font-bold text-slate-600">
                  رصيد محفظتك: <strong className={quotaInfo.walletBalance >= quotaInfo.costPerBook ? 'text-emerald-600' : 'text-rose-600'}>{quotaInfo.walletBalance} ج.م</strong>
                </span>
              </div>
            </div>
            {quotaInfo.walletBalance < quotaInfo.costPerBook && (
              <p className="text-[11px] text-amber-800 font-bold bg-amber-100/70 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>رصيد محفظتك الحالي ({quotaInfo.walletBalance} ج.م) غير كافٍ لتوليد المذكرة ({quotaInfo.costPerBook} ج.م). يرجى شحن الرصيد للمتابعة.</span>
              </p>
            )}
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* PROMINENT TOGGLE: ACADEMIC VS GENERAL LIBRARY */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsAcademicMode(true)}
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
              onClick={() => setIsAcademicMode(false)}
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
          /* ACADEMIC FIELDS - CASCADING TAXONOMY */
          <div className="p-5 bg-white border border-gray-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>الهيكلية الأكاديمية للمقرر والمنهج الدراسي</span>
              </h4>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                مناهج ومقررات دراسية
              </span>
            </div>

            {/* 1. EDUCATION LEVEL SELECTOR (قبل جامعي vs جامعي) */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">1. المرحلة التعليمية الرئيسية</label>
              <div className="grid grid-cols-2 gap-2">
                {EDUCATION_LEVELS.map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => handleEducationLevelChange(lvl.id)}
                    className={`p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition border ${
                      educationLevel === lvl.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {lvl.id === 'pre_university' ? <School className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    <span>{lvl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. PRE-UNIVERSITY CASCADING FIELDS */}
            {educationLevel === 'pre_university' ? (
              <div className="space-y-4 p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* System Track */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">2. مسار ونظام التعليم</label>
                    <select
                      value={academicSystem}
                      onChange={(e) => handleAcademicSystemChange(e.target.value)}
                      disabled={isConverting}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {ACADEMIC_SYSTEMS.map((sys) => (
                        <option key={sys.id} value={sys.id}>{sys.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">3. الصف والمرحلة الدراسية</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      disabled={isConverting}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('pre_university', academicSystem).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">4. المادة الدراسية / التخصص</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    disabled={isConverting}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ACADEMIC_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* UNIVERSITY FIELDS */
              <div className="space-y-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">2. الكلية / التخصص الجامعي</label>
                    <select
                      value={universityFaculty}
                      onChange={(e) => setUniversityFaculty(e.target.value)}
                      disabled={isConverting}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {UNIVERSITY_FACULTIES.map((fac) => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">3. السنة / الفرقة الدراسية</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      disabled={isConverting}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('university').map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SEMESTER & YEAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">الفصل الدراسي</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">السنة الدراسية / الطبعة</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={isConverting}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* GENERAL LIBRARY FIELDS - 9 MAIN CATEGORIES */
          <div className="p-5 bg-white border border-gray-200 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>اختر قسم الكتاب من أقسام المكتبة الرقمية العامة</span>
            </h4>

            {/* 9 MAIN NON-ACADEMIC CATEGORIES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MAIN_CATEGORIES.filter(c => !c.isAcademic).map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setGeneralCategory(c.id as BookCategory)}
                  className={`p-3 rounded-2xl text-xs font-bold transition text-right border flex flex-col justify-between gap-1.5 ${
                    generalCategory === c.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-black text-[11px]">{c.label}</span>
                  <span className={`text-[10px] leading-tight line-clamp-1 ${generalCategory === c.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {c.description}
                  </span>
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
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {GENERAL_SUBJECTS.map((s) => (
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
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
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

        {/* 💰 PRICE & MONETIZATION SETTINGS */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-150 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <span>💰 تسعير المقرر / الكتاب للطلاب</span>
            </label>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {[0, 50, 100, 150].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPrice(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    price === preset
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
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
              <span className="text-[11px] text-gray-600 font-bold block mb-1">أو حدد سعراً مخصصاً (بالجنيه):</span>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                disabled={isConverting}
                placeholder="0 = مجاني"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-gray-600 font-bold block mb-1">رابط فيديو توضيحي / تمهيدي (اختياري):</span>
              <input
                type="url"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                disabled={isConverting}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
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
          disabled={isConverting || isUploadingCloud || (quotaInfo !== null && !quotaInfo.canGenerate)}
          className={`w-full py-4 rounded-2xl font-black text-sm text-white transition flex items-center justify-center gap-2.5 shadow-md ${
            isConverting || isUploadingCloud
              ? 'bg-slate-800 cursor-not-allowed'
              : (quotaInfo !== null && !quotaInfo.canGenerate)
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-200 cursor-pointer'
          }`}
        >
          {isConverting || isUploadingCloud ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isUploadingCloud ? 'جاري فحص ورفع الملف السحابي...' : 'جاري التحليل والبناء بالذكاء الاصطناعي...'}</span>
            </>
          ) : (quotaInfo !== null && !quotaInfo.canGenerate) ? (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>الرصيد غير كافٍ — يرجى شحن المحفظة للمتابعة ({quotaInfo.costPerBook} ج.م)</span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              <span>
                {quotaInfo?.isFree 
                  ? 'توليد وبناء الكتاب التفاعلي الآن (مجاناً 🎁)' 
                  : `توليد وبناء الكتاب التفاعلي (${quotaInfo?.costPerBook || 50} ج.م)`}
              </span>
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
