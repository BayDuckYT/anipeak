// ============================================================
//  /faq — SSS (Sık Sorulan Sorular) Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C };

// In-memory FAQ storage
const faqDB = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('❓ SSS yönetim komutları')
    .addSubcommand(sub =>
      sub.setName('goster')
        .setDescription('Bir SSS sorusunu gösterir.')
        .addStringOption(opt => opt.setName('anahtar').setDescription('SSS anahtar kelimesi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Yeni SSS girişi ekler.')
        .addStringOption(opt => opt.setName('anahtar').setDescription('Anahtar kelime').setRequired(true))
        .addStringOption(opt => opt.setName('soru').setDescription('Soru').setRequired(true))
        .addStringOption(opt => opt.setName('cevap').setDescription('Cevap').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sil')
        .setDescription('SSS girişi siler.')
        .addStringOption(opt => opt.setName('anahtar').setDescription('Silinecek SSS').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Tüm SSS kayıtlarını listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('ara')
        .setDescription('SSS\'ler arasında arar.')
        .addStringOption(opt => opt.setName('kelime').setDescription('Aranacak kelime').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    
    if (!faqDB.has(guildId)) {
      // Varsayılan SSS'ler
      faqDB.set(guildId, new Map([
        ['kayit', { soru: 'Nasıl kayıt olurum?', cevap: 'Siteye girip **Kayıt Ol** butonuna tıklayın. E-posta ve şifre ile kayıt olabilirsiniz.' }],
        ['discord', { soru: 'Discord hesabımı nasıl bağlarım?', cevap: 'Siteye giriş yapın → Profilim → Discord Bağla butonuna tıklayın → Oluşan kodu `/bağla` komutu ile Discord\'da girin.' }],
        ['manga', { soru: 'Manga nasıl okurum?', cevap: 'mahorapeak.com.tr adresine gidin, istediğiniz mangayı seçin ve bölüm seçerek okumaya başlayın!' }],
        ['hata', { soru: 'Bir hata buldum, ne yapmalıyım?', cevap: 'Destek ticket\'ı açarak veya `/report` komutu ile hata bildiriminde bulunabilirsiniz.' }],
        ['xp', { soru: 'XP nasıl kazanırım?', cevap: 'Manga okuyarak, yorum yaparak ve Discord\'da aktif olarak XP kazanabilirsiniz!' }],
      ]));
    }

    const faqs = faqDB.get(guildId);

    switch (sub) {
      case 'goster': {
        const key = interaction.options.getString('anahtar').toLowerCase();
        const faq = faqs.get(key);
        if (!faq) return interaction.reply({ content: `❌ "${key}" bulunamadı. Tüm SSS'leri görmek için \`/faq liste\` yazın.`, flags: [MessageFlags.Ephemeral] });

        const embed = new EmbedBuilder()
          .setTitle(`❓ ${faq.soru}`)
          .setDescription(faq.cevap)
          .setColor(COLORS.BLUE)
          .setFooter({ text: `MahoraPeak SSS | Anahtar: ${key}` });
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'ekle': {
        if (!hasPermission(interaction.member, 'MOD')) { return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', flags: [MessageFlags.Ephemeral] }); }
        const key = interaction.options.getString('anahtar').toLowerCase();
        const soru = interaction.options.getString('soru');
        const cevap = interaction.options.getString('cevap');

        faqs.set(key, { soru, cevap });
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle('✅ SSS Eklendi').setDescription(`**Anahtar:** \`${key}\`\n**Soru:** ${soru}`).setColor(COLORS.GREEN)], flags: [MessageFlags.Ephemeral] });
        break;
      }

      case 'sil': {
        if (!hasPermission(interaction.member, 'MOD')) { return interaction.reply({ content: '❌ Yetkiniz yok.', flags: [MessageFlags.Ephemeral] }); }
        const key = interaction.options.getString('anahtar').toLowerCase();
        if (faqs.delete(key)) {
          await interaction.reply({ content: `✅ "${key}" SSS'i silindi.`, flags: [MessageFlags.Ephemeral] });
        } else {
          await interaction.reply({ content: `❌ "${key}" bulunamadı.`, flags: [MessageFlags.Ephemeral] });
        }
        break;
      }

      case 'liste': {
        if (faqs.size === 0) return interaction.reply({ content: '❌ Kayıtlı SSS yok.', flags: [MessageFlags.Ephemeral] });

        const list = [...faqs.entries()].map(([key, faq]) => `• \`${key}\` — ${faq.soru}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`❓ SSS LİSTESİ (${faqs.size})`)
          .setDescription(list + '\n\n*Detay görmek için `/faq goster anahtar:<isim>` yazın.*')
          .setColor(COLORS.BLUE);
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        break;
      }

      case 'ara': {
        const keyword = interaction.options.getString('kelime').toLowerCase();
        const results = [...faqs.entries()].filter(([key, faq]) =>
          key.includes(keyword) || faq.soru.toLowerCase().includes(keyword) || faq.cevap.toLowerCase().includes(keyword)
        );

        if (results.length === 0) return interaction.reply({ content: `❌ "${keyword}" ile ilgili SSS bulunamadı.`, flags: [MessageFlags.Ephemeral] });

        const list = results.map(([key, faq]) => `• \`${key}\` — ${faq.soru}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`🔍 SSS Arama: "${keyword}" (${results.length} sonuç)`)
          .setDescription(list)
          .setColor(COLORS.BLUE);
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        break;
      }
    }
  },
};
