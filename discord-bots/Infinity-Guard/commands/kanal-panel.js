import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import { channelPanelEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kanal-panel')
    .setDescription('Nükleer kanal yönetim panelini açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // 1. Satır: Butonlar
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('channel:create')
        .setLabel('Kanal Oluştur')
        .setEmoji('📂')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('channel:lockdown')
        .setLabel('Kilit Vur')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('channel:unlock')
        .setLabel('Kilidi Aç')
        .setEmoji('🔓')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('channel:nuke')
        .setLabel('Kanalı Nuke\'le')
        .setEmoji('☢️')
        .setStyle(ButtonStyle.Secondary)
    );

    // 2. Satır: Yavaş Mod (Slowmode) Menüsü
    const slowmodeMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('channel:slowmode')
        .setPlaceholder('⏱️ Kanal Yavaşlatma (Slowmode) Ayarı')
        .addOptions([
          { label: 'Kapat (0s)', value: '0', emoji: '🟢' },
          { label: '5 Saniye', value: '5', emoji: '🟡' },
          { label: '10 Saniye', value: '10', emoji: '🟠' },
          { label: '1 Dakika', value: '60', emoji: '🔴' },
          { label: '5 Dakika', value: '300', emoji: '⏳' },
        ])
    );

    const embed = channelPanelEmbed(interaction.guild);

    await interaction.reply({
      embeds: [embed],
      components: [buttonRow, slowmodeMenu],
      flags: [MessageFlags.Ephemeral] // Sadece yetkili görsün
    });
  },
};
