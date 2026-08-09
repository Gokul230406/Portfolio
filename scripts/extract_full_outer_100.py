import cv2
import numpy as np
from PIL import Image
from pathlib import Path

NEW_IMG_PATH = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1\media__1786286510384.jpg')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

def extract_full_outer_badge(img_path):
    img = Image.open(img_path).convert('RGB')
    
    # Crop box around outer metallic hexagon badge
    crop_x1, crop_y1 = 155, 380
    crop_x2, crop_y2 = 420, 660
    cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    rgb = np.array(cropped)
    h, w = rgb.shape[:2]
    
    # 6 vertices of the outer metallic hexagon relative to crop box
    # Absolute in 574x1024: (287,388), (410,459), (410,599), (287,652), (164,599), (164,459)
    poly_pts = np.array([
        [287 - crop_x1, 388 - crop_y1], # Top
        [410 - crop_x1, 459 - crop_y1], # Top-Right
        [410 - crop_x1, 599 - crop_y1], # Bottom-Right
        [287 - crop_x1, 652 - crop_y1], # Bottom
        [164 - crop_x1, 599 - crop_y1], # Bottom-Left
        [164 - crop_x1, 459 - crop_y1]  # Top-Left
    ], dtype=np.int32)
    
    # Create mask of the outer metallic hexagon
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(mask, [poly_pts], 255)
    
    # Erode by 1px to avoid any subpixel edge bleeding from background
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.erode(mask, kernel, iterations=1)
    
    # Feather anti-aliasing
    alpha = cv2.GaussianBlur(mask, (3, 3), 0)
    
    rgba = np.dstack((rgb, alpha))
    res = Image.fromarray(rgba, 'RGBA')
    
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

full_badge = extract_full_outer_badge(NEW_IMG_PATH)
thumb_p = OUT_DIR / 'leetcode-100-2026-thumb.png'
full_p = OUT_DIR / 'leetcode-100-2026-full.png'

full_badge.save(thumb_p)
full_badge.save(full_p)
print(f"Saved full centered 100 days badge: {thumb_p.name} (size: {full_badge.size})")
