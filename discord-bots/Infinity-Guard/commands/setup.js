// ============================================================
//  /setup — Log kanalı ve bot ayarlarını yapılandır
// ============================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { COLORS, LOG_CHANNEL_NAME } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guard-setup')
    .setDescription('🛡️ Infinity Guard log kanalını ve ayarları yapılandırır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guild = interaction.guild;

    // ── infinity-log kanalını kontrol et / oluştur ────────────
    let logChannel = guild.channels.cache.find(
      (ch) => ch.name === LOG_CHANNEL_NAME && ch.isTextBased()
    );

    if (!logChannel) {
      try {
        logChannel = await guild.channels.create({
          name: LOG_CHANNEL_NAME,
          type: ChannelType.GuildText,
          topic: '🛡️ Infinity Guard — Otomatik log kanalı. Silinen mesajlar, moderasyon işlemleri ve güvenlik uyarıları burada.',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: ['ViewChannel'],
            },
            {
              id: interaction.client.user.id,
              allow: ['ViewChannel', 'SendMessages', 'EmbedLinks'],
            },
          ],
        });
      } catch (error) {
        const errEmbed = baseEmbed(COLORS.DANGER)
          .setTitle('❌ Kurulum Hatası')
          .setDescription(`Log kanalı oluşturulamadı: \`${error.message}\``);
        return interaction.editReply({ embeds: [errEmbed] });
      }
    }

    const embed = baseEmbed(COLORS.SUCCESS)
      .setTitle('✅ INFINITY GUARD — KURULUM TAMAMLANDI')
      .setDescription(
        '```\n' +
        '╔═══════════════════════════════════════╗\n' +
        '║   SİBER KALKAN AKTİF EDİLDİ          ║\n' +
        '╚═══════════════════════════════════════╝\n' +
        '```'
      )
      .addFields(
        { name: '📋 Log Kanalı',    value: `${logChannel}`, inline: true },
        { name: '🔗 Anti-Link',     value: '`✅ Aktif`',    inline: true },
        { name: '🚫 Anti-Spam',     value: '`✅ Aktif`',    inline: true },
        { name: '📊 Mesaj Logları', value: '`✅ Aktif`',    inline: true },
        { name: '🔊 Ses Logları',   value: '`✅ Aktif`',    inline: true },
        { name: '👥 Üye Logları',   value: '`✅ Aktif`',    inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
