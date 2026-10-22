export const ERROR_DICTIONARY = {
  // 500 serisi: Sistem ve Tanımsız Hatalar
  "500": {
    name: "Bilinmeyen Sistem Hatası",
    description: "Sistem yakalanamayan genel bir hata ile karşılaştı.",
    solution: "Sayfayı yenileyerek (CTRL + F5 veya sayfayı aşağı çekme) sorunu çözmeyi deneyin. Sorun devam ederse tarayıcı önbelleğini temizleyin."
  },
  "501": {
    name: "Tanımsız Veri Hatası (Undefined Properties)",
    description: "Bir nesnenin veya dizinin var olmayan bir özelliğine erişilmeye çalışıldı. Genellikle veritabanından henüz yüklenmemiş bir veriye anında erişilmek istendiğinde yaşanır.",
    solution: "Sayfayı yenileyerek tekrar deneyin. Sorun devam ederse internet bağlantınızı kontrol edin."
  },

  // 400 serisi: Ağ ve İstemci Hataları
  "404": {
    name: "Kaynak Bulunamadı",
    description: "İstenen veri veya sayfa sunucuda bulunamadı veya silinmiş.",
    solution: "Adres çubuğundaki URL'nin doğru olduğundan emin olun. Ana sayfaya dönüp tekrar deneyin."
  },
  "405": {
    name: "Modül Yükleme Hatası (Chunk Load Error)",
    description: "Site güncellendiği için tarayıcı belleğindeki eski dosyaları arıyor ancak bulamıyor. Bu genellikle bir güncelleme sonrası yaşanır.",
    solution: "Sayfayı yenileyerek (CTRL + F5) tarayıcının yeni dosyaları çekmesi gerekir. Mobilde sayfayı aşağı çekerek yenileyin."
  },
  
  // Özel Hatalar
  "564": {
    name: "Beklenmeyen HTML Formatı (Unexpected token '<')",
    description: "Tarayıcı bir JavaScript dosyası indirmeye çalıştı ancak sunucu HTML sayfası döndürdü. Bu genellikle eski tarayıcı önbelleği veya sunucu yönlendirme eksikliklerinden kaynaklanır.",
    solution: "Sayfayı yenileyin. Mobilde tarayıcı önbelleğini temizlemeyi deneyin (Ayarlar > Geçmişi Temizle)."
  },
  "565": {
    name: "Sunucu Bağlantı Hatası",
    description: "Sunucuya bağlanılamadı, istek zaman aşımına uğradı veya sorgu reddedildi. İnternet bağlantınız kopmuş olabilir.",
    solution: "İnternet bağlantınızı kontrol edin ve sayfayı yenileyin. Wi-Fi veya mobil veri bağlantınızın aktif olduğundan emin olun."
  },
  "566": {
    name: "Bellek Yetersizliği (Out of Memory)",
    description: "Tarayıcı bu sayfayı render etmek için yeterli belleğe sahip değil. Bu genellikle çok fazla sekme açıkken veya eski cihazlarda yaşanır.",
    solution: "Kullanılmayan tarayıcı sekmelerini kapatın ve sayfayı yenileyin. Tarayıcı uygulamanızı tamamen kapatıp tekrar açmayı deneyin."
  },
  "567": {
    name: "Zaman Aşımı (Timeout)",
    description: "Sunucu yanıt vermekte çok uzun sürdü. Yavaş internet bağlantısı veya sunucu yoğunluğu buna sebep olabilir.",
    solution: "Birkaç saniye bekleyip sayfayı yenileyin. Sorun devam ederse farklı bir ağ bağlantısı deneyin."
  }
};

export function getErrorCode(errorMsg) {
  if (!errorMsg) return "500";
  
  let msg;
  try {
    msg = errorMsg.toString().toLowerCase();
  } catch (e) {
    return "500";
  }

  // Chunk/Module hataları
  if (msg.includes("failed to fetch dynamically imported module") || msg.includes("importing a module script failed") || msg.includes("loading chunk") || msg.includes("loading css chunk")) return "405";
  
  // HTML parse hatası
  if (msg.includes("unexpected token '<'") || msg.includes("unexpected token '<'")) return "564";
  
  // Undefined/Null erişim
  if (msg.includes("cannot read properties of undefined") || msg.includes("cannot read properties of null") || msg.includes("is not defined") || msg.includes("is not a function")) return "501";
  
  // Ağ/Supabase hataları
  if (msg.includes("supabase") || msg.includes("fetch failed") || msg.includes("network error") || msg.includes("networkerror") || msg.includes("failed to fetch") || msg.includes("net::err")) return "565";
  
  // Timeout
  if (msg.includes("timeout") || msg.includes("aborted") || msg.includes("timed out")) return "567";
  
  // Bellek
  if (msg.includes("out of memory") || msg.includes("allocation failed") || msg.includes("stack overflow")) return "566";
  
  // 404
  if (msg.includes("not found") || msg.includes("404")) return "404";

  return "500"; // Varsayılan
}
