import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ChannelSelectMenuBuilder, 
  StringSelectMenuBuilder, 
  ChannelType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { COLORS, ANIPEAK } from '../utils/config.js';
import { getSettings } from '../utils/settingsManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guard-settings')
    .setDescription('🛡️ Gelişmiş koruma ayarlarını yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Sadece Sunucu Sahibi (GS) kontrolü
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ 
        content: '❌ Bu komutu sadece **Sunucu Sahibi (GS)** kullanabilir.', 
        ephemeral: true 
      });
    }

    const settings = getSettings();

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Infinity Guard | Gelişmiş Ayarlar')
      .setDescription('Aşağıdaki menüleri kullanarak koruma ayarlarını kanala özel veya sunucu genelinde yönetebilirsiniz.')
      .addFields(
        { name: '🌐 Sunucu Geneli', value: `
          • Anti-Spam: ${settings.global.antiSpam ? '✅' : '❌'}
          • Anti-Link: ${settings.global.antiLink ? '✅' : '❌'}
          • Küfür Filtresi: ${settings.global.badWords ? '✅' : '❌'}
          • Caps Engel: ${settings.global.capsFilter ? '✅' : '❌'}
        `, inline: false }
      )
      .setColor(COLORS.CYBER_BLUE)
      .setFooter({ text: ANIPEAK.FOOTER_TEXT, iconURL: ANIPEAK.FOOTER_ICON });

    // Kanal Seçim Menüsü
    const channelSelect = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('guard_channel_select')
        .setPlaceholder('⚙️ Ayarlanacak Kanal(ları) Seçin...')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(25)
    );

    // Ayar Seçim Menüsü
    const settingSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('guard_setting_toggle')
        .setPlaceholder('🔒 İşlem Seçin (Kanal veya Global)...')
        .addOptions([
          { label: 'Anti-Spam (Aç/Kapat)', value: 'antiSpam', description: 'Hızlı mesaj gönderimini engeller.', emoji: '📨' },
          { label: 'Link Filtresi (Aç/Kapat)', value: 'antiLink', description: 'Yasaklı veya harici linkleri engeller.', emoji: '🔗' },
          { label: 'Küfür Filtresi (Aç/Kapat)', value: 'badWords', description: 'Küfürlü mesajları engeller.', emoji: '🤬' },
          { label: 'Caps Engel (Aç/Kapat)', value: 'capsFilter', description: 'Aşırı büyük harf kullanımını engeller.', emoji: '🔠' },
          { label: 'Duplicate Engel (Aç/Kapat)', value: 'duplicateFilter', description: 'Aynı mesajın tekrarını engeller.', emoji: '🔄' },
          { label: '--- ÖZEL İŞLEMLER ---', value: 'spacer', description: 'Aşağıdakiler seçili kanallara veya genele uygulanır.', emoji: '⚙️' },
          { label: 'Tüm Sunucuda Aç (Global)', value: 'global_on', description: 'Bütün kanallarda tüm korumaları aktif eder.', emoji: '🌐' },
          { label: 'Tüm Sunucuda Kapat (Global)', value: 'global_off', description: 'Bütün kanallarda tüm korumaları devre dışı bırakır.', emoji: '🛑' },
          { label: 'Seçili Kanallarda Hepsini Aç', value: 'all_on', description: 'Seçili kanallarda tüm korumaları açar.', emoji: '✅' },
          { label: 'Seçili Kanallarda Hepsini Kapat', value: 'all_off', description: 'Seçili kanallarda tüm korumaları kapatır.', emoji: '❌' }
        ])
    );

    // Hedef Seçim Butonları (Tüm Kanallar / Seçili Kanallar)
    const targetButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('guard_target_all')
        .setLabel('📢 TÜM KANALLARI SEÇ')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('guard_target_reset')
        .setLabel('🔄 SEÇİMİ SIFIRLA')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [targetButtons, channelSelect, settingSelect],
      ephemeral: true
    });
  },
};
