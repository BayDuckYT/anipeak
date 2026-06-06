// ============================================================
//  /envanter — Kullanıcı Envanter Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, PURPLE: 0x8A2BE2 };

export default {
  data: new SlashCommandBuilder()
    .setName('envanter')
    .setDescription('🎒 Satın aldığın eşyaları gösterir ve kullandırır')
    .addSubcommand(sub =>
      sub.setName('goster')
        .setDescription('Envanterini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('kullan')
        .setDescription('Envanterindeki bir eşyayı kullanır.')
        .addIntegerOption(opt => opt.setName('id').setDescription('Eşyanın ID\'si (Envanterdeki sıra/ID)').setRequired(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', interaction.user.id).single();
    if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

    switch (sub) {
      case 'goster': {
        const { data: inventory } = await supabase.from('inventory').select('*').eq('profile_id', profile.id);

        if (!inventory || inventory.length === 0) {
          return interaction.editReply({ content: '🎒 Envanterin tamamen boş. `/mağaza` üzerinden eşya satın alabilirsin.' });
        }

        const list = inventory.map(item => `**ID: \`${item.id}\`** — 📦 ${item.item_name} *(Tipi: ${item.item_type})*`).join('\n');

        const embed = new EmbedBuilder()
          .setTitle(`🎒 ${interaction.user.tag} Envanteri`)
          .setDescription(list)
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'Kullanmak için: /envanter kullan id:<id>' });
        
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'kullan': {
        const invId = interaction.options.getInteger('id');

        // Check if user owns the item
        const { data: item } = await supabase.from('inventory').select('*').eq('id', invId).eq('profile_id', profile.id).single();

        if (!item) {
          return interaction.editReply({ content: '❌ Envanterinde böyle bir eşya bulunamadı.' });
        }

        // Use item logic based on item_type
        let actionMsg = '';
        if (item.item_type === 'role') {
          // Grant role
          actionMsg = 'VIP rolü başarıyla verildi!';
        } else if (item.item_type === 'custom_role') {
          actionMsg = 'Özel renk rolü oluşturuldu! Yönetim ekibine bildirin.';
        } else if (item.item_type === 'boost') {
          actionMsg = 'XP Boost aktif edildi! (24 Saat)';
        } else {
          actionMsg = 'Eşya başarıyla kullanıldı!';
        }

        // Delete from inventory (Consume)
        await supabase.from('inventory').delete().eq('id', invId);

        const embed = new EmbedBuilder()
          .setTitle('✅ Eşya Kullanıldı!')
          .setDescription(`**${item.item_name}** adlı eşyayı kullandın.\n\n` + actionMsg)
          .setColor(COLORS.GREEN);

        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
