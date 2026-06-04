// ============================================================
//  /automod — Otomatik Moderasyon Yönetimi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { getSettings, saveSettings } from '../utils/settingsManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('🤖 Otomatik moderasyon ayarları')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('durum')
        .setDescription('Mevcut automod ayarlarını gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Bir koruma özelliğini açar/kapatır.')
        .addStringOption(opt => opt.setName('özellik').setDescription('Özellik').setRequired(true)
          .addChoices(
            { name: 'Anti-Spam', value: 'antiSpam' },
            { name: 'Anti-Link', value: 'antiLink' },
            { name: 'Küfür Filtresi', value: 'badWords' },
            { name: 'Caps Engel', value: 'capsFilter' },
            { name: 'Duplicate Engel', value: 'duplicateFilter' },
          ))
    )
    .addSubcommand(sub =>
      sub.setName('hepsini-ac')
        .setDescription('Tüm koruma özelliklerini açar.')
    )
    .addSubcommand(sub =>
      sub.setName('hepsini-kapat')
        .setDescription('Tüm koruma özelliklerini kapatır.')
    )
    .addSubcommand(sub =>
      sub.setName('kanal-muaf')
        .setDescription('Bir kanalı automod\'dan muaf tutar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Muaf tutulacak kanal').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kanal-muaf-kaldir')
        .setDescription('Bir kanalın muafiyetini kaldırır.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Muafiyeti kaldırılacak kanal').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const settings = getSettings();

    switch (sub) {
      case 'durum': {
        const g = settings.global;
        const statusIcon = (val) => val ? '✅ Açık' : '❌ Kapalı';

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle('🤖 AUTOMOD DURUMU')
          .addFields(
            { name: '📨 Anti-Spam', value: statusIcon(g.antiSpam), inline: true },
            { name: '🔗 Anti-Link', value: statusIcon(g.antiLink), inline: true },
            { name: '🤬 Küfür Filtresi', value: statusIcon(g.badWords), inline: true },
            { name: '🔠 Caps Engel', value: statusIcon(g.capsFilter), inline: true },
            { name: '🔄 Duplicate Engel', value: statusIcon(g.duplicateFilter), inline: true },
          );

        const exemptChannels = Object.entries(settings.channels)
          .filter(([, ch]) => !ch.antiSpam && !ch.antiLink && !ch.badWords && !ch.capsFilter && !ch.duplicateFilter)
          .map(([id]) => `<#${id}>`);

        if (exemptChannels.length > 0) {
          embed.addFields({ name: '🚫 Muaf Kanallar', value: exemptChannels.join(', ') });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'toggle': {
        const feature = interaction.options.getString('özellik');
        settings.global[feature] = !settings.global[feature];
        saveSettings(settings);

        const featureNames = {
          antiSpam: 'Anti-Spam', antiLink: 'Anti-Link',
          badWords: 'Küfür Filtresi', capsFilter: 'Caps Engel',
          duplicateFilter: 'Duplicate Engel'
        };

        const embed = baseEmbed(settings.global[feature] ? COLORS.SUCCESS : COLORS.DANGER)
          .setTitle(`${settings.global[feature] ? '✅' : '❌'} ${featureNames[feature]} ${settings.global[feature] ? 'AÇILDI' : 'KAPATILDI'}`)
          .setDescription(`**${featureNames[feature]}** özelliği ${settings.global[feature] ? 'aktif' : 'devre dışı'} edildi.`);

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'hepsini-ac': {
        settings.global = { antiSpam: true, antiLink: true, badWords: true, capsFilter: true, duplicateFilter: true };
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ TÜM KORUMALAR AÇILDI')] });
        break;
      }

      case 'hepsini-kapat': {
        settings.global = { antiSpam: false, antiLink: false, badWords: false, capsFilter: false, duplicateFilter: false };
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ TÜM KORUMALAR KAPATILDI')] });
        break;
      }

      case 'kanal-muaf': {
        const channel = interaction.options.getChannel('kanal');
        settings.channels[channel.id] = { antiSpam: false, antiLink: false, badWords: false, capsFilter: false, duplicateFilter: false };
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Kanal Muaf Tutuldu').setDescription(`${channel} artık automod'dan muaf.`)] });
        break;
      }

      case 'kanal-muaf-kaldir': {
        const channel = interaction.options.getChannel('kanal');
        delete settings.channels[channel.id];
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Muafiyet Kaldırıldı').setDescription(`${channel} artık global ayarlara tabi.`)] });
        break;
      }
    }
  },
};
