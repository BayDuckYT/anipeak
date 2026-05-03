// ============================================================
//  ANTI-SPAM — Otonom Spam Takip Motoru
//  5 saniyede 5+ mesaj = Otomatik 10dk Timeout
// ============================================================

import { SPAM_CONFIG } from './config.js';

// userId -> [timestamp, timestamp, ...]
const messageTracker = new Map();

/**
 * Mesajı kaydet ve spam kontrolü yap.
 * @returns {boolean} true = spam tespit edildi
 */
export function trackAndCheck(userId) {
  const now = Date.now();
  const cutoff = now - SPAM_CONFIG.TIME_WINDOW_MS;

  // Kullanıcının mesaj geçmişini al veya oluştur
  let timestamps = messageTracker.get(userId) || [];

  // Zaman penceresi dışındaki eski kayıtları temizle
  timestamps = timestamps.filter((t) => t > cutoff);

  // Yeni mesajı ekle
  timestamps.push(now);
  messageTracker.set(userId, timestamps);

  // Eşik kontrolü
  return timestamps.length >= SPAM_CONFIG.MAX_MESSAGES;
}

/**
 * Kullanıcının spam sayacını sıfırla (timeout yedikten sonra).
 */
export function resetUser(userId) {
  messageTracker.delete(userId);
}

/**
 * Tüm kayıtları temizle (debug/reset amaçlı).
 */
export function clearAll() {
  messageTracker.clear();
}
