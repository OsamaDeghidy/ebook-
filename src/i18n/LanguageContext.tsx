import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import arDict from './locales/ar.json';
import enDict from './locales/en.json';
import itDict from './locales/it.json';
import frDict from './locales/fr.json';
import deDict from './locales/de.json';

export type AppLanguage = 'ar' | 'en' | 'it' | 'fr' | 'de';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' }
];

const dictionaries: Record<AppLanguage, any> = {
  ar: arDict,
  en: enDict,
  it: itDict,
  fr: frDict,
  de: deDict
};

interface LanguageContextType {
  language: AppLanguage;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_preferred_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage;
      if (saved && ['ar', 'en', 'it', 'fr', 'de'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'ar';
  });

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const dir = currentLanguageInfo.dir;

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  };

  useEffect(() => {
    // Synchronize HTML attributes for RTL/LTR & Lang
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (dir === 'ltr') {
      document.body.classList.add('font-sans');
    }
  }, [language, dir]);

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current = dictionaries[language];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English dictionary
        let fallbackVal = dictionaries.en;
        for (const fk of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fk in fallbackVal) {
            fallbackVal = fallbackVal[fk];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        return (typeof fallbackVal === 'string' ? fallbackVal : fallback) || path;
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t, currentLanguageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
