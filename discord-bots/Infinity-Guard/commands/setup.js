// ============================================================
//  /setup — Log kanalı ve bot ayarlarını yapılandır
// ============================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { hasPermission } from '../utils/permissions.js';
import { COLORS, LOG_CHANNEL_NAME } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guard-setup')
    .setDescription('🛡️ Infinity Guard log kanalını ve ayarları yapılandırır.')
    ,

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'BYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


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
        '```\n' +
        '> **Akıllı Kurulum:** Aşağıdaki menüyü kullanarak otomatik yapılandırma yapabilirsiniz.'
      )
      .addFields(
        { name: '📋 Log Kanalı',    value: `${logChannel}`, inline: true },
        { name: '🔗 Anti-Link',     value: '`✅ Aktif`',    inline: true },
        { name: '🚫 Anti-Spam',     value: '`✅ Aktif`',    inline: true },
        { name: '🤬 Küfür Filtresi', value: '`✅ Aktif`',    inline: true },
        { name: '🤖 Akıllı Selam',  value: '`✅ Aktif`',    inline: true },
      );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup:auto_config')
        .setPlaceholder('🛡️ Otomatik Yapılandırma Seçin')
        .addOptions([
          {
            label: 'Bütün Kanalları Koru',
            description: 'Mevcut tüm kanalları tam koruma (Anti-Spam, Link, Raid) kapsamına alır.',
            value: 'protect_all',
            emoji: '🛡️',
          },
          {
            label: 'Varsayılan Ayarlar',
            description: 'Sadece log kanalını ve temel filtreleri aktif eder.',
            value: 'default_setup',
            emoji: '⚙️',
          }
        ])
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
