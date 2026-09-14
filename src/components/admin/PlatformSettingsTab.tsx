import React, { useState } from 'react';
import { 
  Sliders, Shield, Globe, Eye, EyeOff, Save, CheckCircle2, 
  Sparkles, Phone, Mail, MessageCircle, Building2, User, RefreshCw, 
  Smartphone, Award, Wallet, Palette
} from 'lucide-react';
import { 
  getPlatformConfig, 
  savePlatformConfig, 
  PlatformConfig, 
  DEFAULT_PLATFORM_CONFIG 
} from '../../services/platformConfigService';

export const PlatformSettingsTab: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof PlatformConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    savePlatformConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_PLATFORM_CONFIG);
    savePlatformConfig(DEFAULT_PLATFORM_CONFIG);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>إعدادات وهوية المنصة والتحكم في الميزات (White-Label Admin)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Live Switch
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تحكم في هوية المنصة والمسميات، وأخفِ أو أظهر أي ميزة (Reels, XP, روبوت الذكاء الاصطناعي) بنقرة زر واحدة فوراً.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-lg cursor-pointer ${
            savedSuccess 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white'
          }`}
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ الإعدادات وتطبيقها!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات فوراً</span>
            </>
          )}
        </button>
      </div>

      {/* 🏢 BRANDING & IDENTITY (تخصيص اسم المنصة واللوجو والشركة) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>هوية المنصة واللوجو (Brand Identity & White-Label):</span>
          </h3>
          <span className="text-[11px] text-slate-400">تعديل اسم المنصة والشعار يظهر فوراً لجميع المستخدمين</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">اسم المنصة الرئيسي (Brand Name):</label>
            <input
              type="text"
              value={config.brandName}
              onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
              placeholder="مثال: أوسيرا AI"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">الوصف والترويسة الفرعية:</label>
            <input
              type="text"
              value={config.brandSubtitle}
              onChange={(e) => setConfig({ ...config, brandSubtitle: e.target.value })}
              placeholder="مثال: المنصة الذكية للكتب والمذكرات التعليمية"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">رابط الشعار أو اللوجو (Logo URL):</label>
            <input
              type="url"
              value={config.brandLogoUrl || ''}
              onChange={(e) => setConfig({ ...config, brandLogoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">اسم الشركة المطورة / الناشرة:</label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="مثال: شركة أوسيرا سوفت للحلول الذكية"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">المشرف / الجهة المنفذة:</label>
            <input
              type="text"
              value={config.founderName}
              onChange={(e) => setConfig({ ...config, founderName: e.target.value })}
              placeholder="مثال: فريق أوسيرا سوفت للذكاء الاصطناعي"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">رقم هاتف الدعم الفني وواتساب:</label>
            <input
              type="text"
              value={config.supportPhone}
              onChange={(e) => setConfig({ ...config, supportPhone: e.target.value, whatsappNumber: e.target.value })}
              placeholder="+201066906132"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني للدعم:</label>
            <input
              type="email"
              value={config.supportEmail}
              onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
              placeholder="support@osera-ai.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">نص حقوق الملكية (Copyright):</label>
            <input
              type="text"
              value={config.copyrightText}
              onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
              placeholder="جميع الحقوق محفوظة © 2026"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* 💰 FINANCIAL & COMMISSION SETTINGS (إعدادات العمولات والخطط وسحب الأرباح) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>السياسة المالية، العمولات وسحب الأرباح (Financial & Commission Rules):</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-bold">تطبق فورياً على كافة عمليات الدفع والسحب القادمة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">نسبة عمولة المنصة من مبيعات المعلمين (%):</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="90"
                value={config.platformCommissionRate ?? 15}
                onChange={(e) => setConfig({ ...config, platformCommissionRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-emerald-400 font-black text-sm outline-none focus:border-emerald-500 transition"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[10px] text-slate-400">تخصم من مبيعات المعلم تلقائياً (الأدمن معفى بنسبة 0%).</p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">الحد الأدنى لطلب سحب الأرباح (ج.م):</label>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="50"
                value={config.minWithdrawalAmount ?? 100}
                onChange={(e) => setConfig({ ...config, minWithdrawalAmount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-amber-400 font-black text-sm outline-none focus:border-amber-500 transition"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
            </div>
            <p className="text-[10px] text-slate-400">أقل مبلغ يمكن للمعلم طلب تحويله لمحفظته أو حسابه.</p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300">تكلفة توليد الكتاب بالـ AI (Credits / ج.م):</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={config.bookGenerationCost ?? 50}
                onChange={(e) => setConfig({ ...config, bookGenerationCost: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-sky-400 font-black text-sm outline-none focus:border-sky-500 transition"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">رصيد</span>
            </div>
            <p className="text-[10px] text-slate-400">الرصيد المخصوم من المعلم عند بناء كتاب تفاعلي جديد.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black text-white">إعدادات بوابة PayPal الدولية (PayPal REST API & Credentials):</h4>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
              دفع دولي بالدولار ($)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300">الحد الأدنى لعملية الدفع بـ PayPal ($ USD):</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={config.minPayPalAmountUsd ?? 10}
                  onChange={(e) => setConfig({ ...config, minPayPalAmountUsd: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-indigo-400 font-black text-sm outline-none focus:border-indigo-500 transition"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$ USD</span>
              </div>
              <p className="text-[10px] text-slate-400">أقل قيمة يُقبل تحصيلها عبر PayPal (افتراضياً 10$).</p>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300">PayPal Client ID:</label>
              <input
                type="text"
                value={config.paypalClientId || ''}
                onChange={(e) => setConfig({ ...config, paypalClientId: e.target.value })}
                placeholder="ألصق Client ID من حسابك في PayPal Developer"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-mono text-[11px] outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[10px] text-slate-400">من لوحة تحكم PayPal Developer (Live أو Sandbox).</p>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300">PayPal Client Secret:</label>
              <input
                type="password"
                value={config.paypalClientSecret || ''}
                onChange={(e) => setConfig({ ...config, paypalClientSecret: e.target.value })}
                placeholder="ألصق Secret Key من PayPal Developer"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white font-mono text-[11px] outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[10px] text-slate-400">المفتاح السري لتأكيد المعاملات واستلام الأموال.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <div>
            <h4 className="text-xs font-bold text-white">تفعيل الدفع المباشر من رصيد المحفظة (1-Click Wallet Checkout):</h4>
            <p className="text-[10px] text-slate-400">السماح للطلاب بشراء المقررات مباشرة باستخدام رصيدهم المشحون مسبقاً.</p>
          </div>
          <button
            onClick={() => setConfig({ ...config, allowWalletPayment: !config.allowWalletPayment })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              config.allowWalletPayment ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                config.allowWalletPayment ? 'left-1' : 'right-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 🗺️ BRAND SYNCHRONIZATION IMPACT MAP (خريطة التأثيرات الشاملة عند تغيير اسم وهوية المنصة) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-teal-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-black text-white">
              الأماكن والمكونات المرتبطة التي تتحدث تلقائياً فور تعديل اسم وهوية المنصة:
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
            ربط ديناميكي شامل 100%
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          عند تعديل اسم المنصة (Brand Name) أو الوصف أو بيانات الشركة في هذا النموذج والضغط على <strong>حفظ التعديلات</strong>، يقوم المحرك تلقائياً بتحديث الهوية في كافة أجزاء النظام التالية دون الحاجة لتعديل أي كود برمجي:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-black text-xs">
              <span>1. تبويب المتصفح والـ SEO</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              تحديث عنوان المتصفح (<code>document.title</code>)، وسوم الـ SEO و OpenGraph ومحركات بحث جوجل.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-black text-xs">
              <span>2. شاشات تسجيل الدخول</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              نافذة <code>AuthModal</code> (تسجيل الدخول وإنشاء حساب جديد) والترويسة الترحيبية للطلاب والمعلمين.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-black text-xs">
              <span>3. ترويسة الموقع وشعار الهيدر</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              النافبار الرئيسي والشعار الأيقوني والأزرار العلوية في كافة صفحات المنصة.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
              <span>4. التذييل والملكية الفكرية</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              شريط حقوق النشر (Footer Copyrights)، اسم الشركة، أرقام الدعم الفني ورابط واتساب.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs">
              <span>5. مشغل الكتب والمذكرات</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              أشرطة حماية الـ DRM، وترويسة قارئ المقررات التفاعلية، والعلامة المائية للأمان.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-black text-xs">
              <span>6. المعلم الذكي والـ AI Tutor</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              اسم روبوت الشرح التفاعلي، ورسائل المساعد الذكي لمقررات STEM والملخصات.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs">
              <span>7. ورقة الامتحانات المطبوعة</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              ترويسة ورقة الاختبار للطباعة A4 وشعار المنصة الأكاديمي الرسمي.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-black text-xs">
              <span>8. استوديو ريلز المعرفة</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              أشرطة الفيديو وهوية استوديو EduReels والبطاقات التلخيصية للفصول.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>استعادة الإعدادات الافتراضية لأوسيرا AI</span>
        </button>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق الإعدادات الحالية</span>
        </button>
      </div>

    </div>
  );
};

export default PlatformSettingsTab;
