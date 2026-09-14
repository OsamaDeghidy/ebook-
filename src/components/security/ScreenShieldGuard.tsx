import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface ScreenShieldGuardProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export const ScreenShieldGuard: React.FC<ScreenShieldGuardProps> = ({
  children,
  isActive = true
}) => {
  const [isShieldTriggered, setIsShieldTriggered] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (!isActive) return;

    // 1. Intercept keyboard shortcuts (PrintScreen, Ctrl+P, Ctrl+S, F12, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerWarning('تم حظر تصوير الشاشة للحفاظ على حقوق الملكية الفكرية');
        return false;
      }

      // Ctrl+P (Print), Ctrl+S (Save), Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerWarning('الطباعة وحفظ الصفحة غير متاحين لهذا المقرر المحمي');
        return false;
      }

      // F12 or Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        triggerWarning('أدوات الفحص والتطوير محظورة داخل قارئ المحتوى');
        return false;
      }
    };

    // 2. Prevent right-click context menu inside protected zone
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const triggerWarning = (msg: string) => {
      setWarningMessage(msg);
      setIsShieldTriggered(true);
      setTimeout(() => {
        setIsShieldTriggered(false);
      }, 3500);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-full select-none" onContextMenu={(e) => e.preventDefault()}>
      {children}

      {/* Security Warning Toast Overlay */}
      {isShieldTriggered && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all animate-fade-in p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md text-center shadow-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">تنبيه حماية المحتوى</h3>
            <p className="text-xs text-rose-200 font-medium leading-relaxed">
              {warningMessage}
            </p>
            <div className="text-[10px] text-slate-400 font-bold">
              جميع حقوق الطبع والنشر محفوظة لمنصة Osera AI LMS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShieldGuard;
