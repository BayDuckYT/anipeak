import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import { abonePanelEmbed } from '../utils/embeds.js';
import { createClient } from '@supabase/supabase-js';

export default {
  data: new SlashCommandBuilder()
    .setName('abone-panel')
    .setDescription('Haber Abonelik Merkezini açar.'),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      
      // En çok okunan veya güncel olan ilk 25 seriyi getir
      const { data: series, error } = await supabase
        .from('series')
        .select('title')
        .order('reads_num', { ascending: false })
        .limit(25);

      if (error || !series || series.length === 0) {
        return interaction.editReply('❌ Sistemde listelenecek seri bulunamadı.');
      }

      // Menü seçeneklerini oluştur
      const options = series.map((s) => ({
        label: s.title.substring(0, 100), // Discord label limiti 100 karakter
        value: s.title.substring(0, 100),
        emoji: '📖',
      }));

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('abone:select_series')
          .setPlaceholder('📡 Bildirim almak istediğin seriyi seç')
          .addOptions(options)
      );

      const embed = abonePanelEmbed();

      await interaction.editReply({
        embeds: [embed],
        components: [selectMenu],
      });
    } catch (err) {
      console.error('[Abone Panel] Hata:', err);
      await interaction.editReply('❌ Sistemde kritik bir hata oluştu.');
    }
  },
};
