// ============================================================
//  guildMemberRemove — Üye Ayrılma Log Sistemi
// ============================================================

import { memberLeaveEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  name: 'guildMemberRemove',
  once: false,

  async execute(member, client) {
    if (member.user.bot) return;

    const embed = memberLeaveEmbed(member);
    await sendLog(member.guild, embed);
  },
};
