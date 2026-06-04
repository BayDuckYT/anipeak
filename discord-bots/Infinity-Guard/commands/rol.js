// ============================================================
//  /rol — Rol Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rol')
    .setDescription('🏷️ Rol yönetim komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Kullanıcıya rol verir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('al')
        .setDescription('Kullanıcıdan rol alır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Alınacak rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('herkese')
        .setDescription('Herkese bir rol verir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('botlara')
        .setDescription('Tüm botlara bir rol verir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('bilgi')
        .setDescription('Rol hakkında bilgi gösterir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Bilgi alınacak rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('uyeler')
        .setDescription('Roldeki üyeleri listeler.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Üyeleri listelecek rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('olustur')
        .setDescription('Yeni rol oluşturur.')
        .addStringOption(opt => opt.setName('isim').setDescription('Rol ismi').setRequired(true))
        .addStringOption(opt => opt.setName('renk').setDescription('Hex renk kodu (örn: #FF0000)'))
        .addBooleanOption(opt => opt.setName('görünür').setDescription('Üye listesinde ayrı gösterilsin mi'))
    )
    .addSubcommand(sub =>
      sub.setName('sil')
        .setDescription('Bir rolü siler.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Silinecek rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('renk')
        .setDescription('Rolün rengini değiştirir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Rengi değişecek rol').setRequired(true))
        .addStringOption(opt => opt.setName('renk').setDescription('Hex renk kodu').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yeniden-adlandir')
        .setDescription('Rolün ismini değiştirir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('İsmi değişecek rol').setRequired(true))
        .addStringOption(opt => opt.setName('isim').setDescription('Yeni isim').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'ver': {
        const member = interaction.options.getMember('kullanıcı');
        const role = interaction.options.getRole('rol');
        if (!member || !role) return interaction.editReply({ content: '❌ Kullanıcı veya rol bulunamadı.' });
        if (role.position >= interaction.member.roles.highest.position) return interaction.editReply({ content: '❌ Bu rolü verecek yetkiniz yok.' });

        await member.roles.add(role);
        const embed = baseEmbed(COLORS.SUCCESS).setTitle('✅ Rol Verildi').setDescription(`${member} → ${role}`);
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'al': {
        const member = interaction.options.getMember('kullanıcı');
        const role = interaction.options.getRole('rol');
        if (!member || !role) return interaction.editReply({ content: '❌ Bulunamadı.' });

        await member.roles.remove(role);
        const embed = baseEmbed(COLORS.WARNING).setTitle('⬇️ Rol Alındı').setDescription(`${member} ← ${role}`);
        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, embed);
        break;
      }

      case 'herkese': {
        const role = interaction.options.getRole('rol');
        const members = await interaction.guild.members.fetch();
        const humans = members.filter(m => !m.user.bot);
        let count = 0;

        for (const [, member] of humans) {
          try { await member.roles.add(role); count++; } catch {}
        }

        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Toplu Rol Verildi').setDescription(`${role} → **${count}** üyeye verildi.`)] });
        break;
      }

      case 'botlara': {
        const role = interaction.options.getRole('rol');
        const members = await interaction.guild.members.fetch();
        const bots = members.filter(m => m.user.bot);
        let count = 0;

        for (const [, bot] of bots) {
          try { await bot.roles.add(role); count++; } catch {}
        }

        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Bot Rolü Verildi').setDescription(`${role} → **${count}** bota verildi.`)] });
        break;
      }

      case 'bilgi': {
        const role = interaction.options.getRole('rol');
        const embed = baseEmbed(role.color || COLORS.CYBER_BLUE)
          .setTitle(`🏷️ ${role.name} — Rol Bilgisi`)
          .addFields(
            { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
            { name: '🎨 Renk', value: `\`#${role.color.toString(16).padStart(6, '0')}\``, inline: true },
            { name: '📊 Pozisyon', value: `\`${role.position}\``, inline: true },
            { name: '👥 Üye', value: `\`${role.members.size}\``, inline: true },
            { name: '📅 Oluşturulma', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👁️ Görünür', value: role.hoist ? '✅' : '❌', inline: true },
            { name: '🔔 Etiketlenebilir', value: role.mentionable ? '✅' : '❌', inline: true },
            { name: '🤖 Bot Rolü', value: role.managed ? '✅' : '❌', inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'uyeler': {
        const role = interaction.options.getRole('rol');
        const members = role.members.map(m => `${m}`).join(', ');
        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle(`👥 ${role.name} Üyeleri (${role.members.size})`)
          .setDescription(members.substring(0, 4000) || '*Üye yok*');
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'olustur': {
        const name = interaction.options.getString('isim');
        const colorStr = interaction.options.getString('renk');
        const hoist = interaction.options.getBoolean('görünür') ?? false;

        let color;
        if (colorStr) { try { color = parseInt(colorStr.replace('#', ''), 16); } catch {} }

        const newRole = await interaction.guild.roles.create({ name, color, hoist, reason: `Oluşturan: ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Rol Oluşturuldu').setDescription(`${newRole} başarıyla oluşturuldu.`)] });
        break;
      }

      case 'sil': {
        const role = interaction.options.getRole('rol');
        const roleName = role.name;
        await role.delete(`Silen: ${interaction.user.tag}`);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('🗑️ Rol Silindi').setDescription(`**${roleName}** silindi.`)] });
        break;
      }

      case 'renk': {
        const role = interaction.options.getRole('rol');
        const colorStr = interaction.options.getString('renk');
        let color;
        try { color = parseInt(colorStr.replace('#', ''), 16); } catch { return interaction.editReply({ content: '❌ Geçersiz renk kodu.' }); }

        await role.setColor(color);
        await interaction.editReply({ embeds: [baseEmbed(color).setTitle('🎨 Rol Rengi Değiştirildi').setDescription(`${role} → \`${colorStr}\``)] });
        break;
      }

      case 'yeniden-adlandir': {
        const role = interaction.options.getRole('rol');
        const newName = interaction.options.getString('isim');
        const oldName = role.name;
        await role.setName(newName);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Rol Yeniden Adlandırıldı').setDescription(`**${oldName}** → **${newName}**`)] });
        break;
      }
    }
  },
};
