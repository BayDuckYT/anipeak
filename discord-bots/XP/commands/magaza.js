// ============================================================
//  /mağaza — Coin Mağazası
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, GOLD: 0xFFD700 };

// Mağaza Eşyaları
const STORE_ITEMS = [
  { id: 'role_vip', name: 'VIP Rolü (1 Ay)', price: 50000, type: 'role', desc: 'Sunucuda VIP rolüne sahip olursun. Özel kanallara erişim sağlar.' },
  { id: 'role_color', name: 'Özel Renk Rolü', price: 25000, type: 'custom_role', desc: 'İsminin rengini istediğin gibi ayarlayabileceğin özel bir rol.' },
  { id: 'profile_bg', name: 'Özel Profil Arkaplanı', price: 10000, type: 'cosmetic', desc: '`/profil` komutunda görünecek sana özel arkaplan.' },
  { id: 'xp_boost', name: 'XP Boost (2x - 24 Saat)', price: 5000, type: 'boost', desc: '24 saat boyunca tüm mesajlardan 2 kat XP kazanırsın.' },
  { id: 'name_change', name: 'Sitede İsim Değiştirme Hakkı', price: 15000, type: 'feature', desc: 'Web sitesindeki kullanıcı adını değiştirme hakkı verir.' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('mağaza')
    .setDescription('🛒 Coin Mağazası')
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Mağazadaki eşyaları listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('satın-al')
        .setDescription('Mağazadan eşya satın alır.')
        .addStringOption(opt => opt.setName('eşya').setDescription('Satın alınacak eşya').setRequired(true)
          .addChoices(...STORE_ITEMS.map(i => ({ name: `${i.name} — ${i.price} Coin`, value: i.id })))
        )
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    switch (sub) {
      case 'liste': {
        const list = STORE_ITEMS.map((item, index) => {
          return `**${index + 1}. ${item.name}**\n🪙 Fiyat: \`${item.price.toLocaleString()}\` Coin\n📝 ${item.desc}\n`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('🛒 MAHORAPEAK MAĞAZASI')
          .setDescription(`Biriken coinlerinle harika eşyalar ve özellikler satın al!\n\n${list}`)
          .setColor(COLORS.GOLD)
          .setFooter({ text: 'Satın almak için: /mağaza satın-al' });
        
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'satın-al': {
        const itemId = interaction.options.getString('eşya');
        const item = STORE_ITEMS.find(i => i.id === itemId);

        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', interaction.user.id).single();
        if (!link) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', link.profile_id).single();
        if (!profile || profile.coins < item.price) {
          return interaction.editReply({ content: `❌ Yeterli coinin yok! Bakiyen: \`${profile?.coins || 0}\`, Gerekli: \`${item.price}\`` });
        }

        // Parayı kes
        const newCoins = profile.coins - item.price;
        await supabase.from('profiles').update({ coins: newCoins }).eq('id', link.profile_id);

        // Envantere ekle
        await supabase.from('inventory').insert([{ profile_id: link.profile_id, item_id: item.id, item_name: item.name, item_type: item.type }]);

        const embed = new EmbedBuilder()
          .setTitle('🛍️ SATIN ALMA BAŞARILI!')
          .setDescription(`Başarıyla **${item.name}** satın aldın!\n\nKalan Bakiye: \`${newCoins.toLocaleString()}\` Coin`)
          .setColor(COLORS.GREEN)
          .setFooter({ text: 'Eşyalarını görmek için /envanter yazabilirsin.' });
        
        await interaction.editReply({ embeds: [embed] });

        // Admin kanalına log gönder
        const logChannel = interaction.guild.channels.cache.find(c => c.name.includes('shop-log') || c.name.includes('market-log'));
        if (logChannel) {
          logChannel.send(`🛒 ${interaction.user} kullanıcısı mağazadan **${item.name}** satın aldı. (${item.price} Coin)`);
        }
        break;
      }
    }
  },
};
