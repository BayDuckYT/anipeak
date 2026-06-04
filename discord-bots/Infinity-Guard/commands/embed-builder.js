// ============================================================
//  /embed — Gelişmiş Embed Oluşturucu
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('📝 Embed mesaj oluşturucu')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('olustur')
        .setDescription('Özel embed mesaj oluşturur.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Embed başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('açıklama').setDescription('Embed içeriği').setRequired(true))
        .addStringOption(opt => opt.setName('renk').setDescription('Hex renk kodu (örn: #FF0000)'))
        .addStringOption(opt => opt.setName('resim').setDescription('Resim URL'))
        .addStringOption(opt => opt.setName('thumbnail').setDescription('Küçük resim URL'))
        .addStringOption(opt => opt.setName('footer').setDescription('Alt yazı'))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Gönderilecek kanal'))
    )
    .addSubcommand(sub =>
      sub.setName('duyuru')
        .setDescription('Duyuru formatında embed gönderir.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Duyuru başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('içerik').setDescription('Duyuru içeriği').setRequired(true))
        .addStringOption(opt => opt.setName('etiket').setDescription('Etiketlenecek rol (örn: @everyone)'))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Gönderilecek kanal'))
    )
    .addSubcommand(sub =>
      sub.setName('kural')
        .setDescription('Sunucu kuralları embed\'i oluşturur.')
        .addStringOption(opt => opt.setName('kurallar').setDescription('Kuralları | ile ayırın').setRequired(true))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Gönderilecek kanal'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'olustur': {
        const title = interaction.options.getString('başlık');
        const desc = interaction.options.getString('açıklama');
        const colorStr = interaction.options.getString('renk');
        const image = interaction.options.getString('resim');
        const thumbnail = interaction.options.getString('thumbnail');
        const footer = interaction.options.getString('footer');
        const channel = interaction.options.getChannel('kanal') || interaction.channel;

        let color = COLORS.CYBER_BLUE;
        if (colorStr && colorStr.startsWith('#')) {
          try { color = parseInt(colorStr.replace('#', ''), 16); } catch {}
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(desc.replace(/\\n/g, '\n'))
          .setColor(color)
          .setTimestamp();

        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (footer) embed.setFooter({ text: footer });

        await channel.send({ embeds: [embed] });
        await interaction.editReply({ content: `✅ Embed gönderildi: ${channel}` });
        break;
      }

      case 'duyuru': {
        const title = interaction.options.getString('başlık');
        const content = interaction.options.getString('içerik');
        const tag = interaction.options.getString('etiket');
        const channel = interaction.options.getChannel('kanal') || interaction.channel;

        const embed = new EmbedBuilder()
          .setTitle(`📢 ${title}`)
          .setDescription(content.replace(/\\n/g, '\n'))
          .setColor(COLORS.NEON_PINK)
          .setFooter({ text: `Yayınlayan: ${interaction.user.tag}` })
          .setTimestamp();

        await channel.send({ content: tag || null, embeds: [embed] });
        await interaction.editReply({ content: `✅ Duyuru yayınlandı: ${channel}` });
        break;
      }

      case 'kural': {
        const rulesStr = interaction.options.getString('kurallar');
        const channel = interaction.options.getChannel('kanal') || interaction.channel;

        const rules = rulesStr.split('|').map(r => r.trim());
        const rulesList = rules.map((r, i) => `**${i + 1}.** ${r}`).join('\n\n');

        const embed = new EmbedBuilder()
          .setTitle('📜 SUNUCU KURALLARI')
          .setDescription(
            `Lütfen aşağıdaki kurallara uyun. İhlal durumunda uyarı/ceza uygulanacaktır.\n\n${rulesList}\n\n` +
            `> *Kurallara uyarak herkese keyifli bir ortam sağlayabilirsiniz!*`
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: `MahoraPeak | ${interaction.guild.name}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        await interaction.editReply({ content: `✅ Kurallar gönderildi: ${channel}` });
        break;
      }
    }
  },
};
