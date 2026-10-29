import React, { useState } from 'react';
import { 
  Users, BookOpen, TrendingUp, Award, Printer, Ticket, Sparkles, 
  BarChart3, CheckCircle2, Download, Copy, RefreshCw, FileText, ArrowLeft, Shield, Clock, Flame, Search
} from 'lucide-react';
import { MarketplaceBook } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface InstructorDashboardProps {
  books: MarketplaceBook[];
  onBackToMarketplace: () => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  books,
  onBackToMarketplace
}) => {
  const { t, language, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'analytics' | 'exams' | 'vouchers' | 'students'>('analytics');

  // Exam Generator State
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [examTitle, setExamTitle] = useState('امتحان المراجعة الشاملة');
  const [examDuration, setExamDuration] = useState('60 دقيقة');
  const [generatedExam, setGeneratedExam] = useState<any[] | null>(null);

  // Voucher Generator State
  const [voucherCount, setVoucherCount] = useState(25);
  const [generatedVouchers, setGeneratedVouchers] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  // Student Roster State
  const [studentSearch, setStudentSearch] = useState('');
  const [rosterBookFilter, setRosterBookFilter] = useState('all');

  const rosterStudents = [
    { id: 'st-1', name: 'أحمد محمود العوضي', phone: '01012345678', email: 'ahmed.m@gmail.com', bookId: books[0]?.id || 'b1', bookTitle: books[0]?.title || 'المقرر الرئيسي', progress: 88, score: 94, status: 'متفوق 🏆', lastActive: 'منذ 15 دقيقة' },
    { id: 'st-2', name: 'سارة خالد المنشاوي', phone: '01123456789', email: 'sara.k@gmail.com', bookId: books[0]?.id || 'b1', bookTitle: books[0]?.title || 'المقرر الرئيسي', progress: 100, score: 98, status: 'متفوق 🏆', lastActive: 'منذ ساعة' },
    { id: 'st-3', name: 'يوسف طارق إبراهيم', phone: '01234567890', email: 'youssef.t@outlook.com', bookId: books[1]?.id || books[0]?.id || 'b2', bookTitle: books[1]?.title || books[0]?.title || 'مقرر إضافي', progress: 65, score: 82, status: 'منتظم 🟢', lastActive: 'منذ 3 ساعات' },
    { id: 'st-4', name: 'فاطمة الزهراء الشربيني', phone: '01511223344', email: 'fatma.z@yahoo.com', bookId: books[0]?.id || 'b1', bookTitle: books[0]?.title || 'المقرر الرئيسي', progress: 42, score: 71, status: 'يحتاج متابعة ⚠️', lastActive: 'أمس' },
    { id: 'st-5', name: 'كريم هاني الدسوقي', phone: '01099887766', email: 'karim.h@gmail.com', bookId: books[1]?.id || books[0]?.id || 'b2', bookTitle: books[1]?.title || books[0]?.title || 'مقرر إضافي', progress: 92, score: 90, status: 'متفوق 🏆', lastActive: 'منذ 40 دقيقة' },
    { id: 'st-6', name: 'نوران مصطفى الشافعي', phone: '01144556677', email: 'nouran.m@gmail.com', bookId: books[0]?.id || 'b1', bookTitle: books[0]?.title || 'المقرر الرئيسي', progress: 78, score: 86, status: 'منتظم 🟢', lastActive: 'منذ ساعتين' },
  ];

  const filteredStudents = rosterStudents.filter(st => {
    if (rosterBookFilter !== 'all' && st.bookId !== rosterBookFilter) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      return st.name.toLowerCase().includes(q) || st.phone.includes(q) || st.email.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats summary calculation
  const totalBooks = books.length;
  const totalChapters = books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0);
  const totalQuestions = books.reduce((acc, b) => acc + (b.question_bank?.length || 0), 0);

  // Handle generating printable exam from selected book questions
  const handleGenerateExam = () => {
    const targetBook = books.find(b => b.id === selectedBookId);
    if (!targetBook || !targetBook.question_bank || targetBook.question_bank.length === 0) {
      // Fallback sample questions from chapters
      const sample = (targetBook?.chapters || []).slice(0, 5).map((c, i) => ({
        id: `q-${i}`,
        question: `سؤال تطبيقي شامل على: ${c.title}`,
        options: ['الاختيار الأول (أ)', 'الاختيار الثاني (ب)', 'الاختيار الثالث (ج)', 'الاختيار الرابع (د)'],
        correct_answer: 'الاختيار الأول (أ)'
      }));
      setGeneratedExam(sample);
      return;
    }
    setGeneratedExam(targetBook.question_bank.slice(0, 15));
  };

  const handlePrintExam = () => {
    window.print();
  };

  // Handle generating batch of center voucher codes
  const handleGenerateVouchers = () => {
    const list: string[] = [];
    for (let i = 0; i < voucherCount; i++) {
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      list.push(`SMP-${randStr}-${randNum}`);
    }
    setGeneratedVouchers(list);
  };

  const handleCopyVouchers = () => {
    navigator.clipboard.writeText(generatedVouchers.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-right max-w-7xl mx-auto" dir={dir}>
      
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <button
            onClick={onBackToMarketplace}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-teal-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>العودة لمتجر المقررات</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                لوحة تحكم المعلم والسنتر (Instructor Hub)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                إدارة مبيعات المقررات، توليد الامتحانات الورقية المطبوعة، وإصدار كروت شحن السناتر
              </p>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-teal-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>الإحصائيات والمبيعات</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'exams'
                ? 'bg-white text-teal-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>مولّد الامتحانات المطبوعة</span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vouchers'
                ? 'bg-white text-teal-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-rose-600" />
            <span>كروت شحن السناتر</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'students'
                ? 'bg-white text-teal-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>سجل الطلاب والدرجات 👥</span>
          </button>
        </div>
      </div>

      {/* 📊 TAB 1: ANALYTICS & STATS OVERVIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 🚀 GUIDED INSTRUCTOR ONBOARDING CHECKLIST */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-indigo-50/40 to-white border border-teal-200/80 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                  ✓
                </div>
                <h3 className="text-sm font-black text-slate-900">دليل الخطوة الأولى للمعلم (بدء النشر في 3 خطوات)</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-100/60 px-2.5 py-0.5 rounded-full">
                ابدأ الآن بكل سهولة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white border border-teal-100 rounded-2xl flex items-start gap-2.5 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">ارفع مذكرتك الأولى (PDF)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">يقوم الذكاء الاصطناعي ببناء المنهج، الخرائط، وبنك الأسئلة تلقائياً.</p>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-indigo-100 rounded-2xl flex items-start gap-2.5 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">خصص شخصية المعلم وصوته</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">اختر أسلوب الشرح التفاعلي وأصوات البودكاست (كريم وفرح).</p>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-rose-100 rounded-2xl flex items-start gap-2.5 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">أصدر كروت الشحن أو شارك الرابط</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">وزع كروت الشحن على طلاب السنتر أو شارك كود الـ QR مباشرة.</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي المقررات المنشورة</span>
                <BookOpen className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalBooks}</div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>مقررات نشطة وتفاعلية</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي الفصول والمحاضرات</span>
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalChapters}</div>
              <div className="text-[11px] text-indigo-600 font-bold">
                فصل مجهّز بالبودكاست والملخصات
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>بنك الأسئلة المعتمد</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalQuestions || totalChapters * 10}</div>
              <div className="text-[11px] text-amber-600 font-bold">
                سؤال تدريبي مقالي واختياري
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>مستوى الحماية وDRM</span>
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600">100%</div>
              <div className="text-[11px] text-slate-500 font-bold">
                علامة مائية وبصمة أجهزة نشطة
              </div>
            </div>
          </div>

          {/* BOOKS TABLE */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg">قائمة مقرراتك ومؤشرات التفاعل</h3>
            <div className="divide-y divide-gray-100">
              {books.map((b) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.thumbnail_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'}
                      alt={b.title}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    />
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{b.title}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {b.subcategory || 'مقرر عام'} • {b.price ? `${b.price} ج.م` : 'مجاني'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-teal-100">
                      {b.chapters?.length || 0} فصول
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100">
                      مفعل للطلاب ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ TAB 2: PRINTABLE EXAM GENERATOR */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">توليد وطباعة الامتحانات الورقية للسنتر</h3>
                <p className="text-xs text-gray-500">اختر المقرر والمواصفات وسيقوم النظام بتنسيق ورقة امتحان جاهزة للطباعة فوراً</p>
              </div>
              {generatedExam && (
                <button
                  onClick={handlePrintExam}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقة الامتحان (PDF / Print)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر المقرر / المذكرة:</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان ورقة الامتحان:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">زمن الامتحان:</label>
                <input
                  type="text"
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateExam}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>توليد ورقة الامتحان الآن</span>
            </button>
          </div>

          {/* PRINTABLE EXAM PAPER PREVIEW */}
          {generatedExam && (
            <div id="printable-exam-sheet" className="bg-white border-2 border-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0">
              {/* EXAM PAPER HEADER */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{examTitle}</h2>
                  <p className="text-xs font-bold text-slate-600 mt-1">منصة Osera AI LMS التعليمية</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-semibold text-slate-800">
                  <div>اسم الطالب: ................................</div>
                  <div>رقم الجلوس: ................................</div>
                  <div>المجموعة / السنتر: .........................</div>
                  <div>الزمن المقرر: <strong>{examDuration}</strong></div>
                  <div>الدرجة الكلية: <strong>50 درجة</strong></div>
                  <div>التاريخ: ...................................</div>
                </div>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-6 pt-2">
                {generatedExam.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-2 border-b border-gray-100 pb-4">
                    <div className="flex items-start gap-2 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-8 text-xs font-medium text-slate-700">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-slate-400 inline-block" />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="pt-6 border-t border-slate-300 text-center text-xs font-bold text-slate-500 flex items-center justify-between">
                <span>تمنياتنا لجميع الطلاب بالتفوق والنجاح ✦</span>
                <span>انتهت الأسئلة</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎟️ TAB 3: CENTER VOUCHER BATCH GENERATOR */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">توليد دفعات كروت الشحن للمكتبات والسناتر</h3>
              <p className="text-xs text-gray-500">قم بتوليد أكواد شحن فريدة وطباعتها لتوزيعها على السناتر والمكتبات</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الكروت المطلوبة:</label>
                <select
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(Number(e.target.value))}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value={10}>10 كروت شحن</option>
                  <option value={25}>25 كارت شحن</option>
                  <option value={50}>50 كارت شحن</option>
                  <option value={100}>100 كارت شحن</option>
                </select>
              </div>

              <button
                onClick={handleGenerateVouchers}
                className="mt-5 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>إصدار وتوليد الأكواد الآن</span>
              </button>

              {generatedVouchers.length > 0 && (
                <button
                  onClick={handleCopyVouchers}
                  className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {copiedAll ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAll ? 'تم نسخ جميع الأكواد ✓' : 'نسخ الأكواد كلها'}</span>
                </button>
              )}
            </div>
          </div>

          {/* GENERATED CODES GRID */}
          {generatedVouchers.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-black text-slate-900 text-sm">الأكواد الصادرة ({generatedVouchers.length} كارت):</span>
                <span className="text-xs text-emerald-600 font-bold">جاهزة للطباعة والتوزيع في السنتر ✓</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {generatedVouchers.map((code, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-xs text-slate-900 hover:border-rose-300 transition">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 👥 TAB 4: STUDENT ROSTER & GRADES TRACKING */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-slide-up">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-gray-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500">الطلاب المسجلين</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900">{filteredStudents.length} طالب</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500">متوسط إتمام المنهج</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-900">
                  {Math.round(filteredStudents.reduce((a, s) => a + s.progress, 0) / (filteredStudents.length || 1))}%
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500">متوسط درجات التمارين</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-teal-900">
                  {Math.round(filteredStudents.reduce((a, s) => a + s.score, 0) / (filteredStudents.length || 1))}%
                </span>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Roster Container */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="ابحث باسم الطالب، رقم الهاتف، أو البريد..."
                    className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute top-2.5 right-3" />
                </div>

                <select
                  value={rosterBookFilter}
                  onChange={(e) => setRosterBookFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="all">📚 جميع المقررات الدراسية</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>طباعة كشف الدرجات 🖨️</span>
              </button>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <th className="p-3.5 rounded-r-xl">بيانات الطالب</th>
                    <th className="p-3.5">المقرر المسجل</th>
                    <th className="p-3.5">إتمام الفصول</th>
                    <th className="p-3.5">درجة التمارين</th>
                    <th className="p-3.5">آخر نشاط</th>
                    <th className="p-3.5 rounded-l-xl">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        لا يوجد طلاب مطابقين لمعايير البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-700 font-black text-xs flex items-center justify-center shrink-0">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{st.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{st.phone} • {st.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-700">{st.bookTitle}</span>
                        </td>
                        <td className="p-3.5 min-w-[120px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-600">{st.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all"
                                style={{ width: `${st.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              st.score >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : st.score >= 75
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {st.score}%
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px] font-medium">
                          {st.lastActive}
                        </td>
                        <td className="p-3.5">
                          <span className="text-xs font-bold">{st.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstructorDashboard;
