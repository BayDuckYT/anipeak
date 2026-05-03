// ── ping.js | XP Command ────────────────────────────────────
// Botun yanıt süresini ve Supabase durumunu kontrol eder.

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xp-ping')
    .setDescription('⚡ XP botunun yanıt süresini ve Supabase bağlantısını kontrol eder.'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    let supabaseStatus = '❌ Bağlı değil';
    if (client.supabase) {
      try {
        const { error } = await client.supabase.from('profiles').select('id').limit(1);
        supabaseStatus = error ? `⚠️ Hata: ${error.message}` : '✅ Bağlı';
      } catch {
        supabaseStatus = '⚠️ Bağlantı hatası';
      }
    }

    await interaction.editReply(
      `⚡ **XP Bot Ping**\n` +
      `> 📡 Gecikme: **${latency}ms**\n` +
      `> 🌐 API: **${apiLatency}ms**\n` +
      `> 🗄️ Supabase: **${supabaseStatus}**`
    );
  },
};
