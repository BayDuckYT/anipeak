// ============================================================
//  messageUpdate — Düzenlenen Mesaj Log Sistemi
// ============================================================

import { messageEditLogEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  name: 'messageUpdate',
  once: false,

  async execute(oldMessage, newMessage, client) {
    // Bot mesajları ve DM'leri atla
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    // İçerik değişmediyse atla (sadece embed güncellemesi vs.)
    if (oldMessage.content === newMessage.content) return;
    // Kısmi mesajları atla
    if (oldMessage.partial || newMessage.partial) return;

    const embed = messageEditLogEmbed(oldMessage, newMessage);
    await sendLog(newMessage.guild, embed);
  },
};
