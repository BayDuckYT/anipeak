import os
import json
import time
import re
import requests

# Yollar
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EFFECTS_PATH = os.path.join(BASE_DIR, 'src', 'data', 'effects.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'assets', 'decorations')
LOCAL_URL_PREFIX = '/assets/decorations/'

# İstenen Başlıklar (Headers)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def sanitize_filename(name):
    # Geçersiz karakterleri temizle ve boşlukları alt tire yap
    clean = re.sub(r'[<>:"/\\|?*]', '', name)
    clean = re.sub(r'\s+', '_', clean)
    return clean.strip()

def download_file(url, dest_path, retries=3):
    # Parametreleri temizle ve en yüksek boyutu talep et
    base_url = url.split('?')[0]
    
    # Cloudflare engellemesini asmak için cdn yerine media proxy kullan
    base_url = base_url.replace('cdn.discordapp.com', 'media.discordapp.net')
    
    clean_url = f"{base_url}?size=4096&passthrough=true"
    
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(clean_url, headers=HEADERS, timeout=15)
            response.raise_for_status()
            
            with open(dest_path, 'wb') as f:
                f.write(response.content)
            return True
        except requests.exceptions.RequestException as e:
            if attempt < retries:
                print(f"  [!] Hata: {e}, 3 saniye beklenip tekrar deneniyor ({retries - attempt} kaldi)...")
                time.sleep(3)
            else:
                raise Exception(f"Indirme basarisiz: {e}")

def main():
    print("\nMahoraPeak Discord Ganimet Harekatı Basliyor...\n")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Klasor olusturuldu: {OUTPUT_DIR}\n")

    with open(EFFECTS_PATH, 'r', encoding='utf-8') as f:
        effects = json.load(f)

    discord_effects = [e for e in effects if e.get('url') and 'cdn.discordapp.com' in e['url']]
    print(f"{len(discord_effects)} adet Discord dekorasyon bulundu.\n")

    success = 0
    failed = 0

    for idx, effect in enumerate(discord_effects, 1):
        label = effect.get('label') or effect.get('name') or effect.get('id')
        filename = f"{sanitize_filename(label)}.png"
        dest_path = os.path.join(OUTPUT_DIR, filename)
        local_url = f"{LOCAL_URL_PREFIX}{filename}"

        print(f"[{idx}/{len(discord_effects)}] {label}... ", end='', flush=True)

        if os.path.exists(dest_path):
            effect['url'] = local_url
            print("OK (Zaten mevcut)")
            success += 1
            continue

        try:
            download_file(effect['url'], dest_path)
            effect['url'] = local_url
            file_size_kb = os.path.getsize(dest_path) / 1024
            print(f"OK ({file_size_kb:.0f} KB)")
            success += 1
        except Exception as e:
            print(f"HATA: {e}")
            failed += 1

        # Discord rate limit koruması
        time.sleep(0.5)

    # Güncellenmiş JSON'u kaydet
    with open(EFFECTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(effects, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 50)
    print(f"Basarili: {success}")
    print(f"Basarisiz: {failed}")
    print(f"effects.json guncellendi.")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
