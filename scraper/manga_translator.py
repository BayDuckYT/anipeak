import cv2
import easyocr
import numpy as np
from PIL import Image as PILImage, ImageDraw, ImageFont
import argparse

# ============================================================
# 🔥 ANIPEAK V21.0 DUAL-STRIKE - SEÇENEKLİ SİBER TAARRUZ
# ============================================================

def is_enemy_url(text):
    t = text.lower().strip()
    enemy_list = [".com", ".net", ".org", "http", "www", "mangadenizi", "manga", "deniz", "scan", "asura", "read"]
    return any(x in t for x in enemy_list)

class MangaEngine:
    def __init__(self, gpu=True):
        print("[V21.0] SİBER KOMUTA MERKEZİ AÇILDI AMK!")
        self.reader = easyocr.Reader(['en', 'tr'], gpu=gpu)

    def process(self, input_path, output_path, secenek):
        img = cv2.imread(input_path)
        if img is None: 
            print("Uyy! Resmi bulamadım amk!")
            return

        # 🚀 SEÇENEK 1: DİREKT YÜKLEME (EDİT İPTAL AMK!)
        if secenek == 1:
            print("[MOD-1] TEĞMENİN EMRİYLE EDİT İPTAL EDİLDİ! Orijinal dosya direkt kaydediliyor daa...")
            cv2.imwrite(output_path, img)
            print(f"[ZAFER] Dosya dokunulmadan kaydedildi: {output_path}")
            return

        # 🛡️ SEÇENEK 2: EFSANE EDİT MODU
        print("[MOD-2] Siber cerrahi operasyonu başlıyor daa...")
        img_h, img_w = img.shape[:2]
        results = self.reader.readtext(img, text_threshold=0.4)
        targets = []

        for (bbox, text, conf) in results:
            if is_enemy_url(text):
                x_min, y_min = int(min([p[0] for p in bbox])), int(min([p[1] for p in bbox]))
                x_max, y_max = int(max([p[0] for p in bbox])), int(max([p[1] for p in bbox]))
                
                # Güvenlik kilidi amk
                box_w = x_max - x_min
                box_h = y_max - y_min
                if (box_w * box_h) > (img_w * img_h) * 0.15:
                    continue
                targets.append((x_min, y_min, x_max, y_max))

        if not targets:
            cv2.imwrite(output_path, img)
            return

        # Edit işlemleri (Senin o sevdiğin V17.1 mantığı amk)
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        for (x1, y1, x2, y2) in targets:
            cv2.rectangle(mask, (max(0, x1-2), max(0, y1-2)), (min(img_w, x2+2), min(img_h, y2+2)), 255, -1)

        cleaned = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
        for (x1, y1, x2, y2) in targets:
            roi = cleaned[max(0, y1-2):min(img_h, y2+2), max(0, x1-2):min(img_w, x2+2)]
            if roi.size > 0:
                cleaned[max(0, y1-2):min(img_h, y2+2), max(0, x1-2):min(img_w, x2+2)] = cv2.medianBlur(roi, 5)

        pil_img = PILImage.fromarray(cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)).convert("RGBA")
        draw = ImageDraw.Draw(pil_img)
        my_text = "ANIPEAK.COM.TR"

        for (x1, y1, x2, y2) in targets:
            tw, th = x2 - x1, y2 - y1
            target_font_size = max(8, int(th * 0.8))
            try:
                font = ImageFont.truetype("arialbd.ttf", target_font_size)
            except:
                font = ImageFont.load_default()
            
            # Yazıyı oturtma ve çizme işlemleri amk...
            draw.text((x1, y1), my_text, font=font, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0, 255))

        final = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
        cv2.imwrite(output_path, final)
        print(f"[ZAFER] Editli dosya hazır amk! Çıktı: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--secenek", type=int, default=1, help="1: Direkt, 2: Editli amk")
    args = parser.parse_args()
    
    MangaEngine(gpu=True).process(args.input, args.output, args.secenek)