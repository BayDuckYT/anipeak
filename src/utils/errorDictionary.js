export const ERROR_DICTIONARY = {
  // 500 serisi: Sistem ve Tanımsız Hatalar
  "500": {
    name: "Bilinmeyen Sistem Hatası",
    description: "Sistem yakalanamayan genel bir hata ile karşılaştı.",
    solution: "Konsol (F12) loglarını kontrol edin ve hatanın kaynağını bulun."
  },
  "501": {
    name: "Tanımsız Veri Hatası (Undefined Properties)",
    description: "Bir nesnenin veya dizinin var olmayan bir özelliğine erişilmeye çalışıldı. Genellikle veritabanından henüz yüklenmemiş bir veriye anında erişilmek istendiğinde yaşanır.",
    solution: "Verinin yüklenip yüklenmediğini kontrol edin (Örn: `user.id` yerine `user?.id` şeklinde güvenli erişim kullanın)."
  },

  // 400 serisi: Ağ ve İstemci Hataları
  "404": {
    name: "Kaynak Bulunamadı",
    description: "İstenen veri veya sayfa sunucuda bulunamadı veya silinmiş.",
    solution: "İlgili verinin veritabanında veya sunucuda hâlâ mevcut olduğundan emin olun."
  },
  "405": {
    name: "Modül Yükleme Hatası (Chunk Load Error)",
    description: "Site güncellendiği için tarayıcı belleğindeki eski JS/CSS dosyalarını arıyor ancak bulamıyor.",
    solution: "Sayfayı yenileyerek (CTRL + F5) tarayıcının yeni dosyaları çekmesi gerekir. Sistem bunu genelde otomatik yapar."
  },
  
  // Özel Hatalar
  "564": {
    name: "Beklenmeyen HTML Formatı (Unexpected token '<')",
    description: "Tarayıcı bir JavaScript dosyası indirmeye çalıştı ancak sunucu 404 sayfasına (HTML) düştüğü için geri HTML kodu döndü. Bu genellikle eski tarayıcı önbelleği veya Vercel/Netlify yönlendirme eksikliklerinden kaynaklanır.",
    solution: "Kullanıcının sayfayı yenilemesi yeterlidir. Hata genel ise, sunucudaki (Vercel/Netlify) 'Rewrite/Redirect' ayarlarının doğru yapıldığından emin olun."
  },
  "565": {
    name: "Supabase / Veritabanı Bağlantı Hatası",
    description: "Supabase sunucularına bağlanılamadı, istek zaman aşımına uğradı veya sorgu reddedildi.",
    solution: "İnternet bağlantısını, Supabase RLS kurallarını ve `.env` dosyasındaki API anahtarlarını kontrol edin."
  }
};

export function getErrorCode(errorMsg) {
  if (!errorMsg) return "500";
  const msg = errorMsg.toString().toLowerCase();

  if (msg.includes("unexpected token '<'")) return "564";
  if (msg.includes("failed to fetch dynamically imported module") || msg.includes("importing a module script failed")) return "405";
  if (msg.includes("cannot read properties of undefined") || msg.includes("is not defined")) return "501";
  if (msg.includes("supabase") || msg.includes("fetch failed") || msg.includes("network error")) return "565";
  if (msg.includes("not found") || msg.includes("404")) return "404";

  return "500"; // Varsayılan
}
