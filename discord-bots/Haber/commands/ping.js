// ── ping.js | Haber Command ─────────────────────────────────
// Botun yanıt süresini kontrol eder.

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('haber-ping')
    .setDescription('📰 Haber botunun yanıt süresini kontrol eder.'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      `📰 **Haber Ping**\n` +
      `> 📡 Gecikme: **${latency}ms**\n` +
      `> 🌐 API: **${apiLatency}ms**`
    );
  },
};
