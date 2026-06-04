// ============================================================
//  /server — Sunucu Bilgi Komutları
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('🏠 Sunucu bilgi komutları')
    .addSubcommand(sub =>
      sub.setName('bilgi')
        .setDescription('Sunucu hakkında detaylı bilgi gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('ikon')
        .setDescription('Sunucu ikonunu gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('banner')
        .setDescription('Sunucu bannerını gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('boostlar')
        .setDescription('Boost bilgilerini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('emojiler')
        .setDescription('Sunucu emojilerini listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('roller')
        .setDescription('Sunucu rollerini listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('kanallar')
        .setDescription('Kanal istatistiklerini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('uyeler')
        .setDescription('Üye istatistiklerini gösterir.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const guild = interaction.guild;

    switch (sub) {
      case 'bilgi': {
        const owner = await guild.fetchOwner();
        const members = guild.memberCount;
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;
        const emojis = guild.emojis.cache;

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🏠 ${guild.name}`)
          .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
          .addFields(
            { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
            { name: '👑 Sahip', value: `${owner.user}`, inline: true },
            { name: '📅 Oluşturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👥 Üye', value: `\`${members}\``, inline: true },
            { name: '📺 Kanal', value: `\`${channels.size}\``, inline: true },
            { name: '🏷️ Rol', value: `\`${roles.size}\``, inline: true },
            { name: '😀 Emoji', value: `\`${emojis.size}\``, inline: true },
            { name: '🔒 Doğrulama', value: `\`${['Yok', 'Düşük', 'Orta', 'Yüksek', 'En Yüksek'][guild.verificationLevel]}\``, inline: true },
            { name: '🚀 Boost', value: `\`${guild.premiumSubscriptionCount || 0}\` (Tier ${guild.premiumTier})`, inline: true },
          );
        if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'ikon': {
        if (!guild.iconURL()) return interaction.editReply({ content: '❌ Sunucunun ikonu yok.' });
        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🖼️ ${guild.name} — İkon`)
          .setImage(guild.iconURL({ dynamic: true, size: 1024 }));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'banner': {
        if (!guild.bannerURL()) return interaction.editReply({ content: '❌ Sunucunun bannerı yok.' });
        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`🎨 ${guild.name} — Banner`)
          .setImage(guild.bannerURL({ size: 1024 }));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'boostlar': {
        const embed = baseEmbed(COLORS.NEON_PINK)
          .setTitle(`🚀 ${guild.name} — Boost Bilgileri`)
          .addFields(
            { name: '🚀 Boost Sayısı', value: `\`${guild.premiumSubscriptionCount || 0}\``, inline: true },
            { name: '⭐ Tier', value: `\`${guild.premiumTier}\``, inline: true },
          );

        const boosters = guild.members.cache.filter(m => m.premiumSince);
        if (boosters.size > 0) {
          const list = boosters.first(15).map(m => `• ${m.user.tag} — <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`).join('\n');
          embed.addFields({ name: '💎 Boosterlar', value: list });
        }
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'emojiler': {
        const emojis = guild.emojis.cache;
        if (emojis.size === 0) return interaction.editReply({ content: '❌ Sunucuda emoji yok.' });

        const animated = emojis.filter(e => e.animated);
        const normal = emojis.filter(e => !e.animated);

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`😀 ${guild.name} — Emojiler (${emojis.size})`)
          .addFields(
            { name: `Normal (${normal.size})`, value: normal.first(50).map(e => `${e}`).join(' ') || '*Yok*' },
          );
        if (animated.size > 0) {
          embed.addFields({ name: `Hareketli (${animated.size})`, value: animated.first(20).map(e => `${e}`).join(' ') });
        }
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'roller': {
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position).filter(r => r.id !== guild.id);
        const list = roles.first(30).map(r => `${r} — \`${r.members.size}\` üye`).join('\n');

        const embed = baseEmbed(COLORS.PURPLE)
          .setTitle(`🏷️ ${guild.name} — Roller (${roles.size})`)
          .setDescription(list.substring(0, 4000));
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'kanallar': {
        const channels = guild.channels.cache;
        const text = channels.filter(c => c.type === 0).size;
        const voice = channels.filter(c => c.type === 2).size;
        const category = channels.filter(c => c.type === 4).size;
        const forum = channels.filter(c => c.type === 15).size;
        const stage = channels.filter(c => c.type === 13).size;

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`📺 ${guild.name} — Kanal İstatistikleri`)
          .addFields(
            { name: '💬 Metin', value: `\`${text}\``, inline: true },
            { name: '🔊 Ses', value: `\`${voice}\``, inline: true },
            { name: '📁 Kategori', value: `\`${category}\``, inline: true },
            { name: '📋 Forum', value: `\`${forum}\``, inline: true },
            { name: '🎭 Sahne', value: `\`${stage}\``, inline: true },
            { name: '📊 Toplam', value: `\`${channels.size}\``, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'uyeler': {
        const members = guild.members.cache;
        const bots = members.filter(m => m.user.bot).size;
        const humans = members.size - bots;
        const online = members.filter(m => m.presence?.status === 'online').size;
        const idle = members.filter(m => m.presence?.status === 'idle').size;
        const dnd = members.filter(m => m.presence?.status === 'dnd').size;

        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`👥 ${guild.name} — Üye İstatistikleri`)
          .addFields(
            { name: '👥 Toplam', value: `\`${guild.memberCount}\``, inline: true },
            { name: '🧑 İnsan', value: `\`${humans}\``, inline: true },
            { name: '🤖 Bot', value: `\`${bots}\``, inline: true },
            { name: '🟢 Çevrimiçi', value: `\`${online}\``, inline: true },
            { name: '🟡 Boşta', value: `\`${idle}\``, inline: true },
            { name: '🔴 Rahatsız Etmeyin', value: `\`${dnd}\``, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
