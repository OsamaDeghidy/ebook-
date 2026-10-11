import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, Download, Copy, Check, ExternalLink, X, 
  Sparkles, ShieldCheck, BookOpen, Smartphone, Printer
} from 'lucide-react';
import { MarketplaceBook } from '../../types';

interface BookQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: MarketplaceBook;
  isOwned?: boolean;
}

export const BookQrCodeModal: React.FC<BookQrCodeModalProps> = ({
  isOpen,
  onClose,
  book,
  isOwned = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Compute destination URL
  // If book is paid and user doesn't own it, redirect to book view / purchase page
  // If book is free or owned, link directly to reading view
  const isPaid = Number(book.price) > 0 && !book.is_free;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = isPaid && !isOwned
    ? `${baseUrl}/book/${book.id}`
    : `${baseUrl}/book/${book.id}?tab=read`;

  useEffect(() => {
    if (!isOpen || !book.id) return;

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(targetUrl, {
      width: 420,
      margin: 2,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUrl, book.id]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const sanitizedTitle = (book.title || 'book').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    link.download = `QR_${sanitizedTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 text-right relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">كود QR الذكي للكتاب 📲</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                سريع ومباشر
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{book.title}</p>
          </div>
        </div>

        {/* QR Code Canvas Box */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border border-slate-200 shadow-inner relative group">
          {isGenerating ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">جاري إنشاء الباركود...</span>
            </div>
          ) : qrDataUrl ? (
            <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200/80">
              <img 
                src={qrDataUrl} 
                alt={`QR code for ${book.title}`} 
                className="w-56 h-56 rounded-xl object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white/95 shadow-md border border-teal-400 flex items-center justify-center p-1.5">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs font-bold">
              فشل إنشاء الكود
            </div>
          )}

          <div className="mt-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-700">
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span>امسح بكاميرا الهاتف للفتح الفوري</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isPaid && !isOwned ? 'يوجه لصفحة تفاصيل وشراء الكتاب' : 'يوجه مباشرة لتصفح وقراءة فصول المنهج'}
            </p>
          </div>
        </div>

        {/* Book summary pill */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 line-clamp-1">{book.title}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
            isPaid 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isPaid ? `${book.price} ج.م` : 'مجاني بالكامل'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl || isGenerating}
            className="p-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>تحميل صورة (PNG)</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 border border-slate-200 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">تم نسخ الرابط!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>نسخ الرابط المباشر</span>
              </>
            )}
          </button>
        </div>

        {/* Print note */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center">
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>يمكنك طباعة الكود ووضعه على المذكرة الورقية ليصل الطالب للشرح التفاعلي مباشرة</span>
        </div>
      </div>
    </div>
  );
};
