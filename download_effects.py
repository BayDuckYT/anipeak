import json
import os
import urllib.request
import urllib.parse
import time
import ssl
import random

# SIBER BALYOZ V5 (ULTIMATE RESILIENCE)
# Rate-limit korumalı, otomatik retry mekanizmalı ve yavaş indirme moduna sahip sürüm.

# AYARLAR
SOURCE_JSON = 'src/data/effects_original_utf8.json'
TARGET_JSON = 'src/data/effects.json'
SAVE_DIR = 'public/avatar-efekts'
MIN_ANIMATION_SIZE = 25000  # 25KB

# SSL Sertifika Hatalarını Devre Dışı Bırak
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_file_size(filepath):
    if os.path.exists(filepath):
        return os.path.getsize(filepath)
    return 0

def download_with_retry(url, label, retries=3, delay=5):
    headers = {
        'User-Agent': random.choice([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ]),
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://discord.com/',
    }

    for i in range(retries):
        try:
            # Önce doğrudan dene
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
                return response.read()
        except Exception as e:
            print(f"Direct attempt {i+1} failed for {label}: {e}")
            
            # Proxy dene
            try:
                proxy_url = f"https://corsproxy.io/?{urllib.parse.quote(url)}"
                req = urllib.request.Request(proxy_url, headers=headers)
                with urllib.request.urlopen(req, timeout=20, context=ctx) as response:
                    return response.read()
            except Exception as pe:
                print(f"Proxy attempt {i+1} failed for {label}: {pe}")
            
            if i < retries - 1:
                wait = delay * (i + 1) + random.uniform(1, 3)
                print(f"Waiting {wait:.1f}s before retry...")
                time.sleep(wait)
    
    raise Exception(f"Failed to download {label} after {retries} retries.")

def download_file(item):
    effect_id = item.get('id')
    url = item.get('url')
    label = item.get('label') or item.get('name')
    
    if not url or not effect_id:
        return item

    # Discord CDN URL ise parametreleri ekle
    if 'discordapp.com' in url:
        if 'passthrough=true' not in url:
            url += ('&' if '?' in url else '?') + 'passthrough=true'
        if 'size=' not in url:
            url += '&size=240'

    # Uzantıyı URL'den veya link yapısından çıkar
    clean_url = url.split('?')[0]
    ext = os.path.splitext(clean_url)[1]
    if not ext or len(ext) > 5:
        ext = '.png'
    
    filename = f"{effect_id}{ext}"
    filepath = os.path.join(SAVE_DIR, filename)
    current_size = get_file_size(filepath)
    
    # Bayraklar ve büyük dosyalar için kontrol
    if current_size > MIN_ANIMATION_SIZE:
        # print(f"Skipping: {label}")
        item['url'] = f"/avatar-efekts/{filename}"
        return item

    try:
        print(f"Syncing: {label}...")
        content = download_with_retry(url, label)
        
        with open(filepath, 'wb') as f:
            f.write(content)
            
        print(f"Success: {label} ({len(content)/1024:.1f}KB)")
        item['url'] = f"/avatar-efekts/{filename}"
        return item
    except Exception as e:
        print(f"Error: {label} - {e}")
        return item

def main():
    if not os.path.exists(SAVE_DIR):
        os.makedirs(SAVE_DIR)

    try:
        with open(SOURCE_JSON, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except Exception as e:
        print(f"JSON Read Error: {e}")
        return

    print(f"SIBER BALYOZ V5 (Ultimate Resilience) Started for {len(data)} assets...")
    
    updated_data = []
    total = len(data)
    
    # Daha yavaş indirme (Daha az bloklanma)
    for i, item in enumerate(data):
        updated_item = download_file(item)
        updated_data.append(updated_item)
        
        if i % 10 == 0 or i == total - 1:
            with open(TARGET_JSON, 'w', encoding='utf-8') as f:
                json.dump(updated_data + data[i+1:] if i < total - 1 else updated_data, f, indent=2, ensure_ascii=False)
            print(f"Progress: {i+1}/{total}")
        
        # Her indirmeden sonra küçük bir mola
        time.sleep(random.uniform(0.5, 1.5))

    print("\nSIBER ANIMATION SYNC COMPLETED!")

if __name__ == "__main__":
    main()
