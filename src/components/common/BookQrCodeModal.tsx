import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, Download, Copy, Check, ExternalLink, X, 
  Sparkles, ShieldCheck, BookOpen, Smartphone,
  GraduationCap, Layers, Eye, Share2, Compass, Bot
} from 'lucide-react';
import { MarketplaceBook } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { getPlatformConfig } from '../../services/platformConfigService';

interface BookQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: MarketplaceBook;
  chapterTitle?: string;
  isOwned?: boolean;
}

/**
 * Procedural Vector Drawing of the Platform's 3D AI Robot (Roby / روبي)
 * Matches the exact robot avatar appearing in EduReels & AI Tutor
 */
function drawAiRobotAvatarOnCanvas(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  const scale = radius / 60; // Normalize scale to radius 60
  ctx.scale(scale, scale);

  // 1. Ambient Glow Halo
  const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 68);
  auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
  auraGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer Shield Ring
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.stroke();

  // Dark Cyber Badge Fill
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(0, 0, 54, 0, Math.PI * 2);
  ctx.fill();

  // 3. Central Top Antenna
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(0, -48);
  ctx.stroke();

  // Glowing Cyan Orb on Antenna
  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, -49, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 4. Side Audio / Sensor Pods
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(-42, -14, 8, 22, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(34, -14, 8, 22, 4);
  ctx.fill();

  // Glowing Sensor Dots
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(-38, -3, 2.5, 0, Math.PI * 2);
  ctx.arc(38, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Robot Head Chassis
  const headGrad = ctx.createLinearGradient(-35, -30, 35, 30);
  headGrad.addColorStop(0, '#ffffff');
  headGrad.addColorStop(0.6, '#f1f5f9');
  headGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-34, -30, 68, 56, 18);
  ctx.fill();
  ctx.stroke();

  // 6. OLED Visor Screen
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -22, 52, 32, 10);
  ctx.fill();
  ctx.stroke();

  // 7. Expressive Glowing Eyes (^ ^)
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 10;

  // Left Eye Arc
  ctx.beginPath();
  ctx.arc(-13, -7, 6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Right Eye Arc
  ctx.beginPath();
  ctx.arc(13, -7, 6, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 8. Cheerful Digital Mouth Arc
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 16, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // 9. Collar & Power Core
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-16, 28, 32, 12, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(0, 34, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const BookQrCodeModal: React.FC<BookQrCodeModalProps> = ({
  isOpen,
  onClose,
  book,
  chapterTitle,
  isOwned = false
}) => {
  const { t, language, dir } = useLanguage();
  const platformConfig = getPlatformConfig();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [viewMode, setViewMode] = useState<'poster' | 'minimal'>('poster');
  const [isExportingPoster, setIsExportingPoster] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  // Destination URL
  const isPaid = Number(book.price) > 0 && !book.is_free;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = isPaid && !isOwned
    ? `${baseUrl}/book/${book.id}`
    : `${baseUrl}/book/${book.id}?tab=read`;

  const displayBookTitle = book.title || t('book.read', 'المقرر التعليمي التفاعلي');
  const displayAuthor = book.author_name || book.author || 'نخبة خبراء المادة';
  const displayStage = book.grade_level || book.education_level || book.subcategory || book.category || 'المناهج التعليمية المعتمدة';

  useEffect(() => {
    if (!isOpen || !book.id) return;

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(targetUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#0f172a',
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

  /**
   * Helper to load an image safely as HTMLImageElement
   */
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  /**
   * High-Resolution Canvas Marketing Poster Exporter
   * Formats:
   * - 'square': 1080x1080 (Instagram Square)
   * - 'story':  1080x1920 (Story / Reels / TikTok Vertical)
   */
  const handleDownloadPoster = async (format: 'square' | 'story') => {
    if (!qrDataUrl || isExportingPoster) return;
    setIsExportingPoster(format);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const width = 1080;
      const height = format === 'square' ? 1080 : 1920;
      canvas.width = width;
      canvas.height = height;

      // 1. Luxury Academic Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.45, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Top Decorative Accent Wave
      const topGrad = ctx.createLinearGradient(0, 0, width, 0);
      topGrad.addColorStop(0, '#0d9488');
      topGrad.addColorStop(0.5, '#4f46e5');
      topGrad.addColorStop(1, '#9333ea');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 14);

      // Outer Border Frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 36, width - 64, height - 72);

      // Platform Brand Header
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      // Brand Title
      const brandTitle = platformConfig.brandName || 'منصة إيبوك للتعليم الذكي';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px sans-serif';
      const headerY = format === 'square' ? 95 : 120;
      ctx.fillText(brandTitle, width / 2, headerY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(platformConfig.brandSubtitle || 'المنظومة التعليمية التفاعلية المدعومة بالذكاء الاصطناعي', width / 2, headerY + 34);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, headerY + 54);
      ctx.lineTo(width - 100, headerY + 54);
      ctx.stroke();

      // Stage Badge
      const stageY = headerY + 76;
      ctx.fillStyle = 'rgba(13, 148, 136, 0.2)';
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 160, stageY, 320, 38, 19);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5eead4';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🎓 ${displayStage}`, width / 2, stageY + 25);

      // Book Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      const bookTitleY = stageY + 72;
      ctx.fillText(displayBookTitle, width / 2, bookTitleY);

      // Chapter Title (Prominently displayed below book title)
      let currentY = bookTitleY + 44;
      if (chapterTitle) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`📖 درس: ${chapterTitle}`, width / 2, currentY);
        currentY += 40;
      }

      // Teacher / Author Name
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`إعداد المعلم: ${displayAuthor}`, width / 2, currentY);
      currentY += 34;

      // Load QR Image
      const qrImg = await loadImage(qrDataUrl);

      // Try Loading Custom Brand Logo if explicitly configured
      let customLogoImg: HTMLImageElement | null = null;
      if (platformConfig.brandLogoUrl) {
        try {
          customLogoImg = await loadImage(platformConfig.brandLogoUrl);
        } catch {
          customLogoImg = null;
        }
      }

      if (format === 'square') {
        // SQUARE LAYOUT: Place Logo or AI Robot BESIDE QR
        const qrSize = 360;
        const totalBlockWidth = 740;
        const startX = (width - totalBlockWidth) / 2;
        const blockY = currentY + 15;

        // QR Box on one side
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(startX, blockY, qrSize, qrSize, 28);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.drawImage(qrImg, startX + 20, blockY + 20, qrSize - 40, qrSize - 40);

        // Info Card beside QR
        const infoX = startX + qrSize + 30;
        const infoWidth = totalBlockWidth - qrSize - 30;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(infoX, blockY, infoWidth, qrSize, 28);
        ctx.fill();
        ctx.stroke();

        // Draw Avatar: Either custom logo or procedural 3D AI Robot (روبي)
        if (customLogoImg) {
          const logoSize = 100;
          ctx.save();
          ctx.beginPath();
          ctx.arc(infoX + infoWidth / 2, blockY + 70, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(customLogoImg, infoX + infoWidth / 2 - logoSize / 2, blockY + 20, logoSize, logoSize);
          ctx.restore();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(infoX + infoWidth / 2, blockY + 70, logoSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Draw the AI Robot (Roby)
          drawAiRobotAvatarOnCanvas(ctx, infoX + infoWidth / 2, blockY + 72, 46);
        }

        // Info text beside QR
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px sans-serif';
        ctx.fillText('روبي • رفيق الذكاء الاصطناعي', infoX + infoWidth / 2, blockY + 150);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('✨ شرح تفاعلي ذكي', infoX + infoWidth / 2, blockY + 190);
        ctx.fillText('📝 بنك أسئلة واختبارات', infoX + infoWidth / 2, blockY + 225);
        ctx.fillText('🎬 ريلز وبودكاست مسموع', infoX + infoWidth / 2, blockY + 260);
        ctx.fillText('📲 امسح الكود بكاميرا هاتفك', infoX + infoWidth / 2, blockY + 310);

        // Footer Link & Stamp
        const footerY = blockY + qrSize + 45;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 320, footerY, 640, 48, 16);
        ctx.fill();

        ctx.direction = 'ltr';
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 17px monospace';
        const cleanUrl = targetUrl.replace(/^https?:\/\//, '');
        ctx.fillText(cleanUrl.length > 50 ? cleanUrl.substring(0, 48) + '...' : cleanUrl, width / 2, footerY + 30);

        ctx.direction = 'rtl';
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🔒 محتوى تعليمي محمي وموثق رقمياً • جميع الحقوق محفوظة', width / 2, height - 35);
      } else {
        // STORY VERTICAL LAYOUT (1080x1920)
        currentY += 40;

        const qrSize = 480;
        const qrBoxX = 70;
        const qrBoxY = currentY;

        // Draw QR Box
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, qrSize, qrSize, 36);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.drawImage(qrImg, qrBoxX + 25, qrBoxY + 25, qrSize - 50, qrSize - 50);

        // Side Box Beside QR
        const sideBoxX = qrBoxX + qrSize + 30;
        const sideBoxWidth = width - sideBoxX - 70;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(sideBoxX, qrBoxY, sideBoxWidth, qrSize, 36);
        ctx.fill();
        ctx.stroke();

        // Draw Custom Logo or AI Robot
        if (customLogoImg) {
          const logoSize = 130;
          ctx.save();
          ctx.beginPath();
          ctx.arc(sideBoxX + sideBoxWidth / 2, qrBoxY + 95, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(customLogoImg, sideBoxX + sideBoxWidth / 2 - logoSize / 2, qrBoxY + 30, logoSize, logoSize);
          ctx.restore();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(sideBoxX + sideBoxWidth / 2, qrBoxY + 95, logoSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          drawAiRobotAvatarOnCanvas(ctx, sideBoxX + sideBoxWidth / 2, qrBoxY + 95, 60);
        }

        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px sans-serif';
        ctx.fillText('روبي • رفيق الذكاء الاصطناعي', sideBoxX + sideBoxWidth / 2, qrBoxY + 195);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('✨ شرح تفاعلي ذكي', sideBoxX + sideBoxWidth / 2, qrBoxY + 255);
        ctx.fillText('📝 اختبارات تشخيصية', sideBoxX + sideBoxWidth / 2, qrBoxY + 300);
        ctx.fillText('🎬 استوديو ريلز المعرفة', sideBoxX + sideBoxWidth / 2, qrBoxY + 345);
        ctx.fillText('🎧 بودكاست وملخصات', sideBoxX + sideBoxWidth / 2, qrBoxY + 390);

        // Story Callout
        const ctaY = qrBoxY + qrSize + 80;
        ctx.fillStyle = '#fef08a';
        ctx.font = '900 36px sans-serif';
        ctx.fillText('📲 امسح الكود بكاميرا هاتفك المحمول', width / 2, ctaY);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('للدخول الفوري للمحتوى التفاعلي وبنك الأسئلة الكامل', width / 2, ctaY + 50);

        // Story Link Box
        const linkBoxY = ctaY + 105;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 380, linkBoxY, 760, 68, 20);
        ctx.fill();
        ctx.stroke();

        ctx.direction = 'ltr';
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        const cleanDisplayUrl = targetUrl.replace(/^https?:\/\//, '');
        ctx.fillText(cleanDisplayUrl.length > 50 ? cleanDisplayUrl.substring(0, 47) + '...' : cleanDisplayUrl, width / 2, linkBoxY + 44);

        // Story Footer
        ctx.direction = 'rtl';
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('🔒 محتوى تعليمي محمي وموثق رقمياً • جميع الحقوق محفوظة لمنصة Osera AI', width / 2, height - 70);
      }

      // Download PNG Blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const safeTitle = (book.title || 'course').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const formatSuffix = format === 'square' ? '1080x1080_انستجرام' : '1080x1920_ستوري';
        link.download = `بوستر_${formatSuffix}_${safeTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportingPoster(null);
      }, 'image/png');
    } catch (e) {
      console.error('Failed to export poster:', e);
      setIsExportingPoster(null);
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR_${book.id}.png`;
      link.click();
    }
  };



  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      dir={dir}
    >
      {/* 🖥️ SCREEN MODAL CARD (Luxury Dark Academic Theme) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-right relative overflow-hidden my-auto"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10"
          title={t('common.close', 'إغلاق')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>كود QR والبوستر التسويقي الذكي 📲</span>
              </h3>
              <p className="text-xs text-slate-400">جاهز للعرض، الطباعة المباشرة، والمشاركة التسويقية</p>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('poster')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'poster' ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-black shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بوستر تسويقي فاخر</span>
            </button>
            <button
              onClick={() => setViewMode('minimal')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'minimal' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>باركود سريع</span>
            </button>
          </div>
        </div>

        {/* 🌟 1. MARKETING POSTER CARD VIEW (FOR DISPLAY & SCREEN) */}
        {viewMode === 'poster' && (
          <div 
            id="printable-marketing-poster"
            ref={posterRef}
            className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl space-y-5 text-center relative overflow-hidden"
          >
            {/* Top Badge: Platform Brand */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-300">
                  {platformConfig.brandName || 'منصة إيبوك للتعليم الذكي'}
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                OSERA AI LMS
              </span>
            </div>

            {/* Course & Author Info */}
            <div className="space-y-1.5">
              <span className="inline-block text-[11px] font-black px-3 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                🎓 {displayStage}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {displayBookTitle}
              </h2>
              {chapterTitle && (
                <p className="text-xs text-cyan-300 font-black">
                  📖 درس: {chapterTitle}
                </p>
              )}
              <p className="text-xs text-slate-300 font-bold">
                إعداد المعلم: <span className="text-white font-black">{displayAuthor}</span>
              </p>
            </div>

            {/* Centered QR Code Box with AI Robot Mascot Beside It */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-3">
              <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl border-4 border-cyan-400/80">
                {isGenerating ? (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex flex-col items-center justify-center gap-3 text-slate-500">
                    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">جاري تجهيز الباركود...</span>
                  </div>
                ) : qrDataUrl ? (
                  <div className="relative">
                    <img 
                      src={qrDataUrl} 
                      alt={`QR code for ${displayBookTitle}`} 
                      className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl object-contain"
                    />
                    {/* Centered Brand Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white shadow-xl border-2 border-teal-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-teal-700" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-rose-500 text-xs font-bold">
                    تعذر إنشاء الكود
                  </div>
                )}
              </div>

              {/* Beside QR: 3D AI Robot Mascot & Feature Highlights */}
              <div className="flex flex-col items-center sm:items-start text-right p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 max-w-[210px]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">روبي AI</h5>
                    <span className="text-[10px] text-cyan-300 font-bold">رفيق التعلم الذكي 🤖</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1 text-teal-300">
                    <Sparkles className="w-3 h-3" />
                    <span>شرح تفاعلي ذكي</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-300">
                    <BookOpen className="w-3 h-3" />
                    <span>بنك أسئلة واختبارات</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-300">
                    <Smartphone className="w-3 h-3" />
                    <span>ريلز وبودكاست مسموع</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-amber-300">
                <Smartphone className="w-4 h-4" />
                <span>امسح الكود بكاميرا هاتفك المحمول للبدء فوراً</span>
              </div>
              <p className="text-[11px] text-slate-400">
                يوفر وصولاً سريعاً ومباشراً للشرح التفاعلي، بنك الأسئلة، واستوديوهات الريلز
              </p>
            </div>

            {/* Link Preview Bar */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] font-mono text-cyan-300 flex items-center justify-between gap-2 overflow-hidden" dir="ltr">
              <span className="truncate">{targetUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-[10px] font-bold transition cursor-pointer"
              >
                {copiedLink ? t('common.copied', 'تم النسخ!') : 'نسخ'}
              </button>
            </div>

            {/* Footer Trust Stamp */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رابط آمن وموثق 100%</span>
              </div>
              <span>{isPaid && !isOwned ? `السعر: ${book.price} ${t('book.currency', 'ج.م')}` : t('book.free', 'متاح للطلاب مجاناً')}</span>
            </div>
          </div>
        )}

        {/* ⚡ 2. MINIMAL QR VIEW */}
        {viewMode === 'minimal' && (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-white/10 text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-300">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt={`QR code for ${displayBookTitle}`} 
                  className="w-48 h-48 rounded-xl object-contain"
                />
              )}
            </div>

            <div className="space-y-1 text-center">
              <h4 className="text-sm font-bold text-white">{displayBookTitle}</h4>
              {chapterTitle && (
                <p className="text-xs text-cyan-300 font-bold">📖 درس: {chapterTitle}</p>
              )}
              <p className="text-xs text-slate-400">باركود رقمي مباشر</p>
            </div>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Square Poster (1080x1080 Instagram) */}
            <button
              onClick={() => handleDownloadPoster('square')}
              disabled={!qrDataUrl || isGenerating || Boolean(isExportingPoster)}
              className="p-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 active:scale-95 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPoster === 'square' ? 'جاري التجهيز...' : 'تحميل مربع (1080×1080)'}</span>
            </button>

            {/* 2. Vertical Poster (1080x1920 Story/Reels) */}
            <button
              onClick={() => handleDownloadPoster('story')}
              disabled={!qrDataUrl || isGenerating || Boolean(isExportingPoster)}
              className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPoster === 'story' ? 'جاري التجهيز...' : 'تحميل عمودي (1080×1920)'}</span>
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopy}
            className="w-full p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-white/10 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">{t('common.copied', 'تم النسخ!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>نسخ الرابط المباشر</span>
              </>
            )}
          </button>
        </div>

        {/* Marketing / Hanging Guide Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>حمّل البوستر بدقة عالية وشاركه على السوشيال ميديا أو اطبعه كملصق لترويج منصتك وجذب الطلاب!</span>
        </div>
      </div>
    </div>
  );
};
