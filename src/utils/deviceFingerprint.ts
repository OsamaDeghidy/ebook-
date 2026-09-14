/**
 * Client Device Fingerprint & Single-Session Guard
 * Prevents account credential sharing among multiple students.
 */

export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'simplest_device_fingerprint';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    // Generate a unique fingerprint using screen, hardware concurrency, language, and random entropy
    const screenSig = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgentSig = navigator.userAgent;
    const randomSalt = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    // Simple hash
    let hash = 0;
    const rawSig = `${screenSig}|${userAgentSig}|${randomSalt}`;
    for (let i = 0; i < rawSig.length; i++) {
      hash = ((hash << 5) - hash) + rawSig.charCodeAt(i);
      hash |= 0;
    }
    deviceId = `dev_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'هاتف أندرويد';
  if (/iPad|iPhone|iPod/.test(ua)) return 'جهاز آبل (iOS)';
  if (/Windows/i.test(ua)) return 'كمبيوتر ويندوز';
  if (/Macintosh/i.test(ua)) return 'كمبيوتر ماك (macOS)';
  return 'متصفح ويب';
}
