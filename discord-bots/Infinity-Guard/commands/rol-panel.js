import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, MessageFlags } from 'discord.js';
import { rolePanelEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rol-panel')
    .setDescription('Rol ve yetki kontrol merkezini açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // 1. Satır: Yeni Rol Oluşturma Butonu
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('role:create_start')
        .setLabel('Yeni Rol Oluştur')
        .setEmoji('✨')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('role:manage_start')
        .setLabel('Rol Ver / Al')
        .setEmoji('🆔')
        .setStyle(ButtonStyle.Primary)
    );

    const embed = rolePanelEmbed(interaction.guild);

    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow]
    });
  },
};
