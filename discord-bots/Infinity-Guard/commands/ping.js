// ── ping.js | Infinity-Guard Command ────────────────────────
// Botun yanıt süresini kontrol eder — Embed stiliyle.

import { SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { COLORS } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guard-ping')
    .setDescription('🛡️ Infinity-Guard botunun yanıt süresini kontrol eder.'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '📡 Sinyal gönderiliyor...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = baseEmbed(COLORS.CYBER_BLUE)
      .setTitle('📡 INFINITY GUARD — Ping Testi')
      .addFields(
        { name: '⚡ Gecikme',   value: `\`${latency}ms\``,    inline: true },
        { name: '🌐 API',       value: `\`${apiLatency}ms\``, inline: true },
        { name: '🟢 Durum',     value: latency < 200 ? '`Mükemmel`' : latency < 500 ? '`Normal`' : '`Yavaş`', inline: true },
      );

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
