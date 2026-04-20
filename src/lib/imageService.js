/**
 * ANIPEAK SİBER LOJİSTİK - İmaj Servisi V1
 * Cloudinary entegrasyonu ve avatar yönetimi.
 */

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/dzy8zvxky/image/upload`; // Varsayılan Cloud Name
const UPLOAD_PRESET = 'anipeak_avatars'; // Cloudinary'de 'Unsigned' olmalı

export const DEFAULT_AVATARS = [
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/saitama.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/gojo.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/luffy.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/zoro.webp',
  'https://res.cloudinary.com/dzy8zvxky/image/upload/v1713645000/avatars/mikasa.webp'
];

/**
 * Dosyayı WebP formatına dönüştürür ve kare olarak kırpar (Canvas kullanarak).
 */
export const processImage = async (file, size = 512) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Kare kırpma hesaplama (Center Crop)
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        
        // WebP olarak çıktı al (Sıkıştırma: 0.8)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/webp', 0.8);
      };
    };
  });
};

/**
 * Cloudinary'ye imaj yükler.
 */
export const uploadToCloudinary = async (blob) => {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
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
