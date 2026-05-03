// ============================================================
//  guildMemberAdd — Yeni Üye Karşılama + Raid Koruması
// ============================================================

import { memberJoinEmbed, baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';
import { COLORS } from '../utils/config.js';

// Raid koruması: Hızlı katılım takibi
const joinTracker = [];
const RAID_THRESHOLD = 8;      // 8 üye
const RAID_WINDOW_MS = 10_000; // 10 saniye içinde

export default {
  name: 'guildMemberAdd',
  once: false,

  async execute(member, client) {
    // ── Log kanalına bildir ──────────────────────────────────
    const embed = memberJoinEmbed(member);
    await sendLog(member.guild, embed);

    // ── Raid Koruması ────────────────────────────────────────
    const now = Date.now();
    joinTracker.push(now);

    // Eski kayıtları temizle
    while (joinTracker.length > 0 && joinTracker[0] < now - RAID_WINDOW_MS) {
      joinTracker.shift();
    }

    // Eşik aşıldı mı?
    if (joinTracker.length >= RAID_THRESHOLD) {
      const raidEmbed = baseEmbed(COLORS.DANGER)
        .setTitle('🚨🚨 RAİD ALARMI — ACİL DURUM 🚨🚨')
        .setDescription(
          '```ansi\n' +
          '\u001b[2;31m██ TOPLU KATILIM TESPİT EDİLDİ ██\u001b[0m\n' +
          '```\n' +
          `> **${RAID_WINDOW_MS / 1000} saniyede ${joinTracker.length} yeni üye katıldı!**\n` +
          '> Doğrulama seviyesini yükseltmeyi düşünün.'
        );

      await sendLog(member.guild, raidEmbed);

      // Sayacı sıfırla (çift bildirim olmasın)
      joinTracker.length = 0;
    }

    // ── Hesap yaşı kontrolü (yeni hesap uyarısı) ─────────────
    const accountAge = Date.now() - member.user.createdTimestamp;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (accountAge < sevenDays) {
      const warningEmbed = baseEmbed(COLORS.WARNING)
        .setTitle('⚠️ YENİ HESAP UYARISI')
        .setDescription(
          `> ${member} (\`${member.user.tag}\`) hesabı **${Math.floor(accountAge / (60 * 60 * 1000))} saat** önce oluşturulmuş.\n` +
          '> Bu hesap potansiyel alt hesap (alt account) olabilir.'
        );

      await sendLog(member.guild, warningEmbed);
    }
  },
};
