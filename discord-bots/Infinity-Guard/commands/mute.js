// ============================================================
//  /mute — Susturma Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

const DURATION_CHOICES = [
  { name: '1 Dakika', value: 60 * 1000 },
  { name: '5 Dakika', value: 5 * 60 * 1000 },
  { name: '10 Dakika', value: 10 * 60 * 1000 },
  { name: '30 Dakika', value: 30 * 60 * 1000 },
  { name: '1 Saat', value: 60 * 60 * 1000 },
  { name: '6 Saat', value: 6 * 60 * 60 * 1000 },
  { name: '12 Saat', value: 12 * 60 * 60 * 1000 },
  { name: '1 Gün', value: 24 * 60 * 60 * 1000 },
  { name: '3 Gün', value: 3 * 24 * 60 * 60 * 1000 },
  { name: '7 Gün', value: 7 * 24 * 60 * 60 * 1000 },
  { name: '28 Gün (Maks)', value: 28 * 24 * 60 * 60 * 1000 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🤐 Susturma yönetim komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('sustur')
        .setDescription('Kullanıcıyı susturur (timeout).')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturulacak kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('süre').setDescription('Süre').setRequired(true)
          .addChoices(...DURATION_CHOICES.map(d => ({ name: d.name, value: d.value }))))
        .addStringOption(opt => opt.setName('sebep').setDescription('Susturma sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('ac')
        .setDescription('Kullanıcının susturmasını kaldırır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('toplu')
        .setDescription('Birden fazla kullanıcıyı susturur.')
        .addStringOption(opt => opt.setName('kullanıcılar').setDescription('ID\'leri boşlukla ayırın').setRequired(true))
        .addIntegerOption(opt => opt.setName('süre').setDescription('Süre').setRequired(true)
          .addChoices(...DURATION_CHOICES.map(d => ({ name: d.name, value: d.value }))))
        .addStringOption(opt => opt.setName('sebep').setDescription('Susturma sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Şu anda susturulmuş kullanıcıları listeler.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'sustur': {
        const target = interaction.options.getMember('kullanıcı');
        const duration = interaction.options.getInteger('süre');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (!target) return interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Kullanıcı bulunamadı')] });
        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
          return interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Yetki yetersiz')] });
        }

        const durationLabel = DURATION_CHOICES.find(d => d.value === duration)?.name || `${duration}ms`;
        await target.timeout(duration, `${reason} | Yetkili: ${interaction.user.tag}`);

        const embed = baseEmbed(COLORS.DANGER)
          .setTitle('🤐 KULLANICI SUSTURULDU')
          .addFields(
            { name: '🎯 Kullanıcı', value: `${target} (\`${target.id}\`)`, inline: true },
            { name: '⏱️ Süre', value: `\`${durationLabel}\``, inline: true },
            { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'ac': {
        const target = interaction.options.getMember('kullanıcı');
        if (!target) return interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Kullanıcı bulunamadı')] });

        await target.timeout(null, `Susturma kaldırıldı | Yetkili: ${interaction.user.tag}`);

        const embed = baseEmbed(COLORS.SUCCESS)
          .setTitle('🔊 SUSTURMA KALDIRILDI')
          .addFields(
            { name: '🎯 Kullanıcı', value: `${target}`, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'toplu': {
        const ids = interaction.options.getString('kullanıcılar').split(/\s+/);
        const duration = interaction.options.getInteger('süre');
        const reason = interaction.options.getString('sebep') || 'Toplu susturma';
        let success = 0, failed = 0;

        for (const id of ids) {
          try {
            const member = await interaction.guild.members.fetch(id.trim());
            await member.timeout(duration, `${reason} | Yetkili: ${interaction.user.tag}`);
            success++;
          } catch { failed++; }
        }

        const embed = baseEmbed(success > 0 ? COLORS.SUCCESS : COLORS.DANGER)
          .setTitle('🤐 TOPLU SUSTURMA SONUÇLARI')
          .addFields(
            { name: '✅ Başarılı', value: `\`${success}\``, inline: true },
            { name: '❌ Başarısız', value: `\`${failed}\``, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'liste': {
        const members = await interaction.guild.members.fetch();
        const muted = members.filter(m => m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now());

        if (muted.size === 0) {
          return interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Kimse susturulmamış')] });
        }

        const list = muted.map(m => `• ${m} — Bitiş: <t:${Math.floor(m.communicationDisabledUntilTimestamp / 1000)}:R>`).join('\n');
        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🤐 SUSTURULAN KULLANICILAR (${muted.size})`)
          .setDescription(list.substring(0, 4000));
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
