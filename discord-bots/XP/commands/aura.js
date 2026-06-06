// ============================================================
//  /aura — Aura Puanı Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, GOLD: 0xFFD700, PURPLE: 0x8A2BE2 };

// Günlük ödül cooldown takibi
const dailyCooldowns = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('aura')
    .setDescription('✨ MahoraPeak Aura Puanı Sistemi')
    .addSubcommand(sub =>
      sub.setName('bakiye')
        .setDescription('Aura bakiyenizi gösterir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Bakiyesi görülecek kullanıcı'))
    )
    .addSubcommand(sub =>
      sub.setName('günlük')
        .setDescription('Günlük aura ödülünüzü alın!')
    )
    .addSubcommand(sub =>
      sub.setName('transfer')
        .setDescription('Başka bir kullanıcıya aura gönderir.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Gönderilecek kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Gönderilecek miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('aura-ekle')
        .setDescription('[Admin] Kullanıcıya aura ekler.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Eklenecek miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('aura-cikar')
        .setDescription('[Admin] Kullanıcıdan aura çıkarır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Çıkarılacak miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('zenginler')
        .setDescription('En çok auraya sahip kullanıcıları gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı yok.' });

    switch (sub) {
      case 'bakiye': {
        const user = interaction.options.getUser('kullanıcı') || interaction.user;
        const { data: profile } = await supabase.from('profiles').select('username, aura, level, is_elite').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil. Siteden hesabını bağlamalısın.' });

        const embed = new EmbedBuilder()
          .setTitle(`✨ ${user.tag} — Aura Bakiyesi`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🌟 Aura', value: `\`${(profile.aura || 0).toLocaleString()}\``, inline: true },
            { name: '📊 Seviye', value: `\`${profile.level || 1}\``, inline: true },
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'MahoraPeak Aura Sistemi' });
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

        const { data: profile } = await supabase.from('profiles').select('id, aura, level, is_elite').eq('discord_id', userId).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil. Siteden hesabını bağlamalısın.' });

        const baseReward = 100;
        const levelBonus = (profile?.level || 1) * 10;
        const totalReward = baseReward + levelBonus;

        const newAura = (profile?.aura || 0) + totalReward;
        await supabase.from('profiles').update({ aura: newAura }).eq('id', profile.id);
        dailyCooldowns.set(userId, now);

        const embed = new EmbedBuilder()
          .setTitle('🎁 GÜNLÜK AURA ALINDI!')
          .setDescription(
            `**+${totalReward} Aura** kazandın!\\n\\n` +
            `• Temel: \`${baseReward}\` aura\\n` +
            `• Seviye Bonusu: \`+${levelBonus}\` aura\\n\\n` +
            `🌟 Yeni Bakiye: \`${newAura.toLocaleString()}\``
          )
          .setColor(COLORS.PURPLE)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'transfer': {
        const target = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ Kendine transfer yapamazsın.' });

        const { data: senderProfile } = await supabase.from('profiles').select('id, aura').eq('discord_id', interaction.user.id).single();
        const { data: receiverProfile } = await supabase.from('profiles').select('id, aura').eq('discord_id', target.id).single();

        if (!senderProfile || !receiverProfile) return interaction.editReply({ content: '❌ Her iki hesap da siteye bağlı olmalı.' });

        if ((senderProfile?.aura || 0) < amount) return interaction.editReply({ content: `❌ Yeterli Auran yok. Bakiye: \`${senderProfile?.aura || 0}\`` });

        await supabase.from('profiles').update({ aura: (senderProfile.aura || 0) - amount }).eq('id', senderProfile.id);
        await supabase.from('profiles').update({ aura: (receiverProfile?.aura || 0) + amount }).eq('id', receiverProfile.id);

        const embed = new EmbedBuilder()
          .setTitle('✨ TRANSFER BAŞARILI')
          .setDescription(`${interaction.user} → ${target}\\n**Miktar:** \`${amount.toLocaleString()}\` Aura`)
          .setColor(COLORS.GREEN);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'aura-ekle': {
        if (!hasPermission(interaction.member, 'BYK')) { return interaction.editReply({ content: '❌ Admin yetki gerekli.' }); }const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        const { data: profile } = await supabase.from('profiles').select('id, aura').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const newAura = (profile?.aura || 0) + amount;
        await supabase.from('profiles').update({ aura: newAura }).eq('id', profile.id);

        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Aura Eklendi').setDescription(`${user.tag}: +\`${amount}\` → \`${newAura}\``).setColor(COLORS.GOLD)] });
        break;
      }

      case 'aura-cikar': {
        if (!hasPermission(interaction.member, 'BYK')) { return interaction.editReply({ content: '❌ Admin yetki gerekli.' }); }const user = interaction.options.getUser('kullanıcı');
        const amount = interaction.options.getInteger('miktar');

        const { data: profile } = await supabase.from('profiles').select('id, aura').eq('discord_id', user.id).single();
        if (!profile) return interaction.editReply({ content: '❌ Hesap bağlı değil.' });

        const newAura = Math.max((profile?.aura || 0) - amount, 0);
        await supabase.from('profiles').update({ aura: newAura }).eq('id', profile.id);

        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('⬇️ Aura Çıkarıldı').setDescription(`${user.tag}: -\`${amount}\` → \`${newAura}\``).setColor(COLORS.RED)] });
        break;
      }

      case 'zenginler': {
        const { data } = await supabase.from('profiles').select('username, aura').order('aura', { ascending: false }).limit(15);
        if (!data?.length) return interaction.editReply({ content: '❌ Veri bulunamadı.' });

        const medals = ['🥇', '🥈', '🥉'];
        const list = data.map((p, i) => {
          const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
          return `${prefix} **${p.username || 'Anonim'}** — \`${(p.aura || 0).toLocaleString()}\` Aura`;
        }).join('\\n');

        const embed = new EmbedBuilder()
          .setTitle('👑 EN ÇOK AURASI OLANLAR')
          .setDescription(list)
          .setColor(COLORS.GOLD)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
