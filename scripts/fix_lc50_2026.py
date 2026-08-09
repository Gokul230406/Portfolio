import cv2
import numpy as np
from PIL import Image
from pathlib import Path

BRAIN_DIR = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

lc50_2026_src = BRAIN_DIR / 'media__1786289672552.jpg'

def extract_lc50_2026_flawless(img_path):
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # FloodFill pure black background from 4 corners
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)]
    for seed in seeds:
        cv2.floodFill(bgr, mask, seed, (0, 0, 0), (12, 12, 12), (12, 12, 12), cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        
    bg = (mask[1:-1, 1:-1] == 255)
    fg = (~bg).astype(np.uint8) * 255
    
    contours, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        hull = cv2.convexHull(largest)
        poly_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(poly_mask, [hull], -1, 255, thickness=cv2.FILLED)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        poly_mask = cv2.erode(poly_mask, kernel, iterations=1)
        alpha = cv2.GaussianBlur(poly_mask, (3, 3), 0)
    else:
        alpha = fg
        
    rgba = np.dstack((arr, alpha))
    res = Image.fromarray(rgba, 'RGBA')
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

def create_uniform_square_badge(cropped_rgba, target_size=512, inner_size=440):
    w, h = cropped_rgba.size
    scale = inner_size / max(w, h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    
    resized = cropped_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    offset_x = (target_size - new_w) // 2
    offset_y = (target_size - new_h) // 2
    
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas

cropped_lc50_2026 = extract_lc50_2026_flawless(lc50_2026_src)
uniform_lc50_2026 = create_uniform_square_badge(cropped_lc50_2026)

uniform_lc50_2026.save(OUT_DIR / 'leetcode-50-2026-thumb.png')
uniform_lc50_2026.save(OUT_DIR / 'leetcode-50-2026-full.png')
print("Saved flawless LC 50 2026 uniform badge!")
