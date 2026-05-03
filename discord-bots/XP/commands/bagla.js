import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { syncUserToDiscord } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bagla')
    .setDescription('AniPeak web hesabını Discord ile mühürle!')
    .addStringOption(option => 
      option.setName('kod')
        .setDescription('Web sitesinden aldığın AP-XXXXXX formatındaki kod')
        .setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const code = interaction.options.getString('kod').toUpperCase();
    const discord_id = interaction.user.id;

    try {
      // 1. Kodu veritabanında ara
      const { data: verifData, error: verifError } = await client.supabase
        .from('verification_codes')
        .select('*, profiles(*)')
        .eq('code', code)
        .single();

      if (verifError || !verifData) {
        return interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Geçersiz Kod')
              .setDescription('Girdiğin kod hatalı veya mühürlenmemiş uşağım! Lütfen siteden yeni bir kod al.')
              .setColor('#EF4444')
          ] 
        });
      }

      // 2. Süre kontrolü
      if (new Date(verifData.expires_at) < new Date()) {
        // Süresi dolmuş kodu sil
        await client.supabase.from('verification_codes').delete().eq('id', verifData.id);
        
        return interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setTitle('⏰ Süre Doldu')
              .setDescription('Bu kodun süresi dolmuş amk! Siteden taze bir kod al da gel.')
              .setColor('#F59E0B')
          ] 
        });
      }

      // [KONTROL] Hesap zaten bağlı mı?
      if (verifData.profiles.discord_id) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ ZATEN MÜHÜRLÜ')
              .setDescription(`Bu hesap zaten bir Discord hesabına (\`${verifData.profiles.discord_id}\`) mühürlenmiş uşağım!`)
              .setColor('#F59E0B')
          ]
        });
      }

      // 3. Profiles tablosunu güncelle (Mühürleme)
      const { error: updateError } = await client.supabase
        .from('profiles')
        .update({ discord_id: discord_id })
        .eq('id', verifData.user_id);

      if (updateError) {
        console.error('[XP] Mühürleme hatası:', updateError);
        return interaction.editReply({ 
          content: '❌ Mühür basılırken bir hata oluştu! Bu Discord ID başka bir hesaba mühürlü olabilir.' 
        });
      }

      // 4. Kullanılan kodu sil
      await client.supabase.from('verification_codes').delete().eq('id', verifData.id);

      // 5. Başarı Mesajı ve Anlık Senkronizasyon
      const successEmbed = new EmbedBuilder()
        .setTitle('🔱 MÜHÜR BASILDI!')
        .setDescription(`Uşağım **${verifData.profiles.username}**, hesabın artık Discord ile birleşti! Rütbelerin ve seviyen saniyeler içinde yükleniyor...`)
        .setColor('#8B5CF6')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

      // 6. LOG KANALINA BİLDİR
      const logChannel = interaction.guild.channels.cache.get(process.env.CHANNEL_XP_LOGS);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔱 YENİ HESAP MÜHÜRLENDİ (KOD İLE)')
          .setDescription(`**${verifData.profiles.username}** adlı kullanıcı kod kullanarak hesabını mühürledi!`)
          .addFields(
            { name: 'Discord', value: `<@${discord_id}>`, inline: true },
            { name: 'AniPeak', value: `\`${verifData.profiles.username}\``, inline: true }
          )
          .setColor('#8B5CF6')
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }

      // 7. ANLIK SENKRONİZASYON TETİKLE
      // profiles verisini en güncel haliyle çekelim
      const { data: updatedProfile } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('id', verifData.user_id)
        .single();

      if (updatedProfile) {
        await syncUserToDiscord(client, updatedProfile);
      }

    } catch (err) {
      console.error('[XP] Bagla komut hatası:', err);
      await interaction.editReply({ content: '❌ Beklenmedik bir hata oluştu uşağım!' });
    }
  },
};
