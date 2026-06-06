// ============================================================
//  /görev — Günlük ve Haftalık Görev Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, GOLD: 0xFFD700, PURPLE: 0x8A2BE2 };

// Varsayılan görev listesi (Gerçekte DB'den gelir)
const QUESTS = [
  { id: 'q1', type: 'daily', title: 'Kitap Kurdu', desc: 'Günde 5 manga bölümü oku.', reward: 250, requirement: 5 },
  { id: 'q2', type: 'daily', title: 'Sohbet Kuşu', desc: 'Discord sunucusunda 50 mesaj gönder.', reward: 150, requirement: 50 },
  { id: 'q3', type: 'weekly', title: 'Eleştirmen', desc: 'Mangalara 10 adet yorum yap.', reward: 1000, requirement: 10 },
  { id: 'q4', type: 'weekly', title: 'Maraton', desc: 'Haftada 50 manga bölümü oku.', reward: 2000, requirement: 50 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('görev')
    .setDescription('📜 Günlük ve haftalık görevler')
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Mevcut görevleri ve ilerlemenizi gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('tamamla')
        .setDescription('Tamamlanan bir görevin ödülünü alır.')
        .addStringOption(opt => opt.setName('görev_id').setDescription('Görev ID (örn: q1)').setRequired(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    const { data: profile } = await supabase.from('profiles').select('id, aura').eq('discord_id', interaction.user.id).single();
    if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

    switch (sub) {
      case 'liste': {
        // İlerlemeleri DB'den simüle ediyoruz
        const embed = new EmbedBuilder()
          .setTitle('📜 GÖREV LİSTESİ')
          .setDescription('Görevleri tamamlayarak extra Aura ve XP kazanabilirsin!')
          .setColor(COLORS.PURPLE);

        const daily = QUESTS.filter(q => q.type === 'daily');
        const weekly = QUESTS.filter(q => q.type === 'weekly');

        const formatQuest = (q) => {
          // İlerleme mock
          const progress = Math.floor(Math.random() * (q.requirement + 1));
          const isDone = progress >= q.requirement;
          const icon = isDone ? '✅' : '⏳';
          return `${icon} **${q.title}** (\`${q.id}\`)\n└ *${q.desc}*\n└ İlerleme: \`${progress}/${q.requirement}\` | Ödül: 🌟 \`${q.reward}\``;
        };

        embed.addFields(
          { name: '📅 GÜNLÜK GÖREVLER', value: daily.map(formatQuest).join('\n\n') },
          { name: '🗓️ HAFTALIK GÖREVLER', value: weekly.map(formatQuest).join('\n\n') }
        );

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'tamamla': {
        const qId = interaction.options.getString('görev_id');
        const quest = QUESTS.find(q => q.id === qId);

        if (!quest) return interaction.editReply({ content: '❌ Geçersiz Görev ID.' });

        // Burada DB kontrolü yapılmalı (Görev gerçekten bitti mi ve daha önce alındı mı)
        // Şimdilik ödülü direkt veriyoruz
        const newAura = (profile?.aura || 0) + quest.reward;

        await supabase.from('profiles').update({ aura: newAura }).eq('id', profile.id);

        const embed = new EmbedBuilder()
          .setTitle('🎉 GÖREV TAMAMLANDI!')
          .setDescription(`**${quest.title}** görevini tamamladın ve **${quest.reward} Aura** kazandın!\n\n🌟 Yeni Bakiye: \`${newAura.toLocaleString()}\``)
          .setColor(COLORS.GOLD);
        
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
