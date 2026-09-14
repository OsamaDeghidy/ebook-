import React, { useState, useEffect, useMemo, useRef } from 'react';

export type AvatarGesture = 'idle' | 'thinking' | 'pointing' | 'presenting' | 'triumph';
export type AvatarMood = 'curious' | 'focused' | 'energetic' | 'proud';

// 🎵 Lightweight Procedural Web Audio Synthesizer for Zero-Payload Sound FX
const playRoboSound = (type: 'think' | 'spark' | 'triumph' | 'tap') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'think') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'spark') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'triumph') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {}
};

export interface EduAvatarHostProps {
  isPlaying: boolean;
  audioCurrentTime: number;
  totalDuration: number;
  currentAct: 'hook' | 'concept' | 'takeaway';
  speechProgress: number;
  characterId?: string;
  scale?: number;
}

export const EduAvatarHost: React.FC<EduAvatarHostProps> = ({
  isPlaying,
  audioCurrentTime,
  totalDuration: _totalDuration,
  currentAct,
  speechProgress: _speechProgress,
  characterId: _characterId = 'ai_robot',
  scale = 1
}) => {
  const [mouthWaveHeight, setMouthWaveHeight] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, rot: 0 });
  const [hoverY, setHoverY] = useState(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎭 Gesture based on Act
  const gesture: AvatarGesture = useMemo(() => {
    if (!isPlaying) return 'idle';
    if (currentAct === 'hook') return 'thinking';
    if (currentAct === 'concept') {
      const cycle = Math.floor((audioCurrentTime % 6) / 3);
      return cycle === 0 ? 'pointing' : 'presenting';
    }
    if (currentAct === 'takeaway') return 'triumph';
    return 'idle';
  }, [currentAct, isPlaying, audioCurrentTime]);

  // Trigger sound effect on gesture change
  useEffect(() => {
    if (isPlaying) {
      if (gesture === 'thinking') playRoboSound('think');
      else if (gesture === 'pointing') playRoboSound('spark');
      else if (gesture === 'triumph') playRoboSound('triumph');
    }
  }, [gesture, isPlaying]);

  // 👁️ Mouse & Pointer Vector Tracking for OLED Eyes
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (window.innerWidth / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);

      // Clamp max eye movement to 3.5px
      setEyeOffset({
        x: Math.max(-3.5, Math.min(3.5, dx * 3.5)),
        y: Math.max(-2.5, Math.min(2.5, dy * 2.5))
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // 👁️ Natural Digital Screen Blinking (every 3.5s)
  useEffect(() => {
    let blinkTimer: any;
    const triggerBlink = () => {
      const delay = Math.random() * 2500 + 2000;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          triggerBlink();
        }, 140);
      }, delay);
    };
    triggerBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  // 🗣️ Real-time Audio Lip-Sync, Thruster Pulse & Floating Physics
  useEffect(() => {
    if (!isPlaying) {
      setMouthWaveHeight(0);
      setHoverY(0);
      setHeadTilt({ x: 0, y: 0, rot: 0 });
      return;
    }

    const interval = setInterval(() => {
      // Audio speech cadence wave
      const timeFactor = audioCurrentTime * 16;
      const wave1 = Math.sin(timeFactor);
      const wave2 = Math.cos(timeFactor * 1.5);
      const intensity = Math.abs(wave1 * wave2);

      const isSpeaking = intensity > 0.15;
      setMouthWaveHeight(isSpeaking ? Math.min(1, intensity * 1.6) : 0.08);

      // Smooth floating physics
      setHoverY(Math.sin(audioCurrentTime * 3.2) * 4);
      setHeadTilt({
        x: Math.sin(audioCurrentTime * 1.8) * 2.5,
        y: Math.cos(audioCurrentTime * 2.2) * 1.8,
        rot: Math.sin(audioCurrentTime * 1.4) * 2
      });
    }, 45);

    return () => clearInterval(interval);
  }, [isPlaying, audioCurrentTime]);

  const handleRobotTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpinning) return;
    setIsSpinning(true);
    playRoboSound('tap');
    setTimeout(() => setIsSpinning(false), 800);
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleRobotTap}
      className={`relative flex flex-col items-center justify-center select-none cursor-pointer transition-transform duration-300 ${isSpinning ? 'animate-[spin_0.8s_ease-in-out]' : ''}`}
      style={{ transform: `scale(${scale})` }}
      title="انقر على روبي للتفاعل معه! 🤖"
    >
      {/* 🌟 3D CYBER AMBIENT AURA */}
      {isPlaying && (
        <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/25 via-sky-500/30 to-indigo-500/25 blur-3xl animate-pulse pointer-events-none" />
      )}

      {/* 🤖 THE PROCEDURAL ANIMATED AI COMPANION ROBOT (روبي / سبارك) */}

      <div 
        className="relative w-56 h-64 flex items-center justify-center transition-all duration-150"
        style={{
          transform: `translate(${headTilt.x}px, ${headTilt.y + hoverY}px) rotate(${headTilt.rot}deg)`
        }}
      >
        <svg 
          viewBox="0 0 240 280" 
          className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.65)] overflow-visible"
        >
          {/* ======================================================== */}
          {/* 🌟 SHADERS, LIGHTING GRADIENTS & GLOWS */}
          {/* ======================================================== */}
          <defs>
            {/* Glossy White Ceramic Robot Shell */}
            <radialGradient id="ceramicShell" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>

            {/* Jet Blue Metallic Core */}
            <linearGradient id="metalAccents" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Glossy Dark Visor Glass Screen */}
            <linearGradient id="visorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Glowing Cyan OLED Emission */}
            <radialGradient id="cyanOledGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="60%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>

            {/* Thruster Jet Plasma Flame */}
            <radialGradient id="thrusterFlame" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#06b6d4" />
              <stop offset="80%" stopColor="rgba(6, 182, 212, 0.4)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
            </radialGradient>

            {/* Golden Energy Accents */}
            <linearGradient id="energyGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="robotShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#020617" floodOpacity="0.5" />
            </filter>

            {/* Neon Bloom Filter */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* 1. HOVER JET THRUSTERS & PLASMA FLAME (قاعدة الطفو والنفاث) */}
          {/* ======================================================== */}
          <g filter="url(#robotShadow)">
            {/* Plasma Jet Flame */}
            {isPlaying && (
              <path
                d="M 104 228 Q 120 270 136 228 Q 120 248 104 228 Z"
                fill="url(#thrusterFlame)"
                className="animate-pulse"
              />
            )}

            {/* Thruster Ring Base */}
            <ellipse cx="120" cy="226" rx="22" ry="7" fill="url(#metalAccents)" stroke="#0284c7" strokeWidth="1" />
            <ellipse cx="120" cy="226" rx="15" ry="4.5" fill="#0369a1" />
            <circle cx="120" cy="226" r="3" fill="#38bdf8" filter="url(#neonGlow)" />
          </g>

          {/* ======================================================== */}
          {/* 2. CHUBBY WHITE CERAMIC ROBOT TORSO (الجسم المستدير الأنيق) */}
          {/* ======================================================== */}
          <g filter="url(#robotShadow)">
            {/* Main Body Capsule */}
            <path
              d="M 78 140 C 78 115, 162 115, 162 140 C 162 195, 150 226, 120 226 C 90 226, 78 195, 78 140 Z"
              fill="url(#ceramicShell)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Chest Core AI Reactor Ring */}
            <circle cx="120" cy="172" r="13" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
            <circle 
              cx="120" 
              cy="172" 
              r="8" 
              fill="url(#metalAccents)" 
              filter="url(#neonGlow)"
              className={isPlaying ? "animate-spin" : ""}
              style={{ transformOrigin: '120px 172px', animationDuration: '4s' }}
            />
            {/* Core Energy Pulse Dot */}
            <circle cx="120" cy="172" r="4" fill="#ffffff" filter="url(#neonGlow)" />

            {/* Sleek Side Seam Lines */}
            <path d="M 88 152 Q 95 185 102 210" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
            <path d="M 152 152 Q 145 185 138 210" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
          </g>

          {/* ======================================================== */}
          {/* 3. FLOATING ARTICULATED ROBOT ARMS & HANDS (الأذرع الذكية) */}
          {/* ======================================================== */}
          
          {/* GESTURE 1: THINKING 🤔 (Arm scratching head / antenna with glowing query) */}
          {gesture === 'thinking' && (
            <g className="animate-fade-in" filter="url(#robotShadow)">
              {/* Left Arm hovering up to head */}
              <path d="M 72 165 C 50 145, 45 105, 76 95" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" fill="none" />
              {/* Blue Joint Ring */}
              <circle cx="76" cy="95" r="7" fill="url(#metalAccents)" />
              {/* Cute Magnet Finger Tip */}
              <ellipse cx="80" cy="90" rx="6" ry="4" fill="url(#ceramicShell)" />
              {/* Digital Thought Bubble 💭 */}
              <g className="animate-bounce">
                <circle cx="60" cy="70" r="3" fill="#38bdf8" filter="url(#neonGlow)" />
                <circle cx="52" cy="55" r="5" fill="#38bdf8" filter="url(#neonGlow)" />
                <rect x="25" y="15" width="46" height="28" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="48" y="34" fill="#38bdf8" fontSize="14" fontWeight="bold" textAnchor="middle" filter="url(#neonGlow)">🤔 ?</text>
              </g>
            </g>
          )}

          {/* GESTURE 2: POINTING 👆 (Holding High-Tech Smart Laser Stylus pointing up) */}
          {gesture === 'pointing' && (
            <g className="animate-fade-in" filter="url(#robotShadow)">
              {/* Right Arm extended up */}
              <path d="M 165 165 C 190 150, 198 120, 192 88" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="192" cy="88" r="7" fill="url(#metalAccents)" />
              <ellipse cx="192" cy="82" rx="5.5" ry="4.5" fill="url(#ceramicShell)" />
              {/* Laser Pointer Stylus */}
              <rect x="190" y="55" width="4" height="28" rx="2" fill="url(#energyGold)" />
              {/* Glowing Laser Spark */}
              <circle cx="192" cy="52" r="5" fill="#f59e0b" filter="url(#neonGlow)" className="animate-ping" />
              <circle cx="192" cy="52" r="3" fill="#ffffff" />
            </g>
          )}

          {/* GESTURE 3: PRESENTING 🫱 (Holding Digital Hologram Concept Card) */}
          {gesture === 'presenting' && (
            <g className="animate-fade-in" filter="url(#robotShadow)">
              {/* Left Arm extended holding hologram */}
              <path d="M 72 165 C 42 160, 36 140, 48 120" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="48" cy="120" r="7" fill="url(#metalAccents)" />
              <ellipse cx="50" cy="115" rx="6" ry="4" fill="url(#ceramicShell)" />
              {/* Hologram Floating Display */}
              <g className="animate-pulse">
                <rect x="10" y="65" width="46" height="36" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="16" y1="76" x2="48" y2="76" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="84" x2="38" y2="84" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="92" x2="30" y2="92" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="48" cy="90" r="3" fill="#f59e0b" filter="url(#neonGlow)" />
              </g>
            </g>
          )}

          {/* GESTURE 4: TRIUMPH 🏆 (Both Hands Up Celebrating with Sparks) */}
          {gesture === 'triumph' && (
            <g className="animate-bounce" filter="url(#robotShadow)">
              {/* Left Arm high */}
              <path d="M 72 165 C 45 135, 42 95, 52 65" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="52" cy="65" r="7" fill="url(#metalAccents)" />
              <text x="48" y="48" fontSize="16">✨</text>

              {/* Right Arm high */}
              <path d="M 168 165 C 195 135, 198 95, 188 65" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="188" cy="65" r="7" fill="url(#metalAccents)" />
              <text x="186" y="48" fontSize="16">⭐</text>
            </g>
          )}

          {/* GESTURE 5: IDLE POSE (Cute hovering resting hands) */}
          {gesture === 'idle' && (
            <g filter="url(#robotShadow)">
              {/* Left Arm resting at side */}
              <path d="M 74 165 C 56 175, 56 195, 68 205" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" fill="none" />
              <circle cx="68" cy="205" r="6" fill="url(#metalAccents)" />
              <ellipse cx="70" cy="208" rx="5" ry="4" fill="url(#ceramicShell)" />

              {/* Right Arm resting at side */}
              <path d="M 166 165 C 184 175, 184 195, 172 205" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" fill="none" />
              <circle cx="172" cy="205" r="6" fill="url(#metalAccents)" />
              <ellipse cx="170" cy="208" rx="5" ry="4" fill="url(#ceramicShell)" />
            </g>
          )}

          {/* ======================================================== */}
          {/* 4. ROBOT HEAD WITH GLOSSY OLED SCREEN (الرأس والشاشة التفاعلية) */}
          {/* ======================================================== */}
          
          {/* ANTENNA WITH GLOWING AI CORE ORB */}
          <g filter="url(#robotShadow)">
            <rect x="117.5" y="32" width="5" height="24" rx="2" fill="url(#metalAccents)" />
            {/* Glowing Orb on Top of Antenna */}
            <circle 
              cx="120" 
              cy="28" 
              r="7.5" 
              fill="url(#cyanOledGlow)" 
              filter="url(#neonGlow)"
              className={isPlaying ? "animate-ping" : ""}
              style={{ animationDuration: '2s' }}
            />
            <circle cx="120" cy="28" r="7.5" fill="url(#cyanOledGlow)" filter="url(#neonGlow)" />
            <circle cx="118" cy="26" r="2.5" fill="#ffffff" />
          </g>

          {/* HEAD OUTER CERAMIC HELMET (شكل الخوذة البيضاء الناعمة) */}
          <g filter="url(#robotShadow)">
            <rect 
              x="52" 
              y="52" 
              width="136" 
              height="96" 
              rx="38" 
              fill="url(#ceramicShell)" 
              stroke="#cbd5e1" 
              strokeWidth="2" 
            />

            {/* Cute Ear Discs (سماعات الأذن الجانبية) */}
            <circle cx="49" cy="100" r="11" fill="url(#metalAccents)" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="49" cy="100" r="5" fill="#0891b2" />
            <circle cx="191" cy="100" r="11" fill="url(#metalAccents)" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="191" cy="100" r="5" fill="#0891b2" />

            {/* DARK OLED FACE SCREEN (الشاشة الرقمية الزجاجية السوداء) */}
            <rect 
              x="62" 
              y="62" 
              width="116" 
              height="76" 
              rx="26" 
              fill="url(#visorGlass)" 
              stroke="#1e293b" 
              strokeWidth="2" 
            />

            {/* Glass Curved Specular Glare (انعكاس إضاءة الزجاج ثلاثي الأبعاد) */}
            <path 
              d="M 68 70 Q 120 58 172 70 Q 150 82 90 82 Z" 
              fill="rgba(255, 255, 255, 0.18)" 
            />
          </g>

          {/* ======================================================== */}
          {/* 5. DYNAMIC OLED EYES & LIP-SYNC TALKING MOUTH */}
          {/* ======================================================== */}
          
          {/* 👁️ LEFT OLED EYE (Interactive Vector Tracking) */}
          <g filter="url(#neonGlow)" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`, transition: 'transform 0.08s ease-out' }}>
            {isBlinking ? (
              // Blink Line
              <line x1="82" y1="95" x2="102" y2="95" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
            ) : gesture === 'triumph' ? (
              // Happy Arc Eye ^_^
              <path d="M 82 98 Q 92 84 102 98" stroke="#22d3ee" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            ) : gesture === 'thinking' ? (
              // Questioning / Curious Eye
              <ellipse cx="92" cy="94" rx="10" ry="12" fill="#22d3ee" />
            ) : (
              // Standard Expressive Capsule Eye
              <g>
                <rect x="82" y="82" width="20" height="26" rx="10" fill="#22d3ee" />
                <circle cx="89" cy="88" r="3.5" fill="#ffffff" />
                <circle cx="95" cy="98" r="2" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* 👁️ RIGHT OLED EYE (Interactive Vector Tracking) */}
          <g filter="url(#neonGlow)" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`, transition: 'transform 0.08s ease-out' }}>
            {isBlinking ? (
              <line x1="138" y1="95" x2="158" y2="95" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
            ) : gesture === 'triumph' ? (
              <path d="M 138 98 Q 148 84 158 98" stroke="#22d3ee" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            ) : gesture === 'pointing' ? (
              // Star Eye when focused / pointing
              <g>
                <rect x="138" y="82" width="20" height="26" rx="10" fill="#22d3ee" />
                <circle cx="145" cy="88" r="4.5" fill="#ffffff" />
                <circle cx="151" cy="98" r="2" fill="#ffffff" />
              </g>
            ) : (
              <g>
                <rect x="138" y="82" width="20" height="26" rx="10" fill="#22d3ee" />
                <circle cx="145" cy="88" r="3.5" fill="#ffffff" />
                <circle cx="151" cy="98" r="2" fill="#ffffff" />
              </g>
            )}
          </g>


          {/* 👄 6. DIGITAL LIP-SYNC & AUDIO SPECTRUM MOUTH */}
          <g filter="url(#neonGlow)">
            {isPlaying && mouthWaveHeight > 0.1 ? (
              // Speaking Audio Spectrum Waves
              <g>
                <line x1="104" y1={120 - 4 * mouthWaveHeight} x2="104" y2={120 + 4 * mouthWaveHeight} stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                <line x1="112" y1={120 - 8 * mouthWaveHeight} x2="112" y2={120 + 8 * mouthWaveHeight} stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="120" y1={120 - 11 * mouthWaveHeight} x2="120" y2={120 + 11 * mouthWaveHeight} stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <line x1="128" y1={120 - 8 * mouthWaveHeight} x2="128" y2={120 + 8 * mouthWaveHeight} stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="136" y1={120 - 4 * mouthWaveHeight} x2="136" y2={120 + 4 * mouthWaveHeight} stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              // Friendly Digital Smile
              <path 
                d="M 108 118 Q 120 127 132 118" 
                stroke="#22d3ee" 
                strokeWidth="3.5" 
                fill="none" 
                strokeLinecap="round" 
              />
            )}
          </g>
        </svg>

        {/* 🏷️ CHARISMATIC ROBOTIC 3D BADGE (روبي • المساعد الذكي 🤖) */}
        <div className="absolute -bottom-3 px-3.5 py-0.5 rounded-full bg-slate-950/95 backdrop-blur-xl border border-cyan-400/80 shadow-[0_4px_20px_rgba(34,211,238,0.4)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-300 tracking-wide flex items-center gap-1">
            <span>🤖</span>
            <span>روبي • رفيق الذكاء الاصطناعي</span>
          </span>
          {isPlaying && (
            <span className="text-[9px] text-amber-300 font-mono flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>
                {gesture === 'thinking' ? 'يعالج الفكرة 🤔' : gesture === 'pointing' ? 'يشير للمفهوم 👆' : gesture === 'presenting' ? 'يشرح القانون 💡' : 'يحتفل بإنجازك 🎉'}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EduAvatarHost;


