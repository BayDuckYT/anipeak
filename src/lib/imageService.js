/**
 * ANİPEAK PROFİL YÖNETİMİ - İmaj Servisi
 * Avatar yönetimi ve yükleme işlemleri.
 */

const LOCAL_UPLOAD_URL = `http://localhost:3001/api/admin/upload-avatar`;

export const DEFAULT_AVATARS = [
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/saitama.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/gojo.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/luffy.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/zoro.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/mikasa.webp'
];

/**
 * Dosyayı sunucuya yükler.
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch(LOCAL_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.url; // /avatars/uploads/filename.webp döner
  } catch (error) {
    console.error('[IMAGE-SERVICE] Yükleme Hatası:', error);
    return null;
  }
};

/**
 * Rastgele bir varsayılan avatar döner.
 */
export const getRandomDefaultAvatar = () => {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
};
