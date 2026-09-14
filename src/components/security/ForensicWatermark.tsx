import React, { useEffect, useState } from 'react';

interface ForensicWatermarkProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  customText?: string;
}

export const ForensicWatermark: React.FC<ForensicWatermarkProps> = ({
  userId,
  userEmail,
  userName,
  userPhone,
  customText
}) => {
  // Generate tracking fingerprint
  const identifier = userName || userPhone || (userEmail ? userEmail.split('@')[0] : 'طالب موثق');
  const secondaryId = userPhone || userEmail || (userId ? `ID: ${userId.slice(0, 8)}` : 'Osera Secure');
  
  // Random coordinates state for floating tamper-evident watermark
  const [position, setPosition] = useState({ top: 25, left: 30 });
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Update live timestamp for undeniable forensic evidence
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-EG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Randomize position every 5 seconds to defeat video cropping/masking
    const moveInterval = setInterval(() => {
      const randomTop = Math.floor(Math.random() * 65) + 15; // 15% - 80%
      const randomLeft = Math.floor(Math.random() * 65) + 15; // 15% - 80%
      setPosition({ top: randomTop, left: randomLeft });
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(moveInterval);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      aria-hidden="true"
    >
      {/* 1. Subtle repeating background lattice pattern */}
      <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 gap-16 p-8 opacity-[0.035] transform -rotate-12 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="text-center font-mono font-black text-xs text-slate-900 tracking-wider">
            <div>Osera AI LMS • {identifier}</div>
            <div className="text-[10px] text-slate-700">{secondaryId}</div>
          </div>
        ))}
      </div>

      {/* 2. Dynamic Floating Forensic Badge (Moves randomly every 5 seconds) */}
      <div
        className="absolute transition-all duration-1000 ease-in-out pointer-events-none"
        style={{
          top: `${position.top}%`,
          left: `${position.left}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-900/10 backdrop-blur-[1px] border border-slate-900/10 shadow-xs text-slate-800/25 dark:text-white/20 select-none">
          <div className="text-[11px] sm:text-xs font-black tracking-wide">
            🔒 {identifier} • {secondaryId}
          </div>
          <div className="text-[9px] font-mono font-bold opacity-80">
            {customText || 'مرخص للاستخدام الشخصي فقط'} • {currentTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicWatermark;
