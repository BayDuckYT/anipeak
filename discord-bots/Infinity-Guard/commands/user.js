// ============================================================
//  /user — Kullanıcı Bilgi & Yönetim Komutları
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('👤 Kullanıcı bilgi ve yönetim komutları')
    .addSubcommand(sub =>
      sub.setName('bilgi')
        .setDescription('Kullanıcı hakkında detaylı bilgi gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Bilgisi alınacak kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('avatar')
        .setDescription('Kullanıcının avatarını gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Avatarı gösterilecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('banner')
        .setDescription('Kullanıcının bannerını gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Bannerı gösterilecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('nick')
        .setDescription('Kullanıcının takma adını değiştirir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('isim').setDescription('Yeni takma ad').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('nick-sifirla')
        .setDescription('Kullanıcının takma adını sıfırlar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('roller')
        .setDescription('Kullanıcının rollerini listeler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'bilgi': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const fullUser = await user.fetch(true); // Banner bilgisi için

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`👤 ${user.tag}`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
          .addFields(
            { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
            { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '🤖 Bot mu?', value: user.bot ? '✅ Evet' : '❌ Hayır', inline: true },
          );

        if (member) {
          embed.addFields(
            { name: '📥 Sunucuya Katılma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: '🏷️ Takma Ad', value: member.nickname || '*Yok*', inline: true },
            { name: '🎨 En Yüksek Rol', value: `${member.roles.highest}`, inline: true },
            { name: '👥 Rol Sayısı', value: `\`${member.roles.cache.size - 1}\``, inline: true },
            { name: '🟢 Durum', value: member.presence?.status || 'çevrimdışı', inline: true },
            { name: '🔇 Susturulmuş?', value: member.isCommunicationDisabled() ? `✅ Bitiş: <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R>` : '❌ Hayır', inline: true },
          );
        }

        if (fullUser.banner) {
          embed.setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }));
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'avatar': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🖼️ ${user.tag} — Avatar`)
          .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));

        if (member && member.avatar) {
          embed.setDescription(`[Sunucu Avatarı](${member.displayAvatarURL({ dynamic: true, size: 1024 })}) | [Global Avatar](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`);
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'banner': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const fullUser = await user.fetch(true);

        if (!fullUser.banner) {
          return interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Bu kullanıcının bannerı yok.')] });
        }

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🎨 ${user.tag} — Banner`)
          .setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'nick': {
        if (!hasPermission(interaction.member, 'MOD')) { return interaction.editReply({ content: '❌ Bu komutu kullanmak için **Takma Adları Yönet** yetkiniz olmalı.' }); }
        const target = interaction.options.getMember('kullanıcı');
        const newNick = interaction.options.getString('isim');
        if (!target) return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });

        const oldNick = target.nickname || target.user.username;
        await target.setNickname(newNick, `Yetkili: ${interaction.user.tag}`);

        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Takma Ad Değiştirildi').setDescription(`**${oldNick}** → **${newNick}**`)] });
        break;
      }

      case 'nick-sifirla': {
        if (!hasPermission(interaction.member, 'MOD')) { return interaction.editReply({ content: '❌ Yetkiniz yok.' }); }
        const target = interaction.options.getMember('kullanıcı');
        if (!target) return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });

        await target.setNickname(null, `Sıfırlayan: ${interaction.user.tag}`);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Takma Ad Sıfırlandı')] });
        break;
      }

      case 'roller': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });

        const roles = member.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(r => `${r}`)
          .join(', ') || '*Rol yok*';

        const embed = baseEmbed(COLORS.PURPLE)
          .setTitle(`🏷️ ${user.tag} — Roller (${member.roles.cache.size - 1})`)
          .setDescription(roles.substring(0, 4000));
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
