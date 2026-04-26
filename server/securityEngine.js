import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// DOMPurify setup for NodeJS
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * ANIPEAK INFINITY-GUARD
 * Otonom Siber Güvenlik Motoru
 */
export function setupSecurityEngine(app) {
    console.log(`\n\x1b[32m[INFINITY-GUARD] Siber Güvenlik Motoru Başlatılıyor...\x1b[0m`);

    // 1. HELMET - HTTP Header Zırhı
    // Sitenin clickjacking (X-Frame-Options) ve XSS açıklarını kapatır
    app.use(helmet({
        contentSecurityPolicy: false, // React/Vite için dev modunda kapalı tutmak iyidir, production'da spesifik açılabilir
        crossOriginEmbedderPolicy: false
    }));
    console.log(`\x1b[36m[INFINITY-GUARD] 🛡️ HTTP Kalkanları Aktif (Helmet).\x1b[0m`);

    // 2. CORS - Alan Adı Kısıtlaması (Whitelist)
    const whitelist = ['https://anipeak.com.tr', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
    app.use(cors({
        origin: function (origin, callback) {
            // Origin yoksa (server-to-server) veya whitelist içindeyse izin ver
            if (!origin || whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`\x1b[31m[INFINITY-GUARD] 🚨 Yetkisiz Erişim Engellendi: ${origin}\x1b[0m`);
                callback(new Error('Siber Kalkan: Bu alan adı izinsiz! (CORS Error)'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }));
    console.log(`\x1b[36m[INFINITY-GUARD] 🌐 CORS Sınır Güvenliği Aktif.\x1b[0m`);

    // 3. RATE LIMITING - DDoS ve Brute Force Koruması
    // Genel Limiter: Her IP için 15 dakikada 500 istek (Sessiz hayalet modu)
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 500,
        message: { error: 'Infinity-Guard: Çok fazla istek attınız. Lütfen biraz bekleyin.' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(generalLimiter);
    console.log(`\x1b[36m[INFINITY-GUARD] ⏱️ DDoS Koruma Kalkanı Aktif (Genel Limit).\x1b[0m`);

    // 4. NoSQL INJECTION KORUMASI
    // Req.body, req.query veya req.params içindeki '$' veya '.' içeren zararlı objeleri temizler
    app.use(mongoSanitize({
        replaceWith: '_'
    }));
    console.log(`\x1b[36m[INFINITY-GUARD] 💉 Injection Koruması Aktif (NoSQL/SQL).\x1b[0m`);

    // 5. OTONOM XSS TEMİZLEYİCİ MİDDLEWARE
    // Kullanıcıdan gelen tüm string verileri DOMPurify ile temizler
    app.use((req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            for (let key in req.body) {
                if (typeof req.body[key] === 'string') {
                    // Sadece string verileri sanitize et
                    req.body[key] = purify.sanitize(req.body[key]);
                }
            }
        }
        next();
    });
    console.log(`\x1b[36m[INFINITY-GUARD] 🧹 Otonom XSS Giriş Temizliği Aktif (DOMPurify).\x1b[0m`);

    console.log(`\x1b[32m[INFINITY-GUARD] ✅ Tüm Sistemler Operasyonel. Hayalet Modda Beklemede...\x1b[0m\n`);
}

// Özel endpointler için sert Brute-Force limitörü (Örn: Giriş, şifre sıfırlama vs)
export const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 10, // 15 dakikada 10 deneme
    message: { error: 'Infinity-Guard: Çok fazla başarısız deneme. IP adresiniz geçici olarak karantinaya alındı.' }
});
