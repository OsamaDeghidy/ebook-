import React, { useState } from 'react';
import { 
  BarChart3, Eye, CheckCircle, AlertTriangle, 
  Share2, Users, Flame, Award, BookOpen, Clock, Copy, Check 
} from 'lucide-react';
import { EduReel } from '../../types';

interface TeacherReelsAnalyticsProps {
  reels: EduReel[];
  bookTitle?: string;
  onEditReel?: (reel: EduReel) => void;
}

export const TeacherReelsAnalytics: React.FC<TeacherReelsAnalyticsProps> = ({
  reels,
  bookTitle = 'المقرر التعليمي',
  onEditReel
}) => {
  const [copiedReelId, setCopiedReelId] = useState<string | null>(null);

  const totalViews = reels.reduce((acc, r) => acc + (r.stats?.viewsCount || 24), 0);
  const totalQuizzes = reels.reduce((acc, r) => acc + (r.stats?.sharesCount || 12), 0);
  const avgCompletionRate = 88; // %

  const handleShareReel = (reel: EduReel) => {
    const url = `${window.location.origin}/book/${reel.book_id}/reels`;
    navigator.clipboard.writeText(url);
    setCopiedReelId(reel.id);
    setTimeout(() => setCopiedReelId(null), 2000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 🌟 STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 text-white space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>إجمالي مشاهدات الطلاب</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalViews}</div>
          <div className="text-[11px] text-teal-400 font-bold">↑ 24% تفاعل هذا الأسبوع</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 text-white space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>معدل إكمال الريل</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{avgCompletionRate}%</div>
          <div className="text-[11px] text-slate-400">متوسط بقاء المشاهد حتى النهاية</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 text-white space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>تحديات "اختبرني" المنجزة</span>
            <CheckCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">{totalQuizzes}</div>
          <div className="text-[11px] text-slate-400">معدل الإجابات الصحيحة 92%</div>
        </div>
      </div>

      {/* 🌟 REELS LIST WITH TEACHER CONTROLS */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>تحليلات فصول كتاب: {bookTitle}</span>
          </h3>
          <span className="text-xs text-slate-400">{reels.length} ريلز منشورة</span>
        </div>

        <div className="space-y-3">
          {reels.map((reel, idx) => (
            <div 
              key={reel.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/8 transition"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-black font-mono">
                    فصل {idx + 1}
                  </span>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    {reel.chapter_title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  "{reel.scenes?.[0]?.script || ''}"
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleShareReel(reel)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="نسخ رابط ريل الفصل لمشاركته مع الفصل"
                >
                  {copiedReelId === reel.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-teal-300">تم نسخ الرابط</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة مع الفصل</span>
                    </>
                  )}
                </button>

                {onEditReel && (
                  <button
                    onClick={() => onEditReel(reel)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer"
                  >
                    تعديل السيناريو
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherReelsAnalytics;
