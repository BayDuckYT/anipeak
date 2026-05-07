import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import { channelPanelEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kanal-panel')
    .setDescription('Nükleer kanal yönetim panelini açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // 1. Satır: Temel Butonlar
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('channel:create')
        .setLabel('Yeni Kanal')
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
        .setCustomId('channel:bulk_action')
        .setLabel('TÜM KANALLARI SEÇ')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Secondary)
    );

    // 2. Satır: Manuel Toplu Seçim Menüsü
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('channel:bulk_select_init')
        .setPlaceholder('🗂️ Belirli Kanalları Toplu Seç')
        .addOptions([
          { label: 'Metin Kanallarını Seç', value: 'all_text', emoji: '📝' },
          { label: 'Ses Kanallarını Seç', value: 'all_voice', emoji: '🔊' },
          { label: 'Kategorileri Seç', value: 'all_categories', emoji: '📁' },
        ])
    );

    // 3. Satır: Yavaş Mod (Slowmode) Menüsü
    const slowmodeMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('channel:slowmode')
        .setPlaceholder('⏱️ Seçili Kanal(lar) için Yavaş Mod')
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
      components: [buttonRow, selectRow, slowmodeMenu],
      flags: [MessageFlags.Ephemeral]
    });
  },
};
