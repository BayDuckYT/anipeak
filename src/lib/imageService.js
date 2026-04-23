/**
 * ANİPEAK PROFİL YÖNETİMİ - İmaj Servisi
 * Supabase Storage üzerinden avatar yükleme.
 * Artık localhost'a bağımlılık YOK — canlı sitede de çalışır.
 */

import { supabase } from './supabaseClient';

export const DEFAULT_AVATARS = [
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/saitama.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/gojo.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/luffy.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/zoro.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/mikasa.webp'
];

/**
 * Avatarı Supabase Storage'a yükler ve public URL döndürür.
 * @param {Blob|File} file - Yüklenecek dosya
 * @returns {string|null} - Public URL veya null
 */
export const uploadAvatar = async (file) => {
  console.log("🚀 [IMAGE-SERVICE] Supabase Storage'a yükleme başlatıldı...");

  try {
    // Kullanıcı oturumunu al
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ [IMAGE-SERVICE] Kullanıcı oturumu bulunamadı.");
      alert("Avatar yüklemek için giriş yapmış olmalısınız.");
      return null;
    }

    const userId = user.id;
    const fileName = `avatar_${Date.now()}.webp`;
    // Yol: {userId}/{dosya} — Supabase folder-based policy bunu bekler
    const filePath = `${userId}/${fileName}`;

    // Eski avatarı silmeye çalış (hata verse de devam et)
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);
      
      if (existingFiles && existingFiles.length > 0) {
        const oldFiles = existingFiles.map(f => `${userId}/${f.name}`);
        if (oldFiles.length > 0) {
          await supabase.storage.from('avatars').remove(oldFiles);
          console.log("🗑️ [IMAGE-SERVICE] Eski avatar silindi.");
        }
      }
    } catch (e) {
      // Eski avatar silinemezse sorun değil, devam et
    }

    // Yeni avatarı yükle
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("❌ [IMAGE-SERVICE] Yükleme hatası:", uploadError.message);
      
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        alert("Supabase'de 'avatars' bucket'ı bulunamadı. Lütfen Supabase Dashboard > Storage bölümünden 'avatars' adında public bir bucket oluşturun.");
      } else if (uploadError.message.includes('security') || uploadError.message.includes('policy')) {
        alert("Supabase Storage erişim izni hatası. Lütfen 'avatars' bucket'ının public olduğundan ve RLS politikalarının doğru ayarlandığından emin olun.");
      } else {
        alert(`Avatar yüklenemedi: ${uploadError.message}`);
      }
      return null;
    }

    // Public URL al
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const url = publicUrlData?.publicUrl;
    console.log("✅ [IMAGE-SERVICE] Yükleme başarılı, URL:", url);
    return url;
  } catch (error) {
    console.error('❌ [IMAGE-SERVICE] Kritik Hata:', error.message);
    alert(`Avatar yüklenirken bir hata oluştu: ${error.message}`);
    return null;
  }
};

/**
 * Rastgele bir varsayılan avatar döner.
 */
export const getRandomDefaultAvatar = () => {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
};
