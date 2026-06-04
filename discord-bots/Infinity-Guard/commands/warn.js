// ============================================================
//  /warn — Uyarı Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

// Basit in-memory uyarı deposu (restart'ta sıfırlanır — Supabase ile kalıcı yapılabilir)
const warningsDB = new Map();

function getWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return warningsDB.get(key) || [];
}

function addWarning(guildId, userId, warning) {
  const key = `${guildId}:${userId}`;
  const list = warningsDB.get(key) || [];
  list.push(warning);
  warningsDB.set(key, list);
  return list.length;
}

function removeWarning(guildId, userId, index) {
  const key = `${guildId}:${userId}`;
  const list = warningsDB.get(key) || [];
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    warningsDB.set(key, list);
    return true;
  }
  return false;
}

function clearWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  warningsDB.delete(key);
}

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Uyarı yönetim komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Kullanıcıya uyarı verir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Kullanıcının uyarılarını gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kontrol edilecek kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sil')
        .setDescription('Belirli bir uyarıyı siler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('numara').setDescription('Uyarı numarası (1\'den başlar)').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('temizle')
        .setDescription('Kullanıcının tüm uyarılarını temizler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('log')
        .setDescription('Sunucudaki tüm uyarı istatistiklerini gösterir.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'ver': {
        const target = interaction.options.getUser('kullanıcı');
        const reason = interaction.options.getString('sebep');

        const count = addWarning(interaction.guild.id, target.id, {
          reason,
          moderator: interaction.user.id,
          date: Date.now(),
        });

        const embed = baseEmbed(COLORS.WARNING)
          .setTitle('⚠️ UYARI VERİLDİ')
          .addFields(
            { name: '🎯 Kullanıcı', value: `${target} (\`${target.id}\`)`, inline: true },
            { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
            { name: '📊 Toplam Uyarı', value: `\`${count}\``, inline: true },
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
          );

        // 5+ uyarıda otomatik mute önerisi
        if (count >= 5) {
          embed.addFields({ name: '🚨 DİKKAT', value: `Bu kullanıcının **${count}** uyarısı var! Susturma veya ban düşünün.` });
        }

        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);

        // Kullanıcıya DM ile bildirim gönder
        try {
          await target.send({ embeds: [
            baseEmbed(COLORS.WARNING)
              .setTitle(`⚠️ Uyarı Aldınız — ${interaction.guild.name}`)
              .setDescription(`**Sebep:** \`${reason}\`\n**Uyarı Sayınız:** \`${count}\``)
          ] });
        } catch {} // DM kapalıysa hata verme
        break;
      }

      case 'liste': {
        const target = interaction.options.getUser('kullanıcı');
        const warnings = getWarnings(interaction.guild.id, target.id);

        if (warnings.length === 0) {
          return interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Temiz').setDescription(`${target.tag} kullanıcısının uyarısı yok.`)] });
        }

        const list = warnings.map((w, i) =>
          `**${i + 1}.** \`${w.reason}\` — <@${w.moderator}> (<t:${Math.floor(w.date / 1000)}:R>)`
        ).join('\n');

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`📋 ${target.tag} — Uyarı Listesi (${warnings.length})`)
          .setDescription(list.substring(0, 4000));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'sil': {
        const target = interaction.options.getUser('kullanıcı');
        const num = interaction.options.getInteger('numara');

        if (removeWarning(interaction.guild.id, target.id, num - 1)) {
          await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Uyarı Silindi').setDescription(`${target.tag} kullanıcısının **${num}. uyarısı** silindi.`)] });
        } else {
          await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Uyarı bulunamadı')] });
        }
        break;
      }

      case 'temizle': {
        const target = interaction.options.getUser('kullanıcı');
        clearWarnings(interaction.guild.id, target.id);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('🧹 Uyarılar Temizlendi').setDescription(`${target.tag} kullanıcısının tüm uyarıları silindi.`)] });
        break;
      }

      case 'log': {
        let totalWarnings = 0;
        let userCounts = [];

        for (const [key, list] of warningsDB.entries()) {
          if (key.startsWith(interaction.guild.id)) {
            const userId = key.split(':')[1];
            totalWarnings += list.length;
            userCounts.push({ userId, count: list.length });
          }
        }

        userCounts.sort((a, b) => b.count - a.count);
        const top = userCounts.slice(0, 10).map((u, i) => `**${i + 1}.** <@${u.userId}> — \`${u.count}\` uyarı`).join('\n');

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle('📊 UYARI İSTATİSTİKLERİ')
          .addFields(
            { name: '📈 Toplam Uyarı', value: `\`${totalWarnings}\``, inline: true },
            { name: '👥 Uyarılı Kişi', value: `\`${userCounts.length}\``, inline: true },
          );
        if (top) embed.addFields({ name: '🏆 En Çok Uyarı Alan', value: top });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
