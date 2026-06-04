// ============================================================
//  /site — Site Durum & İstatistik Komutları
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C };

export default {
  data: new SlashCommandBuilder()
    .setName('site')
    .setDescription('🌐 MahoraPeak site komutları')
    .addSubcommand(sub =>
      sub.setName('durum')
        .setDescription('Site durumunu kontrol eder.')
    )
    .addSubcommand(sub =>
      sub.setName('istatistik')
        .setDescription('Site istatistiklerini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('en-cok-okunan')
        .setDescription('En çok okunan mangaları gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('son-yorumlar')
        .setDescription('Son yapılan yorumları gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;

    switch (sub) {
      case 'durum': {
        const start = Date.now();
        let siteStatus = '✅ Çevrimiçi';
        let responseTime = 0;

        try {
          const response = await fetch('https://mahorapeak.com.tr', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          responseTime = Date.now() - start;
          if (!response.ok) siteStatus = '⚠️ Sorunlu';
        } catch {
          siteStatus = '❌ Çevrimdışı';
          responseTime = Date.now() - start;
        }

        const dbStart = Date.now();
        let dbStatus = '✅ Bağlı';
        try {
          if (supabase) await supabase.from('profiles').select('id').limit(1);
          else dbStatus = '⚠️ Yapılandırılmamış';
        } catch { dbStatus = '❌ Bağlantı Hatası'; }
        const dbTime = Date.now() - dbStart;

        const embed = new EmbedBuilder()
          .setTitle('🌐 MAHORAPEAK DURUM RAPORU')
          .addFields(
            { name: '🌍 Web Sitesi', value: siteStatus, inline: true },
            { name: '⏱️ Yanıt Süresi', value: `\`${responseTime}ms\``, inline: true },
            { name: '🗄️ Veritabanı', value: dbStatus, inline: true },
            { name: '⏱️ DB Süresi', value: `\`${dbTime}ms\``, inline: true },
            { name: '🤖 Discord Bot', value: '✅ Aktif', inline: true },
            { name: '📡 API', value: '✅ Çalışıyor', inline: true },
          )
          .setColor(siteStatus.includes('✅') ? COLORS.GREEN : COLORS.RED)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'istatistik': {
        if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: series } = await supabase.from('series').select('*', { count: 'exact', head: true });
        const { count: chapters } = await supabase.from('chapters').select('*', { count: 'exact', head: true });
        const { count: comments } = await supabase.from('comments').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 }));

        const embed = new EmbedBuilder()
          .setTitle('📊 MAHORAPEAK İSTATİSTİKLERİ')
          .addFields(
            { name: '👥 Kayıtlı Üye', value: `\`${users || 0}\``, inline: true },
            { name: '📚 Manga Serisi', value: `\`${series || 0}\``, inline: true },
            { name: '📖 Toplam Bölüm', value: `\`${chapters || 0}\``, inline: true },
            { name: '💬 Toplam Yorum', value: `\`${comments || 0}\``, inline: true },
            { name: '🌐 Discord Üye', value: `\`${interaction.guild.memberCount}\``, inline: true },
          )
          .setColor(COLORS.BLUE)
          .setFooter({ text: 'MahoraPeak Canlı Veriler' })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'en-cok-okunan': {
        if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

        const { data } = await supabase.from('series').select('title, views, slug').order('views', { ascending: false }).limit(15);
        if (!data?.length) return interaction.editReply({ content: '❌ Veri bulunamadı.' });

        const list = data.map((m, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
          return `${prefix} ${m.title} — \`${(m.views || 0).toLocaleString()}\` okunma`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('🏆 EN ÇOK OKUNAN MANGALAR')
          .setDescription(list)
          .setColor(COLORS.BLUE)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'son-yorumlar': {
        if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

        const { data } = await supabase.from('comments').select('*, profiles(username)').order('created_at', { ascending: false }).limit(10);
        if (!data?.length) return interaction.editReply({ content: '❌ Yorum bulunamadı.' });

        const list = data.map(c => {
          const user = c.profiles?.username || 'Anonim';
          const text = (c.content || c.text || '').substring(0, 80);
          return `• **${user}:** ${text}${text.length >= 80 ? '...' : ''}`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('💬 SON YORUMLAR')
          .setDescription(list)
          .setColor(COLORS.BLUE)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
