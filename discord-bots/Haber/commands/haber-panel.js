import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { haberPanelEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('haber-panel')
    .setDescription('Haber Yönetim Merkezi (Sadece Yetkililer).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('news:create')
        .setLabel('Yeni Haber Yarat')
        .setEmoji('📰')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('news:edit')
        .setLabel('Haberi Düzenle')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('news:delete')
        .setLabel('Haberi Sil')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = haberPanelEmbed();

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      flags: [MessageFlags.Ephemeral]
    });
  },
};
