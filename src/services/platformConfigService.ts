// ⚙️ Platform Dynamic White-Label Configuration & Feature Flags Service

export interface PlatformConfig {
  brandName: string;
  brandSubtitle: string;
  brandLogoUrl?: string;
  companyName: string;
  founderName: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  copyrightText: string;
  
  // 💰 Financial & Commission Settings
  platformCommissionRate: number; // e.g. 15 (%)
  minWithdrawalAmount: number; // e.g. 100 (EGP)
  freeAiBooksPerTeacher: number; // e.g. 5 free books for every teacher
  bookGenerationCost: number; // e.g. 50 (Credits/EGP) after free quota
  allowWalletPayment: boolean;
  minPayPalAmountUsd?: number; // Minimum PayPal payment (default $10)
  paypalClientId?: string;
  paypalClientSecret?: string;

  // 🎛️ Feature Flags (التحكم في إظهار وإخفاء الخصائص)
  showReels: boolean;
  showGamification: boolean;
  showInstructorHubShortcut: boolean;
  showAiRobot: boolean;
  showWalletAndCredits: boolean;
  enableVoucherCodes: boolean;
}

const STORAGE_KEY = 'edureels_platform_config';

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  brandName: 'أوسيرا AI',
  brandSubtitle: 'المنصة الذكية للكتب والمذكرات التعليمية',
  brandLogoUrl: '',
  companyName: 'شركة أوسيرا سوفت للحلول الذكية (Osera Soft AI)',
  founderName: 'فريق مهندسي أوسيرا AI',
  supportPhone: '+201066906132',
  supportEmail: 'support@osera-ai.com',
  whatsappNumber: '+201066906132',
  copyrightText: 'جميع الحقوق محفوظة © 2026 لشركة أوسيرا سوفت AI',
  
  // Financial Defaults
  platformCommissionRate: 15,
  minWithdrawalAmount: 100,
  freeAiBooksPerTeacher: 5,
  bookGenerationCost: 50,
  allowWalletPayment: true,
  minPayPalAmountUsd: 10,
  paypalClientId: '',
  paypalClientSecret: '',

  // Default Flags
  showReels: true,
  showGamification: true,
  showInstructorHubShortcut: true,
  showAiRobot: true,
  showWalletAndCredits: true,
  enableVoucherCodes: true
};

export const getPlatformConfig = (): PlatformConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_PLATFORM_CONFIG;
};

// Fetch latest database settings and sync local state
export const syncPlatformConfigWithServer = async (): Promise<PlatformConfig> => {
  try {
    const res = await fetch('/api/platform/settings');
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        const synced = { ...DEFAULT_PLATFORM_CONFIG, ...data.settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        window.dispatchEvent(new CustomEvent('platform-config-changed', { detail: synced }));
        return synced;
      }
    }
  } catch (err) {
    console.warn('Config server sync warning:', err);
  }
  return getPlatformConfig();
};

export const savePlatformConfigAsync = async (newConfig: Partial<PlatformConfig>): Promise<{ success: boolean; config: PlatformConfig; message?: string }> => {
  const current = getPlatformConfig();
  const updated: PlatformConfig = { ...current, ...newConfig };
  
  // 1. Immediately cache locally and dispatch event
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('platform-config-changed', { detail: updated }));
  } catch (e) {}

  // 2. Persist to backend server (file + supabase)
  try {
    const res = await fetch('/api/platform/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const serverSaved = { ...DEFAULT_PLATFORM_CONFIG, ...data.settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSaved));
      window.dispatchEvent(new CustomEvent('platform-config-changed', { detail: serverSaved }));
      return { success: true, config: serverSaved, message: data.message || 'تم حفظ وتطبيق الإعدادات بنجاح! ✓' };
    }
  } catch (err: any) {
    console.warn('Server save warning:', err);
  }

  return { success: true, config: updated, message: 'تم حفظ وتطبيق الإعدادات بنجاح!' };
};

export const savePlatformConfig = (newConfig: Partial<PlatformConfig>): PlatformConfig => {
  const current = getPlatformConfig();
  const updated: PlatformConfig = { ...current, ...newConfig };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('platform-config-changed', { detail: updated }));
    savePlatformConfigAsync(newConfig);
  } catch (e) {}
  return updated;
};

// Automatically trigger sync on module load
if (typeof window !== 'undefined') {
  syncPlatformConfigWithServer();
}

