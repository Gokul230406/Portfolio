import cv2
import numpy as np
from PIL import Image
from pathlib import Path

NEW_IMG_PATH = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1\media__1786286510384.jpg')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

def get_exact_100_badge(img_path):
    img = Image.open(img_path).convert('RGB')
    
    # Crop central region (around 100 days badge)
    crop_box = (160, 385, 415, 650)
    cropped = img.crop(crop_box)
    
    rgb = np.array(cropped)
    h, w = rgb.shape[:2]
    
    # Let's inspect the silver rim by detecting pixels where silver rim exists
    # Silver rim is bright (R,G,B > 90) and low saturation
    r, g, b = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
    is_silver = (r > 90) & (g > 90) & (b > 90) & (np.abs(r.astype(int) - g.astype(int)) < 25) & (np.abs(g.astype(int) - b.astype(int)) < 25)
    
    # Also include blue 100 DAYS interior fill
    is_blue = (b.astype(int) > r.astype(int) + 15) & (b.astype(int) > g.astype(int))
    
    # Combined badge indicator mask
    fg_indic = (is_silver | is_blue).astype(np.uint8) * 255
    
    # Convex hull of the silver rim + blue fill
    contours, _ = cv2.findContours(fg_indic, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return cropped
        
    largest = max(contours, key=cv2.contourArea)
    hull = cv2.convexHull(largest)
    
    # Approximate hull with a 6-sided polygon (hexagon)
    peri = cv2.arcLength(hull, True)
    approx = cv2.approxPolyDP(hull, 0.02 * peri, True)
    
    # If approx has more or less than 6 vertices, smooth polygon mask
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(mask, [approx if len(approx) == 6 else hull], -1, 255, thickness=cv2.FILLED)
    
    # Erode mask slightly (1-2px) to ensure no outer background line bleeds through
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.erode(mask, kernel, iterations=1)
    
    # Anti-alias feathering
    alpha = cv2.GaussianBlur(mask, (3, 3), 0)
    
    rgba = np.dstack((rgb, alpha))
    res = Image.fromarray(rgba, 'RGBA')
    
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

badge_res = get_exact_100_badge(NEW_IMG_PATH)
thumb_p = OUT_DIR / 'leetcode-100-2026-thumb.png'
full_p = OUT_DIR / 'leetcode-100-2026-full.png'

badge_res.save(thumb_p)
badge_res.save(full_p)
print(f"Saved precise 100 days badge: {thumb_p.name} (size: {badge_res.size})")
