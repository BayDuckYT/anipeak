// ============================================================
//  /ticket — Gelişmiş Ticket Yönetim Komutları
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, PURPLE: 0x8A2BE2, YELLOW: 0xFFAA00 };

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Ticket yönetim komutları')
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Ticket\'a kullanıcı ekler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Eklenecek kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('cikar')
        .setDescription('Ticket\'tan kullanıcı çıkarır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Çıkarılacak kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yeniden-adlandir')
        .setDescription('Ticket kanalının adını değiştirir.')
        .addStringOption(opt => opt.setName('isim').setDescription('Yeni kanal adı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kapat')
        .setDescription('Bu ticket\'ı kapatır.')
        .addStringOption(opt => opt.setName('sebep').setDescription('Kapatma sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('sahiplen')
        .setDescription('Bu ticket\'ı sahiplenir.')
    )
    .addSubcommand(sub =>
      sub.setName('devret')
        .setDescription('Bu ticket\'ı başka bir yetkiye devreder.')
        .addUserOption(opt => opt.setName('yetkili').setDescription('Devredilecek yetkili').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('oncelik')
        .setDescription('Ticket\'ın öncelik seviyesini ayarlar.')
        .addStringOption(opt => opt.setName('seviye').setDescription('Öncelik seviyesi').setRequired(true)
          .addChoices(
            { name: '🟢 Düşük', value: 'dusuk' },
            { name: '🟡 Normal', value: 'normal' },
            { name: '🟠 Yüksek', value: 'yuksek' },
            { name: '🔴 Acil', value: 'acil' },
          ))
    )
    .addSubcommand(sub =>
      sub.setName('transcript')
        .setDescription('Ticket konuşma kaydını oluşturur.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Ticket kanalı kontrolü
    if (!interaction.channel.name.startsWith('ticket-') && !interaction.channel.name.startsWith('destek-')) {
      return interaction.editReply({ content: '❌ Bu komut sadece ticket kanallarında kullanılabilir.' });
    }

    switch (sub) {
      case 'ekle': {
        const user = interaction.options.getUser('kullanıcı');
        await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Kullanıcı Eklendi').setDescription(`${user} bu ticket'a eklendi.`).setColor(COLORS.GREEN)] });
        await interaction.channel.send({ content: `📥 ${user} ticket'a eklendi — ${interaction.user} tarafından.` });
        break;
      }

      case 'cikar': {
        const user = interaction.options.getUser('kullanıcı');
        await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false, SendMessages: false });
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Kullanıcı Çıkarıldı').setDescription(`${user} ticket'tan çıkarıldı.`).setColor(COLORS.RED)] });
        break;
      }

      case 'yeniden-adlandir': {
        const newName = interaction.options.getString('isim');
        const oldName = interaction.channel.name;
        await interaction.channel.setName(newName);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Kanal Adı Değiştirildi').setDescription(`**${oldName}** → **${newName}**`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'kapat': {
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        const embed = new EmbedBuilder()
          .setTitle('🔒 TİCKET KAPANDI')
          .setDescription(`**Sebep:** ${reason}\n**Kapatan:** ${interaction.user}\n\nBu kanal 10 saniye sonra silinecek.`)
          .setColor(COLORS.RED)
          .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Ticket kapatılıyor...' });

        setTimeout(async () => {
          try { await interaction.channel.delete(`Ticket kapatıldı: ${reason}`); } catch {}
        }, 10000);
        break;
      }

      case 'sahiplen': {
        const embed = new EmbedBuilder()
          .setTitle('🙋 TİCKET SAHİPLENİLDİ')
          .setDescription(`${interaction.user} bu ticket'ı sahiplendi.`)
          .setColor(COLORS.PURPLE)
          .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Ticket sahiplenildi.' });

        // Kanal adını güncelle
        try {
          const newName = `claimed-${interaction.channel.name.replace('ticket-', '')}`;
          await interaction.channel.setName(newName);
        } catch {}
        break;
      }

      case 'devret': {
        const target = interaction.options.getUser('yetkili');
        await interaction.channel.permissionOverwrites.edit(target.id, { ViewChannel: true, SendMessages: true, ManageMessages: true });

        const embed = new EmbedBuilder()
          .setTitle('🔄 TİCKET DEVREDİLDİ')
          .setDescription(`${interaction.user} → ${target}`)
          .setColor(COLORS.YELLOW)
          .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: `✅ Ticket ${target} kullanıcısına devredildi.` });
        break;
      }

      case 'oncelik': {
        const level = interaction.options.getString('seviye');
        const priorities = {
          dusuk: { emoji: '🟢', label: 'Düşük', color: COLORS.GREEN },
          normal: { emoji: '🟡', label: 'Normal', color: COLORS.YELLOW },
          yuksek: { emoji: '🟠', label: 'Yüksek', color: 0xFF8C00 },
          acil: { emoji: '🔴', label: 'ACİL', color: COLORS.RED },
        };
        const p = priorities[level];

        const embed = new EmbedBuilder()
          .setTitle(`${p.emoji} ÖNCELİK: ${p.label}`)
          .setDescription(`Ticket önceliği **${p.label}** olarak ayarlandı.`)
          .setColor(p.color);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: `✅ Öncelik ayarlandı: ${p.label}` });

        // Kanal adını güncelle
        try {
          const baseName = interaction.channel.name.replace(/^(acil|yuksek|normal|dusuk)-/, '');
          await interaction.channel.setName(`${level}-${baseName}`);
        } catch {}
        break;
      }

      case 'transcript': {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let transcript = `# Ticket Transcript — ${interaction.channel.name}\n`;
        transcript += `Tarih: ${new Date().toLocaleString('tr-TR')}\n\n`;

        sorted.forEach(msg => {
          const time = new Date(msg.createdTimestamp).toLocaleTimeString('tr-TR');
          transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[Embed/Dosya]'}\n`;
        });

        // Transcript dosyası olarak gönder
        const buffer = Buffer.from(transcript, 'utf-8');
        await interaction.editReply({
          content: '✅ Transcript oluşturuldu!',
          files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
        });
        break;
      }
    }
  },
};
