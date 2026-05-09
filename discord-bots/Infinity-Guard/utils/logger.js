// ============================================================
//  LOGGER — Infinity Guard Kara Kutu Sistemi
//  infinity-log kanalına embed gönderir.
// ============================================================

import { LOG_CHANNEL_NAME, CEZA_LOG_CHANNEL_ID } from './config.js';

/**
 * Log kanalını bulur ve embed gönderir.
 * Kanal yoksa sessizce pas geçer (hata fırlatmaz).
 */
export async function sendLog(guild, embed) {
  if (!guild) return;

  try {
    // Önce ID ile kanalı bulmaya çalış
    let logChannel = guild.channels.cache.get(CEZA_LOG_CHANNEL_ID);

    // ID ile bulunamadıysa isimle ara
    if (!logChannel) {
      logChannel = guild.channels.cache.find(
        (ch) => ch.name === LOG_CHANNEL_NAME && ch.isTextBased()
      );
    }

    if (!logChannel) {
      // Log kanalı yok — sessizce geç
      return;
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[Infinity-Guard] ❌ Log gönderme hatası:', error.message);
  }
}
