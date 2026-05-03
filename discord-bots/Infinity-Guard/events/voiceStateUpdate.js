// ============================================================
//  voiceStateUpdate — Ses Kanalı Giriş/Çıkış Log Sistemi
// ============================================================

import { voiceLogEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  name: 'voiceStateUpdate',
  once: false,

  async execute(oldState, newState, client) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;

    // Ses kanalına katıldı
    if (!oldState.channel && newState.channel) {
      const embed = voiceLogEmbed({
        member,
        action: 'katıldı',
        channel: newState.channel,
      });
      await sendLog(guild, embed);
    }

    // Ses kanalından ayrıldı
    else if (oldState.channel && !newState.channel) {
      const embed = voiceLogEmbed({
        member,
        action: 'ayrıldı',
        channel: oldState.channel,
      });
      await sendLog(guild, embed);
    }

    // Ses kanalı değiştirdi (taşındı)
    else if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
      const embed = voiceLogEmbed({
        member,
        action: 'taşındı',
        channel: newState.channel,
      });
      embed.addFields({
        name: '📤 Önceki Kanal',
        value: `${oldState.channel}`,
        inline: true,
      });
      await sendLog(guild, embed);
    }
  },
};
