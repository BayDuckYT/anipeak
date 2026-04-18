import cv2
import numpy as np
from PIL import Image as PILImage
import argparse
import os
import shutil
import easyocr

# ============================================================
# 🔥 ANIPEAK V6.6 HYBRID MOTOR - TEMPLATE + OCR
# ============================================================

def contains_turkish(text):
    tr_chars = "ğüşİöçĞÜŞİÖÇ"
    return any(c in text for c in tr_chars)

def is_dialogue(text):
    if len(text.split()) > 3: return True
    if contains_turkish(text): return True
    return False

def is_url(text):
    t = text.lower().strip()
    if is_dialogue(text): return False
    keywords = [".com", ".net", ".org", ".tr", "www", "http", ".site", ".xyz"]
    return any(k in t for k in keywords)

class MangaEngine:
    def __init__(self, gpu=True):
        print("[ENGINE] V6.6 HYBRID (TEMPLATE + OCR + DIALOGUE GUARD)")
        self.reader = easyocr.Reader(['tr', 'en'], gpu=gpu)
        
        # Sancak & Template Yükleme
        self.seal_path = os.path.join(os.path.dirname(__file__), "seal.png")
        self.logo_path = os.path.join(os.path.dirname(__file__), "md_logo.png")
        
        self.seal = PILImage.open(self.seal_path).convert("RGBA") if os.path.exists(self.seal_path) else None
        
        if os.path.exists(self.logo_path):
            logo = cv2.imread(self.logo_path, 0)
            self.logo_template = cv2.Canny(logo, 50, 150)
        else:
            self.logo_template = None
            print("[WARNING] md_logo.png bulunamadı, Template Matching pasif!")

    def find_logo_by_template(self, edges):
        if self.logo_template is None: return None
        best_val = 0
        best_box = None

        for scale in np.linspace(0.4, 1.8, 15):
            resized = cv2.resize(self.logo_template, None, fx=scale, fy=scale)
            if resized.shape[0] > edges.shape[0] or resized.shape[1] > edges.shape[1]: continue

            res = cv2.matchTemplate(edges, resized, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, max_loc = cv2.minMaxLoc(res)

            if max_val > best_val:
                best_val = max_val
                x, y = max_loc
                w, h = resized.shape[::-1]
                best_box = (x, y, x+w, y+h)

        if best_val > 0.22:
            return best_box
        return None

    def process(self, input_path, output_path):
        img = cv2.imread(input_path)
        if img is None: return
        h, w = img.shape[:2]

        # 1. TEMPLATE MATCHING (MD Logosu İçin)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        template_box = self.find_logo_by_template(edges)

        # 2. OCR (URL'ler ve Diğer Reklamlar İçin)
        enhanced = cv2.equalizeHist(gray)
        results = self.reader.readtext(enhanced, paragraph=False)

        targets = []
        
        # OCR Sonuçlarını Filtrele
        for (bbox, text, conf) in results:
            if conf < 0.35: continue
            if is_url(text):
                x_min = int(min(p[0] for p in bbox))
                y_min = int(min(p[1] for p in bbox))
                x_max = int(max(p[0] for p in bbox))
                y_max = int(max(p[1] for p in bbox))
                targets.append((x_min, y_min, x_max, y_max, "url"))

        # Template Box Ekle
        if template_box:
            targets.append((template_box[0], template_box[1], template_box[2], template_box[3], "logo"))

        if not targets:
            shutil.copy(input_path, output_path)
            return

        # 🧼 MASK & INPAINT (NS)
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        for (x1, y1, x2, y2, ttype) in targets:
            # Padding
            pad = 10 if ttype == "url" else 20
            px1, py1 = max(0, x1-pad), max(0, y1-pad)
            px2, py2 = min(w, x2+pad), min(h, y2+pad)
            cv2.rectangle(mask, (px1, py1), (px2, py2), 255, -1)

        cleaned = cv2.inpaint(img, mask, 3, cv2.INPAINT_NS)
        pil_img = PILImage.fromarray(cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)).convert("RGBA")

        # 🎨 YERLEŞTİRME
        if self.seal:
            for (x1, y1, x2, y2, ttype) in targets:
                bw, bh = x2 - x1, y2 - y1
                scale = 1.1 if ttype == "url" else 1.3
                new_w = int(bw * scale)
                new_h = int(self.seal.height * (new_w / self.seal.width))

                resized_seal = self.seal.resize((new_w, new_h), PILImage.LANCZOS)
                
                # Merkezleme
                offset_x = x1 + (bw - new_w) // 2
                offset_y = y1 + (bh - new_h) // 2
                
                # Sınır Fix
                offset_x = max(0, min(offset_x, w - new_w))
                offset_y = max(0, min(offset_y, h - new_h))

                pil_img.alpha_composite(resized_seal, (offset_x, offset_y))

        final = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
        cv2.imwrite(output_path, final)
        print(f"[V6.6-SUCCESS] -> {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    MangaEngine(gpu=True).process(args.input, args.output)