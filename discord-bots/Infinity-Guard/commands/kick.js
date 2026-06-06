// ============================================================
//  /kick — Kick Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('🥾 Kick yönetim komutları')
    
    .addSubcommand(sub =>
      sub.setName('at')
        .setDescription('Kullanıcıyı sunucudan atar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Atılacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Kick sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('toplu')
        .setDescription('Birden fazla kullanıcıyı aynı anda atar.')
        .addStringOption(opt => opt.setName('kullanıcılar').setDescription('ID\'leri boşlukla ayırın').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Kick sebebi'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'AYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


    if (sub === 'at') {
      const target = interaction.options.getMember('kullanıcı');
      const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

      if (!target) return interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Kullanıcı bulunamadı')] });
      if (target.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Yetki yetersiz')] });
      }
      if (!target.kickable) return interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Atılamaz')] });

      await target.kick(`${reason} | Yetkili: ${interaction.user.tag}`);

      const embed = baseEmbed(COLORS.WARNING)
        .setTitle('🥾 KULLANICI ATILDI')
        .addFields(
          { name: '🎯 Kullanıcı', value: `${target.user.tag} (\`${target.id}\`)`, inline: true },
          { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
          { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
        );
      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, embed);

    } else if (sub === 'toplu') {
      const ids = interaction.options.getString('kullanıcılar').split(/\s+/);
      const reason = interaction.options.getString('sebep') || 'Toplu kick';
      let success = 0, failed = 0;

      for (const id of ids) {
        try {
          const member = await interaction.guild.members.fetch(id.trim());
          if (member.kickable) { await member.kick(`${reason} | Yetkili: ${interaction.user.tag}`); success++; }
          else failed++;
        } catch { failed++; }
      }

      const embed = baseEmbed(success > 0 ? COLORS.SUCCESS : COLORS.DANGER)
        .setTitle('🥾 TOPLU KICK SONUÇLARI')
        .addFields(
          { name: '✅ Başarılı', value: `\`${success}\``, inline: true },
          { name: '❌ Başarısız', value: `\`${failed}\``, inline: true },
        );
      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, embed);
    }
  },
};
