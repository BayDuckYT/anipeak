import { Events } from 'discord.js';
import { sendLog } from '../utils/logger.js';
import { channelCreateLogEmbed } from '../utils/embeds.js';

export default {
  name: Events.ChannelCreate,
  async execute(channel, client) {
    if (!channel.guild) return;

    try {
      // Audit logdan kimin oluşturduğunu bulmaya çalış
      const auditLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: 10, // CHANNEL_CREATE
      });
      
      const logEntry = auditLogs.entries.first();
      let executor = null;
      
      // Log kaydı bu kanala mı ait ve yeni mi yapılmış (son 5 saniye) kontrol et
      if (logEntry && logEntry.target.id === channel.id && Date.now() - logEntry.createdTimestamp < 5000) {
        executor = logEntry.executor;
      }

      const embed = channelCreateLogEmbed(channel, executor);
      await sendLog(channel.guild, embed);
    } catch (error) {
      console.error('[Infinity-Guard] ChannelCreate log hatası:', error);
    }
  },
};
