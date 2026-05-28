import { createClient } from '@supabase/supabase-js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { chapterRadarEmbed, newSeriesRadarEmbed } from './embeds.js';

export function startRadar(client) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const newsChannelId = process.env.DUYURU_KANALI_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Haber Radar] ⚠️  Supabase bilgileri eksik. Radar başlatılamadı.');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Haber Sistemi] 📡 Supabase bağlantısı kuruluyor...');

  // Realtime bağlantısını kur
  const globalChannel = supabase.channel('mahorapeak-global');

  globalChannel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'chapters' },
    async (payload) => {
      try {
        console.log('[Haber Sistemi] 🚨 YENİ BÖLÜM EKLENDİ!', payload.new);
        const newChapter = payload.new;

        if (!newsChannelId) return console.warn('[Haber Sistemi] ⚠️  DUYURU_KANALI_ID tanımlı değil.');
        
        const targetChannel = await client.channels.fetch(newsChannelId).catch(() => null);
        if (!targetChannel) return console.error('[Haber Sistemi] ❌ Hedef duyuru kanalı bulunamadı.');

        // Serinin detaylarını çek
        const { data: seriesData, error } = await supabase
          .from('series')
          .select('title, cover')
          .eq('id', newChapter.series_id)
          .single();

        if (error || !seriesData) return console.error('[Haber Sistemi] Seri bilgisi çekilemedi:', error);

        const seriesTitle = seriesData.title;
        const coverImage = seriesData.cover;
        const url = `https://mahorapeak.com.tr/manga/${newChapter.series_id}/bolum/${newChapter.number}`;

        const embed = chapterRadarEmbed(seriesTitle, newChapter.number, newChapter.title, coverImage, url);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('🚀 Hemen Oku')
            .setStyle(ButtonStyle.Link)
            .setURL(url)
        );

        // Abone rolünü bul veya oluştur
        let roleToMention = '';
        const role = targetChannel.guild.roles.cache.find((r) => r.name.toLowerCase() === seriesTitle.toLowerCase());

        if (role) {
          roleToMention = `<@&${role.id}>`;
        } else {
          try {
            const newRole = await targetChannel.guild.roles.create({
              name: seriesTitle,
              color: '#00FFFF',
              mentionable: true,
              reason: 'Yeni bölüm duyuru abone rolü',
            });
            roleToMention = `<@&${newRole.id}>`;
          } catch (roleErr) {
            console.error('[Haber Sistemi] Rol oluşturulamadı:', roleErr);
          }
        }

        const messagePayload = { embeds: [embed], components: [row] };
        if (roleToMention) messagePayload.content = roleToMention;

        await targetChannel.send(messagePayload);
      } catch (err) {
        console.error('[Haber Sistemi] Duyuru gönderme hatası:', err);
      }
    }
  );

  // 2. YENİ SERİ (SERIES) DİNLEYİCİSİ
  globalChannel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'series' },
    async (payload) => {
      try {
        console.log('[Haber Sistemi] 🔥 YENİ SERİ EKLENDİ!', payload.new);
        const newSeries = payload.new;

        if (!newsChannelId) return;
        const targetChannel = await client.channels.fetch(newsChannelId).catch(() => null);
        if (!targetChannel) return;

        const url = `https://mahorapeak.com.tr/manga/${newSeries.id}`;
        
        // Yeni seri için embed'i oluştur
        const embed = newSeriesRadarEmbed(
          newSeries.title, 
          newSeries.synopsis || newSeries.description || '', 
          newSeries.cover, 
          url
        );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('🚀 Seriyi İncele')
            .setStyle(ButtonStyle.Link)
            .setURL(url)
        );

        // Yeni seride everyone etiketlenebilir
        await targetChannel.send({ content: '@everyone', embeds: [embed], components: [row] });
      } catch (err) {
        console.error('[Haber Sistemi] Seri duyuru hatası:', err);
      }
    }
  );

  // BAĞLANTI DURUMU (Hata Toleransı)
  globalChannel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('[Haber Sistemi] 🟢 Haber kanalı aktif, veritabanı dinleniyor.');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('[Haber Sistemi] ❌ Kanal hatası:', err);
    }
  });

  return { supabase, globalChannel };
}
