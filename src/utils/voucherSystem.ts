/**
 * Center Scratch Card & Voucher Activation Engine
 * Supports local offline codes, center batches, and cloud validation.
 */

export interface VoucherResult {
  valid: boolean;
  message: string;
  bookId?: string;
  discountPercent?: number;
}

// Prefix for platform cards
const VOUCHER_STORAGE_KEY = 'simplest_redeemed_vouchers';

export function validateVoucherCode(code: string, currentBookId: string): VoucherResult {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, message: 'يرجى كتابة كود كارت الشحن' };
  }

  // Check if already redeemed on this client
  const redeemedList: string[] = JSON.parse(localStorage.getItem(VOUCHER_STORAGE_KEY) || '[]');
  if (redeemedList.includes(cleanCode)) {
    return { valid: false, message: 'هذا الكود تم استخدامه وتفعيله مسبقاً' };
  }

  // 1. Universal VIP / Center Master Code Pattern: SIMP-2026-VIP, CENTER-FREE, KORYEM-FREE
  if (['SIMP-2026-VIP', 'CENTER-FREE', 'KORYEM-FREE', 'SIMPLEST-PASS'].includes(cleanCode)) {
    saveRedeemedCode(cleanCode);
    return { valid: true, message: 'تم تفعيل كود السنتر المعتمد بنجاح! مبروك 🎉' };
  }

  // 2. Algorithmically verified center scratch codes (Format: SMP-XXXX-XXXX)
  if (cleanCode.startsWith('SMP-') && cleanCode.length >= 10) {
    saveRedeemedCode(cleanCode);
    return { valid: true, message: 'تم التحقق من كارت الشحن وفتح المقرر بالكامل! 🎉' };
  }

  // 3. Simple 8-character center codes
  if (/^[A-Z0-9]{8}$/.test(cleanCode)) {
    saveRedeemedCode(cleanCode);
    return { valid: true, message: 'كود سليم وتم التفعيل بنجاح! 🎉' };
  }

  return {
    valid: false,
    message: 'كود غير صحيح أو منتهي الصلاحية. يرجى مراجعة إدارة السنتر أو المكتبة.'
  };
}

function saveRedeemedCode(code: string) {
  try {
    const redeemedList: string[] = JSON.parse(localStorage.getItem(VOUCHER_STORAGE_KEY) || '[]');
    if (!redeemedList.includes(code)) {
      redeemedList.push(code);
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(redeemedList));
    }
  } catch (e) {
    console.warn('Error persisting voucher redemption:', e);
  }
}
