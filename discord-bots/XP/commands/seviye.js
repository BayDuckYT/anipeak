// ============================================================
//  /seviye — Gelişmiş Seviye Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, PURPLE: 0x8A2BE2, GOLD: 0xFFD700 };

export default {
  data: new SlashCommandBuilder()
    .setName('seviye')
    .setDescription('⚡ Seviye yönetim komutları')
    .addSubcommand(sub =>
      sub.setName('goster')
        .setDescription('Kullanıcının seviyesini gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kontrol edilecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Kullanıcının seviyesini ayarlar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('seviye').setDescription('Yeni seviye').setRequired(true).setMinValue(0).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Kullanıcının seviyesine ekleme yapar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Eklenecek seviye').setRequired(true).setMinValue(1).setMaxValue(50))
    )
    .addSubcommand(sub =>
      sub.setName('sifirla')
        .setDescription('Kullanıcının seviyesini sıfırlar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('xp-ekle')
        .setDescription('Kullanıcıya XP ekler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('XP miktarı').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('xp-cikar')
        .setDescription('Kullanıcıdan XP çıkarır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('XP miktarı').setRequired(true).setMinValue(1))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    switch (sub) {
      case 'goster': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const { data: profile } = await supabase.from('profiles').select('*').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Profil bulunamadı veya hesap bağlı değil.' });

        const level = profile.level || 1;
        const xp = profile.xp || 0;
        const nextLevelXP = calculateXPForLevel(level + 1);
        const progress = Math.round((xp / nextLevelXP) * 100);
        const progressBar = createProgressBar(progress);

        const embed = new EmbedBuilder()
          .setTitle(`⚡ ${user.tag} — Seviye ${level}`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: '📊 Seviye', value: `\`${level}\``, inline: true },
            { name: '✨ XP', value: `\`${xp.toLocaleString()}\``, inline: true },
            { name: '📈 Sonraki Seviye', value: `\`${nextLevelXP.toLocaleString()}\` XP`, inline: true },
            { name: '📊 İlerleme', value: `${progressBar} \`${progress}%\`` },
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'MahoraPeak Seviye Sistemi' })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'set': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({ content: '❌ Admin yetkisi gerekli.' });
        }
        const user = interaction.options.getUser('kullanıcı');
        const level = interaction.options.getInteger('seviye');
        const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        await supabase.from('profiles').update({ level, xp: calculateXPForLevel(level) }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Seviye Ayarlandı').setDescription(`${user.tag} → Seviye **${level}**`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'ekle': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Yetki yok.' });
        const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');
        const { data: profile } = await supabase.from('profiles').select('id, level').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const newLevel = Math.min((profile?.level || 1) + amount, 100);
        await supabase.from('profiles').update({ level: newLevel }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Seviye Eklendi').setDescription(`${user.tag}: +${amount} → Seviye **${newLevel}**`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'sifirla': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Yetki yok.' });
        const user = interaction.options.getUser('kullanıcı');
        const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        await supabase.from('profiles').update({ level: 1, xp: 0 }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🔄 Seviye Sıfırlandı').setDescription(`${user.tag} → Seviye **1** (XP: 0)`).setColor(COLORS.RED)] });
        break;
      }

      case 'xp-ekle': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Yetki yok.' });
        const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');
        const { data: profile } = await supabase.from('profiles').select('id, xp').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const newXP = (profile?.xp || 0) + amount;
        await supabase.from('profiles').update({ xp: newXP }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ XP Eklendi').setDescription(`${user.tag}: +\`${amount}\` XP → Toplam \`${newXP}\``).setColor(COLORS.GOLD)] });
        break;
      }

      case 'xp-cikar': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Yetki yok.' });
        const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');
        const { data: profile } = await supabase.from('profiles').select('id, xp').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const newXP = Math.max((profile?.xp || 0) - amount, 0);
        await supabase.from('profiles').update({ xp: newXP }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('⬇️ XP Çıkarıldı').setDescription(`${user.tag}: -\`${amount}\` XP → Toplam \`${newXP}\``).setColor(COLORS.RED)] });
        break;
      }
    }
  },
};

function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function createProgressBar(percent) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
