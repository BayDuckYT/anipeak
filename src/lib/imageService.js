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
    const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : (file.type.split('/')[1] || 'webp');
    const fileName = `avatar_${Date.now()}.${fileExt}`;
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
        contentType: file.type || `image/${fileExt}`,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("❌ [IMAGE-SERVICE] Yükleme hatası:", uploadError);
      console.error("❌ [IMAGE-SERVICE] Hata detayı:", JSON.stringify(uploadError, null, 2));
      console.error("❌ [IMAGE-SERVICE] Status:", uploadError.statusCode, "Message:", uploadError.message, "Error:", uploadError.error);
      alert(`Avatar yüklenemedi!\n\nHata: ${uploadError.message}\nStatus: ${uploadError.statusCode || 'N/A'}\nDetay: ${uploadError.error || 'N/A'}\n\nYol: ${filePath}`);
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
