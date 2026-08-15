import React, { useState } from 'react';
import { ShoppingCart, CheckCircle2, ShieldCheck, Sparkles, X, BookOpen, Radio, HelpCircle, Zap, CreditCard, Lock } from 'lucide-react';
import { MarketplaceBook } from '../types';

interface PurchaseModalProps {
  book: MarketplaceBook;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurchase: (book: MarketplaceBook) => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  book,
  isOpen,
  onClose,
  onConfirmPurchase
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Purchase error:", e);
      setIsProcessing(false);
    }
  };

  const formattedPrice = book.price ? `${book.price} ج.م` : 'مجاني';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-3xl animate-scale-up">
        
        {/* TOP ACCENT HEADER */}
        <div className="relative p-6 text-white bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
          <button
            onClick={onClose}
            className="absolute p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full top-4 left-4 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-xs font-black bg-white/15 text-amber-300 rounded-full border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>فتح الوصول الكامل للمحتوى التفاعلي</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black line-clamp-2 leading-snug">
            {book.title}
          </h3>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            المؤلف: {book.author_name || 'خبير المحتوى التعليمي'}
          </p>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 space-y-6">
          
          {/* PRICE CARD */}
          <div className="flex items-center justify-between p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
            <div>
              <span className="text-xs text-gray-500 font-bold block">قيمة الاشتراك / الشراء:</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-900">{formattedPrice}</span>
            </div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                وصول دائم غير محدود
              </span>
            </div>
          </div>

          {/* WHAT'S INCLUDED IN THIS BOOK */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">ماذا يشمل هذا المقرر؟</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-gray-700">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>جميع فصول وشروحات الكتاب</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <Radio className="w-4 h-4 text-purple-600 shrink-0" />
                <span>البودكاست الصوتي التفاعلي</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>بنك الأسئلة والامتحانات الموقوتة</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <Zap className="w-4 h-4 text-rose-600 shrink-0" />
                <span>خرائط المفاهيم والبطاقات الذكية</span>
              </div>
            </div>
          </div>

          {/* GUARANTEE BADGE */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>شراء آمن ومحفوظ في حسابك السحابي، يمكنك قراءته والاستماع إليه في أي وقت ومن أي جهاز.</span>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handlePurchase}
            disabled={isProcessing || isSuccess}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
              isSuccess
                ? 'bg-emerald-600 shadow-emerald-200'
                : isProcessing
                ? 'bg-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-200 active:scale-95'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                <span>تم تأكيد الشراء وفتح المقرر بنجاح! 🎉</span>
              </>
            ) : isProcessing ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري معالجة الشراء وفتح الفصول...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>تأكيد الشراء والفتح الفوري ({formattedPrice})</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
