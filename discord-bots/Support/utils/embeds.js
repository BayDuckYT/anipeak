import { EmbedBuilder } from 'discord.js';
import { CONFIG } from './config.js';

export const baseEmbed = (color = CONFIG.COLORS.PRIMARY) => {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: 'MahoraPeak Çözüm Merkezi | Kalite ve Güven' })
    .setTimestamp();
};

export const supportHubEmbed = () => {
  return baseEmbed()
    .setTitle('🎫 MahoraPeak Çözüm Merkezi')
    .setDescription(
      'Bize ulaşmak, hata bildirmek veya destek almak mı istiyorsunuz?\n\n' +
      'Aşağıdaki butona basarak bir destek talebi oluşturabilirsiniz. Ekibimiz en kısa sürede size yardımcı olacaktır.'
    )
    .addFields(
      { name: '🕒 Çalışma Saatleri', value: '`7/24 Kesintisiz Destek`', inline: true },
      { name: '🛡️ Güvenlik', value: '`Şifreli Görüşme`', inline: true }
    );
};

export const ticketOpenEmbed = (user, title, description) => {
  return baseEmbed(CONFIG.COLORS.SUCCESS)
    .setTitle(`🏷️ Yeni Destek Talebi: ${title}`)
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
    .setDescription(`**Açıklama:**\n${description}`)
    .addFields(
      { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
      { name: '🆔 ID', value: `\`${user.id}\``, inline: true }
    );
};

export const staffControlsEmbed = () => {
  return baseEmbed(CONFIG.COLORS.WARNING)
    .setTitle('🛠️ Yetkili Kontrol Paneli')
    .setDescription(
      'Bu kanal üzerinden destek talebini yönetebilirsiniz.\n\n' +
      '🔒 **Kilitle:** Sohbeti dondurur.\n' +
      '🔓 **Aç:** Sohbeti tekrar aktif eder.\n' +
      '⛔ **Sonlandır:** Görüşmeyi kapatır ve log kaydı oluşturur.'
    );
};
