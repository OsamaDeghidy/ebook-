import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, GraduationCap, Compass, ArrowLeft, ArrowRight, Star,
  ShieldCheck, Zap, Radio, Clock, Award, Users, CheckCircle2, Play,
  Search, BookMarked, Phone, Mail, Globe, Layers, Laptop, Code2, Brain,
  Briefcase, HeartHandshake, ChevronLeft, Lock, ArrowUpRight
} from 'lucide-react';
import { MarketplaceBook } from '../types';
import { MAIN_CATEGORIES } from '../constants/taxonomy';
import { getPlatformConfig, PlatformConfig } from '../services/platformConfigService';

interface LandingPageViewProps {
  books: MarketplaceBook[];
  onOpenAuth: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  books,
  onOpenAuth
}) => {
  const navigate = useNavigate();
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfig());

  React.useEffect(() => {
    const handleConfigChange = (e: any) => {
      setPlatformConfig(e.detail || getPlatformConfig());
    };
    window.addEventListener('platform-config-changed', handleConfigChange);
    return () => window.removeEventListener('platform-config-changed', handleConfigChange);
  }, []);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setPhoneSubmitted(true);
    setTimeout(() => {
      onOpenAuth();
    }, 800);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featuredBooks = books.slice(0, 4);

  return (
    <div className="w-full text-right font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden" dir="rtl">

      {/* 🌟 TOP ANNOUNCEMENT TICKER */}
      <div className="bg-gradient-to-r from-teal-700 via-indigo-900 to-teal-800 text-white text-[11px] sm:text-xs font-bold py-2.5 px-3 sm:px-4 text-center border-b border-teal-500/30 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse shrink-0" />
        <span>منصة {platformConfig.brandName} التعليمية | {platformConfig.brandSubtitle || 'بوابتك للتعلم الذكي والأبسط'}</span>
        <button
          onClick={() => navigate('/marketplace')}
          className="bg-white/20 hover:bg-white/30 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-black text-teal-200 transition shrink-0"
        >
          تصفح المتجر ←
        </button>
      </div>

      {/* 🚀 HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-teal-50/60 via-white to-white">
        {/* Subtle Background Blobs */}
        <div className="absolute top-10 -left-20 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* HERO TEXT COLUMN */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-black shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>الجيل القادم من منصات التعليم التفاعلي LMS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.25] tracking-tight">
                تعلّم بذكاء.. واكتشف شغفك{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">
                  بأبسط طريقة ممكنة!
                </span>
              </h1>

              {/* Sub-headline (From Client Brief) */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                <strong className="text-slate-900 font-black">{platformConfig.brandName}</strong> هي منصة متكاملة تجمع بين المناهج التعليمية الأكاديمية والمراجعات الشاملة، وبين الكورسات الحرة لتطوير المهارات الحياتية والمهنية. محتوى مركز، شروحات مبسطة، وتجربة تعليمية ممتعة بالذكاء الاصطناعي .
              </p>



              {/* Dual CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-8 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-teal-600/20 hover:shadow-teal-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>ابدأ التعلم الآن مجاناً</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('gateways')}
                  className="px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-black text-sm sm:text-base rounded-2xl border-2 border-slate-200 shadow-xs transition hover:border-slate-300 flex items-center gap-2"
                >
                  <Compass className="w-5 h-5 text-teal-600" />
                  <span>تصفح المسارات والأقسام</span>
                </button>
              </div>

              {/* Mini Social Proof */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>+10,000 طالب ومستفيد</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>5.0 تقييم أكاديمي معتمد</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-purple-600" />
                  <span>بودكاست ذكي (كريم وفرح)</span>
                </div>
              </div>
            </div>

            {/* HERO VISUAL MOCKUP COLUMN */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">

                {/* Visual Glass Frame Card */}
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-2xl shadow-slate-900/10 space-y-5">

                  {/* Card Header with Logo */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-500/30">
                        {platformConfig.brandName ? platformConfig.brandName.charAt(0) : 'O'}
                      </div>
                      <div>
                        <h4 className="font-black text-base text-slate-900 tracking-tight">{platformConfig.brandName}</h4>
                        <p className="text-[10px] text-teal-600 font-bold">{platformConfig.brandSubtitle || 'LMS Learning Platform'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                      تفاعلي 100%
                    </span>
                  </div>

                  {/* Feature Interactive Showcase Mockup */}
                  <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-teal-300 font-black flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                        استوديو البودكاست التعليمي
                      </span>
                      <span className="text-[10px] text-slate-300">كريم & فرح AI</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "أهلاً بكم في درس اليوم! سنستعرض معاً أهم المفاهيم بطريقة حوارية مبسطة وأسئلة تفاعلية فورية..."
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 w-2/3 rounded-full" />
                      </div>
                      <span className="text-[10px] text-teal-300 font-bold font-mono">03:45 / 05:20</span>
                    </div>
                  </div>

                  {/* Quick Feature Bento Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => navigate('/reels')}
                      className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50/70 border border-purple-200/80 rounded-2xl text-right space-y-1 group hover:border-purple-400 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🎬</span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-600 text-white animate-pulse">
                          جديد
                        </span>
                      </div>
                      <h5 className="font-black text-xs text-purple-950 group-hover:text-purple-700 transition">ريلز المعرفة (60s)</h5>
                      <p className="text-[10px] text-purple-700 font-medium leading-tight">كبسولات سريعة وشروحات مركزة</p>
                    </button>

                    <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-2xl text-right space-y-1">
                      <Brain className="w-4 h-4 text-teal-600" />
                      <h5 className="font-black text-xs text-slate-800">خرائط ومفاهيم ذكية</h5>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">تلخيص تفاعلي لكل درس</p>
                    </div>

                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-right space-y-1">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <h5 className="font-black text-xs text-slate-800">امتحانات ذكية موقوتة</h5>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">تصحيح فوري وشهادات معتمدة</p>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-right space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span>🦉</span>
                        <span className="font-black text-amber-900">المعلم الذكي AI</span>
                      </div>
                      <h5 className="font-black text-xs text-slate-800">شرح أي مسألة أو كود</h5>
                      <p className="text-[10px] text-amber-700 font-medium leading-tight">إجابات دقيقة وأمثلة حية</p>
                    </div>
                  </div>

                  {/* Action link */}
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>استكشف مكتبة المقررات الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5 text-teal-200" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🚪 SECTION: THE TWO MAIN GATEWAYS (واجهتنا الرئيسية - من البريف) */}
      <section id="gateways" className="py-16 bg-slate-50/80 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-teal-600 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full">
              بوابات التعليم
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              واجهتنا الرئيسية: اختر مسارك التعليمي
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              صممت منصة {platformConfig.brandName} لتلبي احتياجات الطلاب الأكاديميين والباحثين عن تطوير المهارات المهنية والذاتية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* GATEWAY 1: ACADEMIC (البوابة الأكاديمية والمراجعات الشاملة) */}
            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition">
                    البوابة الأكاديمية والمراجعات الشاملة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                    مناهج ومقررات المدارس والجامعات، بنوك أسئلة موقوتة، مذكرات المراجعة النهائية، وخرائط المفاهيم للمراحل الابتدائية والإعدادية والثانوية والجامعية.
                  </p>
                </div>

                {/* Sub-tags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-bold">
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                    الرياضيات والإحصاء
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                    العلوم والفيزياء
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                    اللغة العربية واللغات
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                    الامتحانات وبنوك الأسئلة
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/marketplace')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <span>استكشف البوابة الأكاديمية والمقررات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* GATEWAY 2: SKILLS & GENERAL COURSES (بوابة الكورسات وتطوير المهارات) */}
            <div className="bg-white border-2 border-indigo-500/40 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:border-indigo-500 transition-all duration-300 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                  <Laptop className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-700 transition">
                    بوابة الكورسات وتطوير المهارات
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                    كورسات تطبيقية مكثفة في مجالات سوق العمل المستقبلية: الذكاء الاصطناعي، البرمجة، إدارة الأعمال، التسويق الرقمي، تطوير الذات، واللغات العالمية.
                  </p>
                </div>

                {/* Sub-tags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-bold">
                  <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
                    البرمجة والذكاء الاصطناعي
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
                    إدارة الأعمال والتسويق
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
                    تطوير الذات والقيادة
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
                    اللغات والترجمة
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/marketplace')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                <span>استكشف كورسات المهارات الحرة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 📚 SECTION: 10 MAIN CATEGORIES CATALOG */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-black text-teal-600 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full">
                أقسام المكتبة والمقررات
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                استكشف الـ 10 مجالات التعليمية الشاملة
              </h2>
            </div>

            <button
              onClick={() => navigate('/marketplace')}
              className="text-xs font-black text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
            >
              <span>عرض جميع الكتب في المتجر ({books.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MAIN_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                onClick={() => navigate('/marketplace')}
                className="p-5 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-300 rounded-3xl cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 group-hover:border-teal-200 text-teal-600 flex items-center justify-center font-black text-sm shadow-xs">
                    {idx + 1}
                  </div>
                  <h4 className="font-black text-sm text-slate-900 group-hover:text-teal-900 transition">
                    {cat.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 pt-2 border-t border-slate-200/60">
                  <span>تصفح القسم</span>
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🏆 SECTION: WHY CHOOSE SIMPLEST (لماذا تختار simplest؟ - من البريف) */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">

          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-black text-teal-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/10">
              القيمة والتميز
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              لماذا تختار منصة {platformConfig.brandName}؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              صممت المنصة لتقديم تجربة تعليمية ذكية، ممتعة، وميسرة تناسب جميع المراحل.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* PILLAR 1 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-white">محتوى معتمد ومبسّط</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                مقررات دراسية محكمة ومراجعة علمياً لضمان دقة المعلومة ويسر استيعابها بالذكاء الاصطناعي.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-white">مسارات تعليمية مرنة</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تغطية كاملة للمدارس الحكومية، التجريبية اللغات، الشهادات الدولية (أمريكي، بريطاني، فرنسي)، والجامعات.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-white">استوديو البودكاست التفاعلي</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                استمع لشروحات حوارية صوتية شيقة تحول المناهج الجافة إلى حوار ممتع يعزز الذاكرة السمعية.
              </p>
            </div>

            {/* PILLAR 4 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-white">سريعة، بسيطة، وآمنة</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تجربة مستخدم فائقة السلاسة، دخول سريع بالحساب، وتوافق تام مع كل الأجهزة والشاشات.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* 🏛️ OFFICIAL FOOTER (بيانات شركة Osera AI المعتمدة) */}
      <footer className="bg-slate-950 text-slate-300 text-xs border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* BRAND INFO */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {platformConfig.brandName ? platformConfig.brandName.charAt(0) : 'O'}
                </div>
                <div>
                  <h4 className="font-black text-base text-white tracking-tight">{platformConfig.brandName}</h4>
                  <p className="text-[11px] text-teal-400 font-bold">{platformConfig.brandSubtitle || 'منظومة التعليم الذكي LMS'}</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                منظومة التعليم وإدارة التعلم الإلكتروني الذكية (LMS) التابعة لـ <strong className="text-white">{platformConfig.companyName}</strong>.
              </p>
            </div>

            {/* CONTACT DETAILS */}
            <div className="space-y-2.5">
              <h5 className="font-black text-white text-xs">بيانات التواصل والدعم</h5>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                {platformConfig.supportPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    <span dir="ltr">{platformConfig.supportPhone}</span>
                  </div>
                )}
                {platformConfig.supportEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-teal-400" />
                    <span>{platformConfig.supportEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>www.ebook.osera-ai.com</span>
                </div>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="space-y-2.5">
              <h5 className="font-black text-white text-xs">روابط سريعة</h5>
              <ul className="space-y-1.5 text-[11px] text-slate-400 font-bold">
                <li>
                  <button onClick={() => navigate('/marketplace')} className="hover:text-teal-300 transition">
                    متجر ومكتبة المقررات
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('gateways')} className="hover:text-teal-300 transition">
                    المسارات الأكاديمية
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('gateways')} className="hover:text-teal-300 transition">
                    كورسات تطوير المهارات
                  </button>
                </li>
                <li>
                  <button onClick={onOpenAuth} className="hover:text-teal-300 transition">
                    تسجيل الدخول والطلاب
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* COPYRIGHT */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-bold">
            <p>{platformConfig.copyrightText || `© ${new Date().getFullYear()} ${platformConfig.brandName} | جميع الحقوق محفوظة لشركة ${platformConfig.companyName}`}</p>
            <p>مؤسس المنصة: {platformConfig.founderName}</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
