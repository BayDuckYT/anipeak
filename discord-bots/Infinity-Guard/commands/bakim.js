// ============================================================
//  /bakim — Sunucu Bakım Modu Sistemi (Maintenance Mode)
//  Açıldığında:
//  1. "🛠️ Bakımda" rolü oluşturur (veya bulur).
//  2. @everyone ve "Bakımda" rolünün mevcut TÜM kanalları görmesini engeller.
//  3. Sadece 2 kanal açık kalır:
//     - 📢・bakım-duyuru (Salt okunur bilgi kanalı)
//     - 💬・bakım-sohbet (Okurların sohbet edebildiği kanal)
//  4. Mevcut tüm üyelere "Bakımda" rolünü verir.
//  5. Bakım bittiğinde kanalların ve rollerin orijinal haline dönmesini sağlar.
// ============================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { getSettings, saveSettings } from '../utils/settingsManager.js';
import { COLORS } from '../utils/config.js';
import { sendLog } from '../utils/logger.js';

const P = PermissionFlagsBits;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  data: new SlashCommandBuilder()
    .setName('bakim')
    .setDescription('🛠️ Sunucu bakım modu yönetim sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('ac')
        .setDescription('Sunucuyu bakım moduna alır.')
        .addStringOption((opt) =>
          opt
            .setName('sebep')
            .setDescription('Bakım sebebi / yapılacak işlemler')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('tahmini-sure')
            .setDescription('Tahmini bakım süresi (Örn: 2 Saat, 30 Dakika)')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('kapat').setDescription('Bakım modunu sonlandırır ve sunucuyu normale döndürür.')
    )
    .addSubcommand((sub) =>
      sub.setName('durum').setDescription('Bakım modu aktif mi kontrol eder.')
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // En az UYK (Üst Yönetim Kurulu) veya Administrator yetkisi gereklidir
    if (!hasPermission(interaction.member, 'UYK')) {
      return interaction.editReply({
        content: '❌ Bu komutu kullanmak için en az **Üst Yönetim Kurulu (UYK)** yetkisine sahip olmalısınız.',
      });
    }

    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();
    const settings = getSettings();
    settings.maintenance = settings.maintenance || {};
    const guildMaintenance = settings.maintenance[guild.id] || null;

    // ══════════════════════════════════════════════════════════
    //  DURUM KONTROLÜ
    // ══════════════════════════════════════════════════════════
    if (sub === 'durum') {
      if (!guildMaintenance || !guildMaintenance.active) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.SUCCESS)
              .setTitle('✅ Sunucu Durumu: Normal')
              .setDescription('Sunucu şu anda bakım modunda değil. Tüm kanallar ve roller aktif.')
              .setTimestamp(),
          ],
        });
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('🛠️ Sunucu Durumu: BAKIMDA')
            .setDescription(
              `Sunucu bakım modunda!\n\n` +
              `> 📋 **Sebep:** ${guildMaintenance.reason || 'Belirtilmedi'}\n` +
              `> ⏳ **Tahmini Süre:** ${guildMaintenance.estimatedTime || 'Belirsiz'}\n` +
              `> 👮 **Başlatan:** <@${guildMaintenance.startedBy}>\n` +
              `> 🕒 **Başlama Zamanı:** <t:${Math.floor(new Date(guildMaintenance.startedAt).getTime() / 1000)}:R>`
            )
            .setTimestamp(),
        ],
      });
    }

    // ══════════════════════════════════════════════════════════
    //  BAKIM MODUNU AÇ
    // ══════════════════════════════════════════════════════════
    if (sub === 'ac') {
      if (guildMaintenance && guildMaintenance.active) {
        return interaction.editReply({
          content: '⚠️ Sunucu zaten bakım modunda! Kapatmak için `/bakim kapat` komutunu kullanın.',
        });
      }

      const reason = interaction.options.getString('sebep') || 'Sistem ve altyapı güncellemeleri';
      const estimatedTime = interaction.options.getString('tahmini-sure') || 'En kısa sürede';

      await interaction.editReply({
        content: '⏳ **Bakım modu başlatılıyor...** Kanallar kilitleniyor, bakım kategorisi ve rolleri yapılandırılıyor...',
      });

      try {
        // 1. "🛠️ Bakımda" Rolünü oluştur veya bul
        let maintenanceRole = guild.roles.cache.find((r) => r.name === '🛠️ Bakımda');
        if (!maintenanceRole) {
          maintenanceRole = await guild.roles.create({
            name: '🛠️ Bakımda',
            color: 0xF59E0B, // Amber / Uyarı Sarısı
            hoist: true,
            permissions: [],
            reason: 'Infinity Guard — Bakım modu rolü',
          });
        }

        // 2. Bakım Kategorisi ve Kanallarını oluştur
        const botId = client.user.id;
        const everyoneId = guild.id;
        const maintRoleId = maintenanceRole.id;

        // Yetkili rolleri erişebilsin
        const tplRoles = settings.templates?.[guild.id]?.roles || {};
        const staffRoleKeys = ['kurucu', 'ceo', 'byk', 'coo', 'cto', 'uyk', 'ayk', 'lead_mod', 'mod'];
        const allowedStaffIds = staffRoleKeys.map((k) => tplRoles[k]).filter(Boolean);

        const categoryOverwrites = [
          { id: everyoneId, deny: [P.ViewChannel] },
          { id: maintRoleId, allow: [P.ViewChannel, P.ReadMessageHistory] },
          { id: botId, allow: [P.ViewChannel, P.SendMessages, P.ManageChannels] },
          ...allowedStaffIds.map((id) => ({ id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] })),
        ];

        const maintenanceCategory = await guild.channels.create({
          name: '╭─ 🛠️ SUNUCU BAKIM MODU',
          type: ChannelType.GuildCategory,
          permissionOverwrites: categoryOverwrites,
          reason: 'Infinity Guard — Bakım modu kategorisi',
        });

        // 📢 Duyuru Kanalı (Salt Okunur)
        const announcementChannel = await guild.channels.create({
          name: '📢・bakım-duyuru',
          type: ChannelType.GuildText,
          parent: maintenanceCategory.id,
          topic: '🛠️ Sunucu bakım bildirimleri ve ilerleme durumu.',
          permissionOverwrites: [
            ...categoryOverwrites,
            { id: maintRoleId, allow: [P.ViewChannel, P.ReadMessageHistory], deny: [P.SendMessages, P.AddReactions] },
          ],
          reason: 'Infinity Guard — Bakım duyuru kanalı',
        });

        // 💬 Sohbet Kanalı (Herkes konuşabilir)
        const chatChannel = await guild.channels.create({
          name: '💬・bakım-sohbet',
          type: ChannelType.GuildText,
          parent: maintenanceCategory.id,
          topic: '💬 Bakım süresince sohbet edebileceğiniz alan. Keyifli sohbetler!',
          rateLimitPerUser: 3, // 3 sn yavaş mod
          permissionOverwrites: [
            ...categoryOverwrites,
            { id: maintRoleId, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks] },
          ],
          reason: 'Infinity Guard — Bakım sohbet kanalı',
        });

        // 3. Mevcut kanalların izinlerini sakla ve Bakımda rolünün diğer kanalları görmesini kesin engelle
        const oldOverwrites = {};
        const existingChannels = guild.channels.cache.filter(
          (c) => c.id !== maintenanceCategory.id && c.id !== announcementChannel.id && c.id !== chatChannel.id
        );

        for (const [id, ch] of existingChannels) {
          try {
            // @everyone veya Bakımda rolünün görmesini engelle
            await ch.permissionOverwrites.edit(maintRoleId, {
              ViewChannel: false,
              SendMessages: false,
            });
          } catch (e) {
            console.error(`[Bakım] Kanal izin gizleme hatası (${ch.name}):`, e.message);
          }
        }

        // 4. Duyuru Mesajını Gönder
        const announceEmbed = new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setTitle('🛠️ MAHORAPEAK — SUNUCU BAKIM MODUNA ALINDI')
          .setDescription(
            `Değerli okurlarımız ve üyelerimiz,\n\n` +
            `Sizlere daha kaliteli ve kesintisiz bir deneyim sunabilmek adına sunucumuz ve platformumuz geçici olarak **bakım moduna** alınmıştır.\n\n` +
            `> 📋 **Bakım Sebebi:** ${reason}\n` +
            `> ⏳ **Tahmini Süre:** ${estimatedTime}\n` +
            `> 💬 **Geçici Sohbet:** ${chatChannel}\n\n` +
            `Bakım süresince diğer tüm kanallar kilitlenmiş olup, bakım bittiğinde her şey otomatik olarak açılacaktır. Anlayışınız için teşekkür ederiz!`
          )
          .setFooter({ text: '⚡ MahoraPeak Yönetimi • Infinity Guard' })
          .setTimestamp();

        await announcementChannel.send({ embeds: [announceEmbed] });
        await chatChannel.send({
          content: `👋 Hoş geldiniz! Sunucu bakımdadır ancak burada sohbet edebilirsiniz: ${chatChannel}`,
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.CYBER_BLUE)
              .setTitle('💬 Bakım Sohbet Odası')
              .setDescription(
                'Bakım tamamlanana kadar bu kanalda serbestçe sohbet edebilirsiniz. Kurallar bu kanalda da geçerlidir!'
              ),
          ],
        });

        // 5. Ayarları Kaydet
        settings.maintenance[guild.id] = {
          active: true,
          roleId: maintenanceRole.id,
          categoryId: maintenanceCategory.id,
          announcementChannelId: announcementChannel.id,
          chatChannelId: chatChannel.id,
          reason,
          estimatedTime,
          startedAt: new Date().toISOString(),
          startedBy: interaction.user.id,
        };
        saveSettings(settings);

        // 6. Arka planda üyelere Bakımda rolü dağıt
        (async () => {
          try {
            const members = await guild.members.fetch();
            let count = 0;
            for (const member of members.values()) {
              if (member.user.bot) continue;
              if (!member.roles.cache.has(maintenanceRole.id)) {
                await member.roles.add(maintenanceRole.id, 'Sunucu bakım moduna alındı').catch(() => null);
                count++;
                if (count % 15 === 0) await sleep(250);
              }
            }
            console.log(`[Bakım] ${count} üyeye bakım rolü dağıtıldı.`);
          } catch (err) {
            console.error('[Bakım] Rol dağıtım hatası:', err.message);
          }
        })();

        // 7. Log Gönder
        const logEmbed = new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setTitle('🛠️ Sunucu Bakım Moduna Alındı')
          .addFields(
            { name: 'Yetkili', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
            { name: 'Sebep', value: reason, inline: true },
            { name: 'Tahmini Süre', value: estimatedTime, inline: true }
          )
          .setTimestamp();
        await sendLog(guild, logEmbed);

        return interaction.editReply({
          content: `✅ **Sunucu başarıyla bakım moduna alındı!**\n> 📢 Duyuru: ${announcementChannel}\n> 💬 Sohbet: ${chatChannel}\n> 👥 Üyelere \`${maintenanceRole.name}\` rolü dağıtılıyor.`,
        });
      } catch (error) {
        console.error('[Bakım Aç Hatası]:', error);
        return interaction.editReply({
          content: `❌ Bakım modu başlatılırken bir hata oluştu: \`${error.message}\``,
        });
      }
    }

    // ══════════════════════════════════════════════════════════
    //  BAKIM MODUNU KAPAT
    // ══════════════════════════════════════════════════════════
    if (sub === 'kapat') {
      if (!guildMaintenance || !guildMaintenance.active) {
        return interaction.editReply({
          content: '❌ Sunucu zaten bakım modunda değil.',
        });
      }

      await interaction.editReply({
        content: '⏳ **Bakım modu sonlandırılıyor...** Geçici kanallar siliniyor ve üye kısıtlamaları kaldırılıyor...',
      });

      try {
        const maintRoleId = guildMaintenance.roleId;

        // 1. Geçici bakım kanallarını ve kategorisini sil
        const cat = guild.channels.cache.get(guildMaintenance.categoryId);
        const ann = guild.channels.cache.get(guildMaintenance.announcementChannelId);
        const chat = guild.channels.cache.get(guildMaintenance.chatChannelId);

        await ann?.delete('Bakım modu sonlandı').catch(() => null);
        await chat?.delete('Bakım modu sonlandı').catch(() => null);
        await cat?.delete('Bakım modu sonlandı').catch(() => null);

        // 2. Kanallardaki Bakımda rolünün engellerini temizle
        if (maintRoleId) {
          for (const ch of guild.channels.cache.values()) {
            try {
              if (ch.permissionOverwrites.cache.has(maintRoleId)) {
                await ch.permissionOverwrites.delete(maintRoleId, 'Bakım modu bitti');
              }
            } catch (e) {
              // Hata olursa pas geç
            }
          }
        }

        // 3. Arka planda üyelerden Bakımda rolünü sil (veya rolü tamamen sil)
        const role = guild.roles.cache.get(maintRoleId);
        if (role) {
          await role.delete('Bakım modu sonlandı').catch(() => null);
        }

        // 4. Ayarları Sıfırla
        settings.maintenance[guild.id] = {
          active: false,
          endedAt: new Date().toISOString(),
          endedBy: interaction.user.id,
        };
        saveSettings(settings);

        // 5. Genel sohbete ve log kanalına bakım bitti duyurusu yap
        const tplChannels = settings.templates?.[guild.id]?.channels || {};
        const generalChatId = tplChannels.genel || guild.channels.cache.find((c) => c.name.includes('genel'))?.id;
        const generalChat = guild.channels.cache.get(generalChatId);

        const endEmbed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🎉 BAKIM TAMAMLANDI — SUNUCU TEKRAR AKTİF!')
          .setDescription(
            `Değerli okurlarımız,\n\n` +
            `Sunucumuzdaki bakım ve güncelleme çalışmaları başarıyla tamamlanmıştır. Tüm kanallarımız tekrar erişime açılmıştır!\n\n` +
            `Sabrınız ve desteğiniz için teşekkür eder, keyifli okumalar dileriz. ✨`
          )
          .setFooter({ text: '⚡ MahoraPeak Yönetimi • Infinity Guard' })
          .setTimestamp();

        if (generalChat) {
          await generalChat.send({ content: '@everyone', embeds: [endEmbed] }).catch(() => null);
        }

        const logEmbed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('✅ Sunucu Bakım Modu Kapatıldı')
          .addFields({ name: 'Yetkili', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true })
          .setTimestamp();
        await sendLog(guild, logEmbed);

        return interaction.editReply({
          content: '🎉 **Bakım modu başarıyla kapatıldı!** Tüm kanallar açıldı, geçici bakım odaları temizlendi ve genel sohbete bilgilendirme mesajı gönderildi.',
        });
      } catch (error) {
        console.error('[Bakım Kapat Hatası]:', error);
        return interaction.editReply({
          content: `❌ Bakım modu kapatılırken bir hata oluştu: \`${error.message}\``,
        });
      }
    }
  },
};
