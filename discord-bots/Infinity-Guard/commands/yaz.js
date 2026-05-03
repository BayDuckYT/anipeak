import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('yaz')
    .setDescription('Sunucuya özel embedli mesaj gönderir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('modal:yaz')
      .setTitle('🎨 Özel Embed Hazırla');

    const titleInput = new TextInputBuilder()
      .setCustomId('yaz_title')
      .setLabel('Mesaj Başlığı')
      .setPlaceholder('Başlık girin...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('yaz_desc')
      .setLabel('Mesaj İçeriği')
      .setPlaceholder('Mesaj içeriğini detaylıca yazın...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const imageInput = new TextInputBuilder()
      .setCustomId('yaz_image')
      .setLabel('Görsel URL (Opsiyonel)')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const colorInput = new TextInputBuilder()
      .setCustomId('yaz_color')
      .setLabel('Hex Renk Kodu (Opsiyonel)')
      .setPlaceholder('#5865F2')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(imageInput),
      new ActionRowBuilder().addComponents(colorInput)
    );

    await interaction.showModal(modal);
  },
};
