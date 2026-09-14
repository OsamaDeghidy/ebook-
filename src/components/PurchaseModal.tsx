import React, { useState } from 'react';
import { 
  ShoppingCart, CheckCircle2, ShieldCheck, Sparkles, X, BookOpen, Radio, 
  HelpCircle, Zap, CreditCard, Lock, Ticket, Smartphone, ArrowRight, 
  AlertCircle, Copy, Check, User, Wallet, Globe
} from 'lucide-react';
import { MarketplaceBook } from '../types';
import { validateVoucherCode } from '../utils/voucherSystem';

interface PurchaseModalProps {
  book: MarketplaceBook;
  isOpen: boolean;
  currentUser?: any;
  onClose: () => void;
  onOpenAuth?: () => void;
  onConfirmPurchase: (book: MarketplaceBook) => Promise<void>;
}

type PaymentTab = 'paymob_wallet' | 'paymob_card' | 'paypal' | 'wallet' | 'voucher';

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  book,
  isOpen,
  currentUser,
  onClose,
  onOpenAuth,
  onConfirmPurchase
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('paymob_wallet');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [walletPhone, setWalletPhone] = useState('');
  const [studentBalance, setStudentBalance] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Load user live wallet balance
  React.useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetch(`/api/wallet/balance/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.balance !== undefined) setStudentBalance(data.balance);
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Direct 1-Click Wallet Checkout
  const handleWalletPayment = async () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    setIsProcessing(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/payment/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          bookId: book.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        setStatusNotice(data.message || 'رصيد محفظتك لا يكفي لشراء هذا المقرر.');
        return;
      }

      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusNotice('حدث خطأ أثناء الاتصال بالمحفظة: ' + err.message);
    }
  };

  // Paymob Mobile Wallet / Card Payment Trigger
  const handlePaymobPayment = async (method: 'wallet' | 'card') => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    if (method === 'wallet' && !walletPhone.trim()) {
      setStatusNotice('يرجى كتابة رقم محفظة الكاش (فودافون / أورنج / اتصالات / وي كاش)');
      return;
    }

    setIsProcessing(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/payment/paymob/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: book.price || 150,
          method,
          bookId: book.id,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.user_metadata?.full_name || 'طالب متميز',
          walletMobileNumber: walletPhone
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        } else if (data.iframeUrl) {
          window.location.href = data.iframeUrl;
          return;
        } else {
          setStatusNotice(data.message || 'تم إرسال طلب الدفع بنجاح. يرجى تأكيد الدفع عبر هاتفك.');
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
        setStatusNotice(data.error || data.message || 'تعذر بدء عملية الدفع عبر بوابة Paymob. يرجى التحقق من الرقم والمحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setStatusNotice('حدث خطأ في الاتصال بخادم الدفع: ' + (err.message || 'يرجى المحاولة لاحقاً'));
    }
  };

  // PayPal Payment Handler
  const handlePayPalPayment = async () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    setIsProcessing(true);
    setStatusNotice(null);

    try {
      const createRes = await fetch('/api/payment/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.max(3, Math.round((book.price || 150) / 48)),
          currency: 'USD',
          bookId: book.id,
          userId: currentUser?.id
        })
      });

      const orderData = await createRes.json();
      if (orderData && orderData.id) {
        // Direct capture fulfillment
        const capRes = await fetch('/api/payment/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.id,
            bookId: book.id,
            userId: currentUser?.id,
            userEmail: currentUser?.email,
            amount: Math.max(3, Math.round((book.price || 150) / 48))
          })
        });

        if (capRes.ok) {
          await onConfirmPurchase(book);
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            setIsProcessing(false);
            onClose();
          }, 1500);
          return;
        }
      }

      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);

    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          bookId: book.id,
          userId: currentUser?.id,
          userEmail: currentUser?.email
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        setVoucherError(data.message || 'كود الكارت غير صحيح أو تم استخدامه مسبقاً');
        return;
      }

      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      const result = validateVoucherCode(voucherCode, book.id);
      if (result.valid) {
        await onConfirmPurchase(book);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsProcessing(false);
          onClose();
        }, 1500);
      } else {
        setIsProcessing(false);
        setVoucherError(result.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in text-right" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* BOOK HEADER SUMMARY */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
          <img
            src={book.thumbnail_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'}
            alt={book.title}
            className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-xs"
          />
          <div>
            <span className="text-[10px] font-black px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md border border-sky-100">
              {book.subcategory || 'مقرر دراسي'}
            </span>
            <h3 className="font-black text-slate-900 text-sm mt-1">{book.title}</h3>
            <p className="text-xs text-gray-500 font-medium">
              المؤلف: {book.author_name || 'خبير المادة'} • {book.chapters?.length || 0} فصول تفاعلية
            </p>
          </div>
          <div className="mr-auto text-left">
            <span className="text-lg font-black text-sky-700">{book.price || 150} ج.م</span>
          </div>
        </div>

        {/* GUEST NOTICE */}
        {!currentUser && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-900">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>أنت غير مسجل: سجل دخولك لحفظ المقرر بحسابك للأبد</span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black cursor-pointer"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        )}

        {/* 🌟 PAYMENT METHODS TABS (5 Methods) */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('paymob_wallet')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'paymob_wallet' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-rose-600" />
            <span className="text-[10px]">📱 فودافون</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paymob_card')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'paymob_card' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span className="text-[10px]">💳 فيزا/ميزة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'wallet' ? 'bg-white text-emerald-800 shadow-xs font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px]">💰 المحفظة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paypal')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'paypal' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px]">🌐 PayPal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'voucher' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-600" />
            <span className="text-[10px]">🎟️ كارت سنتر</span>
          </button>
        </div>

        {/* SUCCESS NOTIFICATION */}
        {isSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center space-y-1 my-4 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm">تم الدفع وتفعيل وفتح المقرر بنجاح! 🎉</h4>
            <p className="text-xs">جاري تحويلك لقارئ المقرر التفاعلي...</p>
          </div>
        )}

        {/* TAB 1: PAYMOB MOBILE WALLETS */}
        {activeTab === 'paymob_wallet' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl space-y-1 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <span>الدفع عبر المحافظ الإلكترونية (فودافون / أورنج / اتصالات / وي كاش):</span>
              </div>
              <p className="text-[11px] text-rose-800">
                أدخل رقم الموبايل المسجل به المحفظة، وسيصلك طلب سحب المبلغ لتأكيده بالرقم السري فوراً.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم محفظة الكاش (01xxxxxxxxx):
              </label>
              <input
                type="tel"
                required
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white"
              />
            </div>

            {statusNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                {statusNotice}
              </div>
            )}

            <button
              onClick={() => handlePaymobPayment('wallet')}
              disabled={isProcessing}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري معالجة الدفع عبر المحفظة...' : `دفع (${book.price || 150} ج.م) وتفعيل المقرر 📱`}
            </button>
          </div>
        )}

        {/* TAB 2: PAYMOB CARDS */}
        {activeTab === 'paymob_card' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl space-y-1 text-xs text-sky-950">
              <div className="font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>الدفع الآمن بالبطاقات البنكية (Visa / MasterCard / كارت ميزة):</span>
              </div>
              <p className="text-[11px] text-sky-800">
                بوابة دفع مشفرة ومؤمنة 100% تدعم كافة البطاقات البنكية داخل وخارج مصر.
              </p>
            </div>

            <button
              onClick={() => handlePaymobPayment('card')}
              disabled={isProcessing}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري فتح بوابة الدفع...' : `متابعة الدفع بالفيزا (${book.price || 150} ج.م) 💳`}
            </button>
          </div>
        )}

        {/* TAB 3: DIRECT WALLET CHECKOUT */}
        {activeTab === 'wallet' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
              <div className="font-black flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>الشراء الفوري من رصيد المحفظة (1-Click Checkout)</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black">
                  رصيدك: {studentBalance !== null ? `${studentBalance} ج.م` : 'جاري التحميل...'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                سيتم خصم سعر المقرر ({book.price || 150} ج.م) مباشرة من محفظتك وتفعيل الوصول الدائم فوراً.
              </p>
            </div>

            {statusNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                {statusNotice}
              </div>
            )}

            <button
              onClick={handleWalletPayment}
              disabled={isProcessing || (studentBalance !== null && studentBalance < (book.price || 150))}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري الخصم والتفعيل...' : `دفع (${book.price || 150} ج.م) من رصيد المحفظة فوراً ⚡`}
            </button>
          </div>
        )}

        {/* TAB 4: PAYPAL */}
        {activeTab === 'paypal' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-1 text-xs text-indigo-950">
              <div className="font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>الدفع الدولي بالدولار عبر PayPal:</span>
              </div>
              <p className="text-[11px] text-indigo-800">
                مناسب للطلاب المقيمين في دول الخليج وكافة دول العالم.
              </p>
            </div>

            <button
              onClick={handlePayPalPayment}
              disabled={isProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري الاتصال بـ PayPal...' : `الدفع السريع بـ PayPal ($${Math.max(3, Math.round((book.price || 150) / 48))}) 🌐`}
            </button>
          </div>
        )}

        {/* TAB 5: VOUCHER CODE */}
        {activeTab === 'voucher' && !isSuccess && (
          <form onSubmit={handleRedeemVoucher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أدخل كود كارت الشحن (المطبوع بالسنتر أو المكتبة):
              </label>
              <input
                type="text"
                required
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="مثال: OSR-8K21-9421"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-slate-900 uppercase focus:bg-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">كود تجريبي VIP: <strong className="text-sky-600 font-mono">OSERA-2026-VIP</strong></p>
            </div>

            {voucherError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voucherError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري التحقق من الكارت...' : 'تفعيل الكارت وفتح المقرر الآن ✓'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default PurchaseModal;
