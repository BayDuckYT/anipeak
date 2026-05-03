// ============================================================
//  /kullanici — Kullanıcı Bilgi Raporu (Bonus Komut)
// ============================================================

import { SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { COLORS } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kullanici')
    .setDescription('👤 Bir kullanıcının detaylı bilgilerini görüntüler.')
    .addUserOption((opt) =>
      opt.setName('hedef')
        .setDescription('Bilgisi görüntülenecek kullanıcı')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('hedef');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = baseEmbed(COLORS.CYBER_BLUE)
      .setTitle(`👤 Kullanıcı Bilgileri — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🆔 ID',           value: `\`${user.id}\``,  inline: true },
        { name: '🤖 Bot mu?',      value: user.bot ? '`Evet`' : '`Hayır`', inline: true },
        { name: '📅 Hesap Açılışı', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
      );

    if (member) {
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => `${r}`)
        .join(', ') || '*Rol yok*';

      const status = member.presence?.status || 'çevrimdışı';
      const statusEmoji = { online: '🟢', idle: '🟡', dnd: '🔴', çevrimdışı: '⚫' };

      embed.addFields(
        { name: '📥 Sunucu Katılım', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: '🎭 Takma Ad',       value: `\`${member.displayName}\``, inline: true },
        { name: `${statusEmoji[status] || '⚫'} Durum`, value: `\`${status}\``, inline: true },
        { name: `🏷️ Roller (${member.roles.cache.size - 1})`, value: roles.substring(0, 1024) },
      );

      if (member.communicationDisabledUntilTimestamp) {
        embed.addFields({
          name: '🤐 Susturulmuş',
          value: `<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R> bitiyor`,
          inline: true,
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
