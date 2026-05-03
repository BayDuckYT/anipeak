import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { syncUserToDiscord } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('AniPeak hesabını Discord ile mühürle!')
    .addStringOption(option => 
      option.setName('email')
        .setDescription('AniPeak sitesindeki e-posta adresin')
        .setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const email = interaction.options.getString('email');
    const discord_id = interaction.user.id;

    try {
      // 1. Kullanıcıyı bul
      const { data, error } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return interaction.editReply({ content: '❌ Bu e-posta adresiyle eşleşen bir AniPeak hesabı bulunamadı!' });
      }

      // [KONTROL] Hesap zaten bağlı mı?
      if (data.discord_id) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⚠️ ZATEN MÜHÜRLÜ')
              .setDescription(`Bu hesap zaten bir Discord hesabına (\`${data.discord_id}\`) mühürlenmiş uşağım! Destek bileti açarak yardım alabilirsin.`)
              .setColor('#F59E0B')
          ]
        });
      }

      // 2. discord_id'yi güncelle
      const { error: updateError } = await client.supabase
        .from('profiles')
        .update({ discord_id: discord_id })
        .eq('id', data.id);

      if (updateError) {
        console.error('[XP] Link hatası:', updateError);
        return interaction.editReply({ 
          content: '❌ Hesabın mühürlenirken bir hata oluştu! (discord_id sütunu eksik olabilir veya bu Discord ID başka hesaba bağlıdır.)' 
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔱 MÜHÜRLEME BAŞARILI!')
        .setDescription(`**${data.username}**, AniPeak hesabın başarıyla bu Discord hesabı ile mühürlendi! Rütbelerin yükleniyor...`)
        .addFields(
          { name: 'Kullanıcı', value: `\`${data.username}\``, inline: true },
          { name: 'Mevcut XP', value: `\`${data.xp || 0} XP\``, inline: true }
        )
        .setColor('#8B5CF6') // AniPeak Moru
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // 3. LOG KANALINA BİLDİR
      const logChannel = interaction.guild.channels.cache.get(process.env.CHANNEL_XP_LOGS);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔱 YENİ HESAP MÜHÜRLENDİ')
          .setDescription(`**${data.username}** (\`${data.email}\`) adlı kullanıcı hesabını mühürledi!`)
          .addFields(
            { name: 'Discord', value: `<@${discord_id}>`, inline: true },
            { name: 'AniPeak', value: `\`${data.username}\``, inline: true }
          )
          .setColor('#8B5CF6')
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }

      // 4. ANLIK SENKRONİZASYON TETİKLE
      const { data: updatedProfile } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.id)
        .single();
        
      if (updatedProfile) {
        await syncUserToDiscord(client, updatedProfile);
      }

    } catch (err) {
      console.error('[XP] Link komut hatası:', err);
      await interaction.editReply({ content: '❌ Beklenmedik bir hata oluştu uşağım!' });
    }
  },
};
