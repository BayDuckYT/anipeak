// ============================================================
//  messageDelete — Silinen Mesaj Log Sistemi
// ============================================================

import { messageDeleteLogEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  name: 'messageDelete',
  once: false,

  async execute(message, client) {
    // Bot mesajları ve DM'leri atla
    if (!message.guild) return;
    if (message.author?.bot) return;
    // Kısmi (partial) mesajları atla
    if (message.partial) return;

    const embed = messageDeleteLogEmbed(message);
    await sendLog(message.guild, embed);
  },
};
