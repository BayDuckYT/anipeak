// ============================================================
//  /ekonomi — Coin & Ekonomi Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, GOLD: 0xFFD700, PURPLE: 0x8A2BE2 };

// Günlük ödül cooldown takibi
const dailyCooldowns = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('ekonomi')
    .setDescription('💰 Ekonomi ve coin sistemi')
    .addSubcommand(sub =>
      sub.setName('bakiye')
        .setDescription('Coin bakiyenizi gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Bakiyesi görülecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('günlük')
        .setDescription('Günlük coin ödülünüzü alın!')
    )
    .addSubcommand(sub =>
      sub.setName('transfer')
        .setDescription('Başka bir kullanıcıya coin gönderir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Gönderilecek kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Gönderilecek miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('coin-ekle')
        .setDescription('[Admin] Kullanıcıya coin ekler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Eklenecek miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('coin-cikar')
        .setDescription('[Admin] Kullanıcıdan coin çıkarır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Çıkarılacak miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('zenginler')
        .setDescription('En zengin kullanıcıları gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    switch (sub) {
      case 'bakiye': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', user.id).single();
        if (!link) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('username, coins, level').eq('id', link.profile_id).single();
        if (!profile) return interaction.editReply({ content: '❌ Profil bulunamadı.' });

        const embed = new EmbedBuilder()
          .setTitle(`💰 ${user.tag} — Bakiye`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🪙 Coin', value: `\`${(profile.coins || 0).toLocaleString()}\``, inline: true },
            { name: '📊 Seviye', value: `\`${profile.level || 1}\``, inline: true },
          )
          .setColor(COLORS.GOLD)
          .setFooter({ text: 'MahoraPeak Ekonomi' });
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'günlük': {
        const userId = interaction.user.id;
        const lastClaim = dailyCooldowns.get(userId);
        const now = Date.now();

        if (lastClaim && (now - lastClaim) < 86400000) {
          const remaining = 86400000 - (now - lastClaim);
          const hours = Math.floor(remaining / 3600000);
          const mins = Math.floor((remaining % 3600000) / 60000);
          return interaction.editReply({ content: `⏰ Günlük ödülünü zaten aldın! Kalan: **${hours}s ${mins}dk**` });
        }

        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', userId).single();
        if (!link) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('coins, level').eq('id', link.profile_id).single();

        const baseReward = 100;
        const levelBonus = (profile?.level || 1) * 10;
        const totalReward = baseReward + levelBonus;

        const newCoins = (profile?.coins || 0) + totalReward;
        await supabase.from('profiles').update({ coins: newCoins }).eq('id', link.profile_id);
        dailyCooldowns.set(userId, now);

        const embed = new EmbedBuilder()
          .setTitle('🎁 GÜNLÜK ÖDÜL ALINDI!')
          .setDescription(
            `**+${totalReward} Coin** kazandın!\n\n` +
            `• Temel: \`${baseReward}\` coin\n` +
            `• Seviye Bonusu: \`+${levelBonus}\` coin\n\n` +
            `💰 Yeni Bakiye: \`${newCoins.toLocaleString()}\``
          )
          .setColor(COLORS.GOLD)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'transfer': {
        const target = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Kendine transfer yapamazsın.' });

        const { data: senderLink } = await supabase.from('discord_links').select('profile_id').eq('discord_id', interaction.user.id).single();
        const { data: receiverLink } = await supabase.from('discord_links').select('profile_id').eq('discord_id', target.id).single();

        if (!senderLink || !receiverLink) return interaction.editReply({ content: '❌ Her iki hesap da bağlı olmalı.' });

        const { data: sender } = await supabase.from('profiles').select('coins').eq('id', senderLink.profile_id).single();
        if ((sender?.coins || 0) < amount) return interaction.editReply({ content: `❌ Yeterli coinin yok. Bakiye: \`${sender?.coins || 0}\`` });

        const { data: receiver } = await supabase.from('profiles').select('coins').eq('id', receiverLink.profile_id).single();

        await supabase.from('profiles').update({ coins: (sender.coins) - amount }).eq('id', senderLink.profile_id);
        await supabase.from('profiles').update({ coins: (receiver?.coins || 0) + amount }).eq('id', receiverLink.profile_id);

        const embed = new EmbedBuilder()
          .setTitle('💸 TRANSFER BAŞARILI')
          .setDescription(`${interaction.user} → ${target}\n**Miktar:** \`${amount.toLocaleString()}\` coin`)
          .setColor(COLORS.GREEN);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'coin-ekle': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Admin yetki gerekli.' });
        const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', user.id).single();
        if (!link) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', link.profile_id).single();
        const newCoins = (profile?.coins || 0) + amount;
        await supabase.from('profiles').update({ coins: newCoins }).eq('id', link.profile_id);

        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Coin Eklendi').setDescription(`${user.tag}: +\`${amount}\` → \`${newCoins}\``).setColor(COLORS.GOLD)] });
        break;
      }

      case 'coin-cikar': {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Admin yetki gerekli.' });
        const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', user.id).single();
        if (!link) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', link.profile_id).single();
        const newCoins = Math.max((profile?.coins || 0) - amount, 0);
        await supabase.from('profiles').update({ coins: newCoins }).eq('id', link.profile_id);

        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('⬇️ Coin Çıkarıldı').setDescription(`${user.tag}: -\`${amount}\` → \`${newCoins}\``).setColor(COLORS.RED)] });
        break;
      }

      case 'zenginler': {
        const { data } = await supabase.from('profiles').select('username, coins').order('coins', { ascending: false }).limit(15);
        if (!data?.length) return interaction.editReply({ content: '❌ Veri bulunamadı.' });

        const medals = ['🥇', '🥈', '🥉'];
        const list = data.map((p, i) => {
          const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
          return `${prefix} **${p.username || 'Anonim'}** — \`${(p.coins || 0).toLocaleString()}\` coin`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('💎 EN ZENGİN KULLANICILAR')
          .setDescription(list)
          .setColor(COLORS.GOLD)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
