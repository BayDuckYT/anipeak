// ============================================================
//  LOGGER — Infinity Guard Kara Kutu Sistemi
//  infinity-log kanalına embed gönderir.
// ============================================================

import { LOG_CHANNEL_NAME } from './config.js';

/**
 * Log kanalını bulur ve embed gönderir.
 * Kanal yoksa sessizce pas geçer (hata fırlatmaz).
 */
export async function sendLog(guild, embed) {
  if (!guild) return;

  try {
    const logChannel = guild.channels.cache.find(
      (ch) => ch.name === LOG_CHANNEL_NAME && ch.isTextBased()
    );

    if (!logChannel) {
      // Log kanalı yok — sessizce geç
      return;
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[Infinity-Guard] ❌ Log gönderme hatası:', error.message);
  }
}
