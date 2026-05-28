import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { syncUserToDiscord } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bağla')
    .setDescription('MahoraPeak web hesabını Discord ile mühürle!')
    .addStringOption(option => 
      option.setName('kod')
        .setDescription('Web sitesinden aldığın AP_XXXXXX formatındaki kod')
        .setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const code = interaction.options.getString('kod').toUpperCase();
    const discord_id = interaction.user.id;

    try {
      // 1. Kodu profillerde ara
      const { data: profile, error: fetchError } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('discord_sync_code', code)
        .single();

      if (fetchError || !profile) {
        return interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Geçersiz Kod')
              .setDescription('Girdiğin kod hatalı uşağım! Lütfen siteden doğru kodu kopyala.')
              .setColor('#EF4444')
          ] 
        });
      }

      // [KONTROL] Kodun süresi dolmuş mu?
      if (profile.discord_sync_code_expires) {
        const expiry = new Date(profile.discord_sync_code_expires).getTime();
        if (Date.now() > expiry) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('⏳ SÜRE DOLDU')
                .setDescription('Bu mühür kodunun 5 dakikalık süresi dolmuş! Lütfen siteden **YENİ KOD OLUŞTUR** butonuna basarak taze bir kod al.')
                .setColor('#F59E0B')
            ]
          });
        }
      }

      // [KONTROL] Hesap zaten bağlı mı?
      if (profile.discord_id) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ ZATEN MÜHÜRLÜ')
              .setDescription(`Bu hesap zaten bir Discord hesabına (\`${profile.discord_id}\`) mühürlenmiş!`)
              .setColor('#F59E0B')
          ]
        });
      }

      // 2. Profili güncelle (Mühürleme)
      const { error: updateError } = await client.supabase
        .from('profiles')
        .update({ 
          discord_id: discord_id,
          discord_sync_code: null // Kodu kullanıldıktan sonra temizle
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('[XP] Mühürleme hatası:', updateError);
        return interaction.editReply({ 
          content: '❌ Mühür basılırken bir hata oluştu! Bu Discord ID başka bir hesaba mühürlü olabilir.' 
        });
      }

      // 3. Başarı Mesajı ve Anlık Senkronizasyon
      const successEmbed = new EmbedBuilder()
        .setTitle('🔱 MÜHÜR BASILDI!')
        .setDescription(`Uşağım **${profile.username}**, hesabın artık Discord ile birleşti! Rütbelerin ve seviyen saniyeler içinde yükleniyor...`)
        .setColor('#8B5CF6')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

      // 4. LOG KANALINA BİLDİR
      const logChannelId = process.env.CHANNEL_XP_LOGS;
      if (logChannelId) {
        const guild = interaction.guild;
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🔱 YENİ HESAP MÜHÜRLENDİ')
            .setDescription(`**${profile.username}** adlı kullanıcı hesabını mühürledi!`)
            .addFields(
              { name: 'Discord', value: `<@${discord_id}>`, inline: true },
              { name: 'MahoraPeak', value: `\`${profile.username}\``, inline: true }
            )
            .setColor('#8B5CF6')
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      // 5. ANLIK SENKRONİZASYON TETİKLE
      await syncUserToDiscord(client, { ...profile, discord_id });

    } catch (err) {
      console.error('[XP] Bagla komut hatası:', err);
      await interaction.editReply({ content: '❌ Beklenmedik bir hata oluştu uşağım!' });
    }
  },
};
