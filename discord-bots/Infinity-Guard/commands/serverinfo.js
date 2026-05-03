// ============================================================
//  /serverinfo — Sunucu Bilgi Raporu (Bonus Komut)
// ============================================================

import { SlashCommandBuilder } from 'discord.js';
import { serverInfoEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('📊 Sunucunun detaylı bilgi raporunu görüntüler.'),

  async execute(interaction) {
    await interaction.deferReply();

    // Üye cache'ini güncelle (doğru çevrimiçi sayısı için)
    await interaction.guild.members.fetch();

    const embed = serverInfoEmbed(interaction.guild);
    await interaction.editReply({ embeds: [embed] });
  },
};
