// ============================================================
//  /sıralama — Gelişmiş Sıralama Tabloları
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, GOLD: 0xFFD700, PURPLE: 0x8A2BE2 };

export default {
  data: new SlashCommandBuilder()
    .setName('sıralama')
    .setDescription('🏆 Sıralama tablosu komutları')
    .addSubcommand(sub =>
      sub.setName('genel')
        .setDescription('Genel sıralama tablosunu gösterir.')
        .addIntegerOption(opt => opt.setName('sayfa').setDescription('Sayfa numarası').setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('seviye')
        .setDescription('Seviye bazlı sıralamayı gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('xp')
        .setDescription('XP bazlı sıralamayı gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('ben')
        .setDescription('Sıralamadaki konumunuzu gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    switch (sub) {
      case 'genel':
      case 'seviye':
      case 'xp': {
        const page = interaction.options.getInteger('sayfa') || 1;
        const perPage = 15;
        const offset = (page - 1) * perPage;

        const orderBy = sub === 'xp' ? 'xp' : 'level';
        const { data, count } = await supabase
          .from('profiles')
          .select('username, level, xp, avatar_url', { count: 'exact' })
          .order(orderBy, { ascending: false })
          .range(offset, offset + perPage - 1);

        if (!data?.length) return interaction.editReply({ content: '❌ Veri bulunamadı.' });

        const totalPages = Math.ceil((count || 0) / perPage);
        const medals = ['🥇', '🥈', '🥉'];

        const list = data.map((p, i) => {
          const rank = offset + i;
          const prefix = rank < 3 ? medals[rank] : `**${rank + 1}.**`;
          return `${prefix} **${p.username || 'Anonim'}** — Seviye \`${p.level || 1}\` • XP \`${(p.xp || 0).toLocaleString()}\``;
        }).join('\n');

        const titles = { genel: '🏆 GENEL SIRALAMA', seviye: '📊 SEVİYE SIRALAMASI', xp: '✨ XP SIRALAMASI' };
        const embed = new EmbedBuilder()
          .setTitle(titles[sub])
          .setDescription(list)
          .setColor(COLORS.GOLD)
          .setFooter({ text: `Sayfa ${page}/${totalPages} • Toplam ${count || 0} üye` })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'ben': {
        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', interaction.user.id).single();
        if (!link) return interaction.editReply({ content: '❌ Hesabın bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('username, level, xp').eq('id', link.profile_id).single();
        if (!profile) return interaction.editReply({ content: '❌ Profil bulunamadı.' });

        // Sıra hesapla
        const { count: higherLevel } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('level', profile.level || 0);
        const rank = (higherLevel || 0) + 1;

        const embed = new EmbedBuilder()
          .setTitle('📍 SIRALAMADAKİ KONUMUN')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🏆 Sıra', value: `**#${rank}**`, inline: true },
            { name: '📊 Seviye', value: `\`${profile.level || 1}\``, inline: true },
            { name: '✨ XP', value: `\`${(profile.xp || 0).toLocaleString()}\``, inline: true },
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: `${profile.username} • MahoraPeak Sıralama` });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
