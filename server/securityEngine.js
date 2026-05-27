import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// DOMPurify — NodeJS ortamında XSS temizleyici
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * ═══════════════════════════════════════════════════════════════
 * MAHORAPEAK INFINITY-GUARD v4.0 — Kurumsal Siber Güvenlik Motoru
 * Katmanlar: Helmet CSP | CORS Whitelist | Rate-Limit | 
 *            NoSQL Injection | XSS Sanitizer | Fingerprint Hide |
 *            Request Size Limit | Proxy SSRF Guard
 * ═══════════════════════════════════════════════════════════════
 */
export function setupSecurityEngine(app) {
    console.log(`\n\x1b[32m[INFINITY-GUARD v4.0] Kurumsal Siber Güvenlik Motoru Başlatılıyor...\x1b[0m`);

    // ─── 1. HELMET — Kapsamlı HTTP Güvenlik Başlıkları ────────────────────────
    // Clickjacking, MIME Sniffing, XSS, Referrer Sızıntısı engellenir.
    app.use(helmet({
        // Content Security Policy — Sadece güvenilir kaynaklardan içerik gelsin
        contentSecurityPolicy: {
            directives: {
                defaultSrc:     ["'self'"],
                scriptSrc:      ["'self'", "'unsafe-inline'",
                                 "https://fonts.googleapis.com",
                                 "https://static.cloudflareinsights.com"],
                styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc:        ["'self'", "https://fonts.gstatic.com"],
                imgSrc:         ["'self'", "data:", "blob:", "https:", "http:"],
                connectSrc:     ["'self'",
                                 "https://*.supabase.co",
                                 "https://wsrv.nl",
                                 "wss://*.supabase.co"],
                mediaSrc:       ["'self'", "blob:"],
                frameSrc:       ["'none'"],
                objectSrc:      ["'none'"],
                baseUri:        ["'self'"],
                formAction:     ["'self'"],
                // HTTPS Zorunlu (HSTS) — Tarayıcı HTTP'yi reddeder
                upgradeInsecureRequests: [],
            },
        },
        // X-Frame-Options: Başka siteler sitemizi iframe içinde gösteremesin (Clickjacking)
        frameguard:                 { action: 'deny' },
        // X-Content-Type-Options: MIME sniffing açığı kapatıldı
        noSniff:                    true,
        // Referrer Policy: Harici linklere URL bilgisi sızdırma
        referrerPolicy:             { policy: 'strict-origin-when-cross-origin' },
        // HSTS: 2 yıl boyunca HTTPS zorunlu tut
        hsts: {
            maxAge:             63072000,
            includeSubDomains:  true,
            preload:            true,
        },
        // Güç Gizleme: "X-Powered-By: Express" headerını kaldır
        hidePoweredBy:              true,
        // XSS Filter (Legacy tarayıcılar için)
        xssFilter:                  true,
        // DNS Prefetch Control
        dnsPrefetchControl:         { allow: false },
        crossOriginEmbedderPolicy:  false, // Supabase için gerekli
        crossOriginResourcePolicy:  { policy: 'cross-origin' }, // Medya dosyaları için
    }));

    // "Server" ve "X-Powered-By" başlıklarını tamamen temizle (HAYALET GEMİ MODU)
    app.use((req, res, next) => {
        res.removeHeader('Server');
        res.removeHeader('X-Powered-By');
        res.setHeader('X-Powered-By', 'Invisible-Guard');
        res.setHeader('Server', 'MahoraPeak Infinity Guard');
        res.setHeader('X-AspNet-Version', 'Hidden');
        res.setHeader('X-AspNetMvc-Version', 'Hidden');
        // Önbellek kontrolü — API yanıtları önbelleğe alınmasın
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        next();
    });
    console.log(`\x1b[36m[INFINITY-GUARD] 🛡️ HTTP Kalkanları AKTİF (Helmet CSP + HSTS + Anti-Fingerprint).\x1b[0m`);

    // ─── 1.5. ÇEREZ ZIRHI (Insecure Cookie Koruması) ─────────────────────────
    app.use((req, res, next) => {
        const originalCookie = res.cookie;
        res.cookie = function (name, value, options = {}) {
            options.httpOnly = true;
            options.secure = true;
            options.sameSite = 'Strict';
            return originalCookie.call(this, name, value, options);
        };
        next();
    });
    console.log(`\x1b[36m[INFINITY-GUARD] 🍪 Çerez (Cookie) Zırhı AKTİF (Secure + HttpOnly + SameSite=Strict).\x1b[0m`);

    // ─── 2. CORS — Alan Adı Kısıtlaması (Beyaz Liste) ─────────────────────────
    const whitelist = [
        'https://mahorapeak.com.tr',
        'https://www.mahorapeak.com.tr',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
    ];
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || whitelist.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`\x1b[31m[INFINITY-GUARD] 🚨 YETKİSİZ ERİŞİM ENGELLENDİ: ${origin}\x1b[0m`);
                callback(new Error('Infinity-Guard: Bu alan adı yetkisiz! (CORS)'));
            }
        },
        methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials:    true,
        maxAge:         86400, // OPTIONS preflight 24 saat önbellekte kalsın
    }));
    console.log(`\x1b[36m[INFINITY-GUARD] 🌐 CORS Sınır Güvenliği AKTİF (Whitelist).\x1b[0m`);

    // ─── 3. REQUEST SIZE LIMIT — Büyük Yük Saldırısı Engeli ──────────────────
    // Biri 100MB'lık JSON atarak sunucuyu çökertmeye çalışamasın
    app.use(express_json_size_guard());
    console.log(`\x1b[36m[INFINITY-GUARD] 📦 İstek Boyutu Limiti AKTİF (10MB Max).\x1b[0m`);

    // ─── 4. RATE LIMITING — DDoS ve Kaba Kuvvet Koruması ─────────────────────
    const generalLimiter = rateLimit({
        windowMs:       15 * 60 * 1000, // 15 dakika
        max:            300,             // IP başına max 300 istek
        standardHeaders:'draft-7',
        legacyHeaders:  false,
        message:        { error: '🛡️ Infinity-Guard: Çok fazla istek. Lütfen bekleyin.' },
        // Her IP için ayrı sayaç (Proxy arkasında bile doğru IP)
        keyGenerator:   (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
        skip:           (req) => req.path === '/health', // Health check'i sayma
    });
    app.use('/api', generalLimiter);
    console.log(`\x1b[36m[INFINITY-GUARD] ⏱️ DDoS Kalkanı AKTİF (15dk/300 istek).\x1b[0m`);

    // ─── 5. NoSQL INJECTION KORUMASI ──────────────────────────────────────────
    app.use(mongoSanitize({ replaceWith: '_', onSanitize: ({ key }) => {
        console.warn(`\x1b[31m[INFINITY-GUARD] 💉 Injection Girişimi Bloke Edildi! Alan: ${key}\x1b[0m`);
    }}));
    console.log(`\x1b[36m[INFINITY-GUARD] 💉 NoSQL Injection Koruması AKTİF.\x1b[0m`);

    // ─── 6. OTONOM XSS TEMİZLEYİCİ ───────────────────────────────────────────
    // Kullanıcıdan gelen tüm string alanları DOMPurify ile sterilize et
    app.use((req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            const sanitizeDeep = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = purify.sanitize(obj[key]);
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeDeep(obj[key]); // İç içe objeler için recursive
                    }
                }
            };
            sanitizeDeep(req.body);
        }
        next();
    });
    console.log(`\x1b[36m[INFINITY-GUARD] 🧹 Otonom XSS Sterilizasyonu AKTİF (DOMPurify Recursive).\x1b[0m`);

    // ─── 7. SSRF KORUMASI — Proxy Endpoint İçin ───────────────────────────────
    // Proxy üzerinden iç ağa veya zararlı servislere istek atılmasın
    app.use('/api/proxy', (req, res, next) => {
        const targetUrl = req.query.url;
        if (!targetUrl) return next();
        
        try {
            const parsed = new URL(targetUrl);
            const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254'];
            if (blockedHosts.some(h => parsed.hostname.includes(h))) {
                console.warn(`[INFINITY-GUARD] 🚨 SSRF Girişimi Engellendi: ${targetUrl}`);
                return res.status(403).json({ error: 'Yasak hedef.' });
            }
            // Sadece HTTP/HTTPS izni
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return res.status(403).json({ error: 'Geçersiz protokol.' });
            }
        } catch {
            return res.status(400).json({ error: 'Geçersiz URL.' });
        }
        next();
    });
    console.log(`\x1b[36m[INFINITY-GUARD] 🔒 SSRF Koruması AKTİF (Proxy Güvenliği).\x1b[0m`);

    // ─── 8. SAĞLIK KONTROLÜ Endpoint ──────────────────────────────────────────
    // Monitoring araçları için güvenli health check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'operational', timestamp: Date.now() });
    });

    console.log(`\x1b[32m[INFINITY-GUARD v4.0] ✅ 8 Katman Operasyonel. Hayalet Mod AKTİF.\x1b[0m\n`);
}

// Yardımcı: İstek boyutu limit middleware'i
function express_json_size_guard() {
    return (req, res, next) => {
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > 10 * 1024 * 1024) { // 10MB limit
                console.warn(`[INFINITY-GUARD] 📦 Aşırı Büyük İstek Engellendi: ${size} bytes`);
                res.status(413).json({ error: 'İstek çok büyük.' });
                req.destroy();
            }
        });
        next();
    };
}

// Özel endpointler için sert Brute-Force limitörü
// Kullanım: app.post('/api/auth/login', strictAuthLimiter, handler)
export const strictAuthLimiter = rateLimit({
    windowMs:       15 * 60 * 1000, // 15 dakika
    max:            5,               // 5 deneme hakkı
    skipSuccessfulRequests: true,    // Başarılı girişleri sayma
    message:        {
        error: '🛡️ Infinity-Guard: Çok fazla başarısız giriş. IP adresiniz 15 dakika karantinaya alındı.'
    },
    keyGenerator:   (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});
