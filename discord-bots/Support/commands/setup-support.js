import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { supportHubEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-support')
    .setDescription('🎫 Kalıcı destek merkezini kurar.')
    ,

  async execute(interaction) {
    if (!hasPermission(interaction.member, 'BYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });

    const embed = supportHubEmbed();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket:open_modal')
        .setLabel('Destek Talebi Oluştur')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: '✅ Destek merkezi başarıyla kuruldu!',
      flags: [MessageFlags.Ephemeral]
    });

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });
  },
};
