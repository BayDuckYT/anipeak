import { Events } from 'discord.js';
import { sendLog } from '../utils/logger.js';
import { roleDeleteLogEmbed } from '../utils/embeds.js';

export default {
  name: Events.GuildRoleDelete,
  async execute(role, client) {
    if (!role.guild) return;

    try {
      // Audit logdan kimin sildiğini bulmaya çalış
      const auditLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: 32, // ROLE_DELETE
      });
      
      const logEntry = auditLogs.entries.first();
      let executor = null;
      
      if (logEntry && logEntry.target.id === role.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }

      const embed = roleDeleteLogEmbed(role, executor);
      await sendLog(role.guild, embed);
    } catch (error) {
      console.error('[Infinity-Guard] RoleDelete log hatası:', error);
    }
  },
};
