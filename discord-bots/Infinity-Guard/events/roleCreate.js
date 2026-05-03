import { Events } from 'discord.js';
import { sendLog } from '../utils/logger.js';
import { roleCreateLogEmbed } from '../utils/embeds.js';

export default {
  name: Events.GuildRoleCreate,
  async execute(role, client) {
    if (!role.guild) return;

    try {
      // Audit logdan kimin oluşturduğunu bulmaya çalış
      const auditLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: 30, // ROLE_CREATE
      });
      
      const logEntry = auditLogs.entries.first();
      let executor = null;
      
      if (logEntry && logEntry.target.id === role.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }

      const embed = roleCreateLogEmbed(role, executor);
      await sendLog(role.guild, embed);
    } catch (error) {
      console.error('[Infinity-Guard] RoleCreate log hatası:', error);
    }
  },
};
