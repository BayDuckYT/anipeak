import { Events } from 'discord.js';
import { sendLog } from '../utils/logger.js';
import { channelDeleteLogEmbed } from '../utils/embeds.js';

export default {
  name: Events.ChannelDelete,
  async execute(channel, client) {
    if (!channel.guild) return;

    try {
      // Audit logdan kimin sildiğini bulmaya çalış
      const auditLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: 12, // CHANNEL_DELETE
      });
      
      const logEntry = auditLogs.entries.first();
      let executor = null;
      
      if (logEntry && logEntry.target.id === channel.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }

      const embed = channelDeleteLogEmbed(channel, executor);
      await sendLog(channel.guild, embed);
    } catch (error) {
      console.error('[Infinity-Guard] ChannelDelete log hatası:', error);
    }
  },
};
