// ============================================================
//  /geribildirim — Gelişmiş Geri Bildirim ve Değerlendirme
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, PURPLE: 0x8A2BE2 };

export default {
  data: new SlashCommandBuilder()
    .setName('geribildirim')
    .setDescription('📝 Site veya sunucu hakkında geri bildirim gönderin')
    .addSubcommand(sub =>
      sub.setName('site')
        .setDescription('MahoraPeak web sitesi için geri bildirim gönderir.')
    )
    .addSubcommand(sub =>
      sub.setName('sunucu')
        .setDescription('Discord sunucusu için geri bildirim gönderir.')
    )
    .addSubcommand(sub =>
      sub.setName('çeviri')
        .setDescription('Manga çevirileri hakkında geri bildirim gönderir.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    const modal = new ModalBuilder()
      .setCustomId(`feedback_${sub}`)
      .setTitle(`${sub.charAt(0).toUpperCase() + sub.slice(1)} Geri Bildirimi`);

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Konu / Başlık')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: Site arayüzü hakkında')
      .setRequired(true)
      .setMaxLength(100);

    const ratingInput = new TextInputBuilder()
      .setCustomId('rating')
      .setLabel('Puan (1-10 Arası)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: 9')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(2);

    const descInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Geri Bildiriminiz (Ne iyiydi, ne kötüydü?)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Düşüncelerinizi buraya yazın...')
      .setRequired(true)
      .setMaxLength(2000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(ratingInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    await interaction.showModal(modal);
  },
};
