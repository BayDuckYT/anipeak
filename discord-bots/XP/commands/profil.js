// ============================================================
//  /profil — Profil Özelleştirme Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, PURPLE: 0x8A2BE2, GOLD: 0xFFD700 };

export default {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('🎨 Profil komutları')
    .addSubcommand(sub =>
      sub.setName('goster')
        .setDescription('Profilinizi veya başka birinin profilini gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Profili görülecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('bio')
        .setDescription('Profil biyografinizi ayarlar.')
        .addStringOption(opt => opt.setName('metin').setDescription('Biyografi metni (max 200 karakter)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('rozet')
        .setDescription('Rozetlerinizi gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Rozetleri görülecek kullanıcı'))
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

        const nextLevelXP = Math.floor(100 * Math.pow((profile.level || 1) + 1, 1.5));
        const progress = Math.round(((profile.xp || 0) / nextLevelXP) * 100);
        const bar = '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));

        const embed = new EmbedBuilder()
          .setTitle(`🎴 ${profile.username || user.tag}`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setDescription(profile.bio || '*Henüz biyografi ayarlanmamış.*')
          .addFields(
            { name: '📊 Seviye', value: `\`${profile.level || 1}\``, inline: true },
            { name: '✨ XP', value: `\`${(profile.xp || 0).toLocaleString()}\``, inline: true },
            { name: '🌟 Aura', value: `${(profile.aura || 0).toLocaleString()}`, inline: true },
            { name: '📚 Okunan Bölüm', value: `\`${profile.chapters_read || 0}\``, inline: true },
            { name: '📈 İlerleme', value: `${bar} \`${progress}%\`` },
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'MahoraPeak Profil Kartı' })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'bio': {
        const bioText = interaction.options.getString('metin').substring(0, 200);
        const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', interaction.user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesabın bağlı değil.' });

        await supabase.from('profiles').update({ bio: bioText }).eq('id', profile.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Biyografi Güncellendi').setDescription(`\`${bioText}\``).setColor(COLORS.GREEN)] });
        break;
      }

      case 'rozet': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const { data: profile } = await supabase.from('profiles').select('level, xp, chapters_read, created_at').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Profil bulunamadı veya hesap bağlı değil.' });

        // Dinamik rozet hesaplama
        const badges = [];
        if (profile.level >= 50) badges.push('🌟 Efsane Okuyucu');
        else if (profile.level >= 25) badges.push('⭐ Deneyimli Okuyucu');
        else if (profile.level >= 10) badges.push('✨ Aktif Okuyucu');
        else badges.push('🌱 Yeni Okuyucu');

        if ((profile.chapters_read || 0) >= 500) badges.push('📚 Kitap Kurdu');
        if ((profile.chapters_read || 0) >= 100) badges.push('📖 Bölüm Avcısı');
        if ((profile.xp || 0) >= 50000) badges.push('💎 Elmas Üye');
        if ((profile.xp || 0) >= 10000) badges.push('🏅 Altın Üye');

        const daysSinceJoin = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
        if (daysSinceJoin >= 365) badges.push('🎂 Yıldönümü');
        if (daysSinceJoin >= 30) badges.push('📅 Eski Üye');

        const embed = new EmbedBuilder()
          .setTitle(`🏆 ${user.tag} — Rozetler (${badges.length})`)
          .setDescription(badges.join('\n') || '*Henüz rozet yok.*')
          .setColor(COLORS.GOLD);
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
