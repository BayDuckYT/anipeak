// ============================================================
//  /lock — Kanal Kilitleme Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Kanal kilitleme komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('kilitle')
        .setDescription('Mevcut kanalı kilitler.')
        .addStringOption(opt => opt.setName('sebep').setDescription('Kilitleme sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('ac')
        .setDescription('Mevcut kanalın kilidini açar.')
    )
    .addSubcommand(sub =>
      sub.setName('tumu-kilitle')
        .setDescription('Tüm metin kanallarını kilitler (Acil Durum).')
        .addStringOption(opt => opt.setName('sebep').setDescription('Kilitleme sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('tumu-ac')
        .setDescription('Tüm metin kanallarının kilidini açar.')
    )
    .addSubcommand(sub =>
      sub.setName('gecici')
        .setDescription('Kanalı belirli süreliğine kilitler.')
        .addIntegerOption(opt => opt.setName('dakika').setDescription('Kaç dakika kilitlensin').setRequired(true).setMinValue(1).setMaxValue(1440))
        .addStringOption(opt => opt.setName('sebep').setDescription('Kilitleme sebebi'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'kilitle': {
        const reason = interaction.options.getString('sebep') || 'Kanal kilitlendi';
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

        const embed = baseEmbed(COLORS.DANGER)
          .setTitle('🔒 KANAL KİLİTLENDİ')
          .addFields(
            { name: '📍 Kanal', value: `${interaction.channel}`, inline: true },
            { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await interaction.channel.send({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'ac': {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });

        const embed = baseEmbed(COLORS.SUCCESS)
          .setTitle('🔓 KANAL KİLİDİ AÇILDI')
          .addFields(
            { name: '📍 Kanal', value: `${interaction.channel}`, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'tumu-kilitle': {
        const reason = interaction.options.getString('sebep') || 'Acil durum kilidi';
        const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;

        for (const [, ch] of textChannels) {
          try {
            await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            count++;
          } catch {}
        }

        const embed = baseEmbed(COLORS.DANGER)
          .setTitle('🚨 ACİL DURUM — TÜM KANALLAR KİLİTLENDİ')
          .addFields(
            { name: '🔒 Kilitlenen', value: `\`${count}\` kanal`, inline: true },
            { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'tumu-ac': {
        const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;

        for (const [, ch] of textChannels) {
          try {
            await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
            count++;
          } catch {}
        }

        const embed = baseEmbed(COLORS.SUCCESS)
          .setTitle('🔓 TÜM KANAL KİLİTLERİ AÇILDI')
          .addFields(
            { name: '🔓 Açılan', value: `\`${count}\` kanal`, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'gecici': {
        const mins = interaction.options.getInteger('dakika');
        const reason = interaction.options.getString('sebep') || `Geçici kilit (${mins} dk)`;

        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

        setTimeout(async () => {
          try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
            await interaction.channel.send({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('🔓 Geçici Kilit Sona Erdi').setDescription('Kanal tekrar açıldı!')] });
          } catch {}
        }, mins * 60 * 1000);

        const embed = baseEmbed(COLORS.WARNING)
          .setTitle('⏰ GEÇİCİ KİLİT UYGULANDI')
          .addFields(
            { name: '📍 Kanal', value: `${interaction.channel}`, inline: true },
            { name: '⏱️ Süre', value: `\`${mins} dakika\``, inline: true },
            { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await interaction.channel.send({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }
    }
  },
};
