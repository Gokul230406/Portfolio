import cv2
import numpy as np
from PIL import Image
from pathlib import Path

BRAIN_DIR = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

BADGES = [
    {
        'id': 'leetcode-100-2026',
        'file': BRAIN_DIR / 'media__1786285965753.png',
        'box': (180, 410, 400, 635)
    },
    {
        'id': 'leetcode-50-2026',
        'file': BRAIN_DIR / 'media__1786285970057.png',
        'box': (180, 410, 400, 635)
    },
    {
        'id': 'leetcode-50-2025',
        'file': BRAIN_DIR / 'media__1786285974848.png',
        'box': (180, 410, 400, 635)
    }
]

def extract_badge_contour(img_path, box):
    img = Image.open(img_path).convert('RGB')
    cropped = img.crop(box)
    
    rgb = np.array(cropped)
    r, g, b = rgb[:,:,0].astype(float), rgb[:,:,1].astype(float), rgb[:,:,2].astype(float)
    
    # Distance from dark background (around rgb 35, 30, 29)
    dist = np.sqrt((r - 35)**2 + (g - 30)**2 + (b - 29)**2)
    
    # Binary mask of foreground badge elements
    fg_mask = (dist > 30).astype(np.uint8) * 255
    
    # Morphological close to bridge small gaps in outer rim
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_closed = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
    
    # Find largest contour (which is the badge hexagon)
    contours, _ = cv2.findContours(fg_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return cropped
        
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Create smooth alpha mask from largest contour
    h, w = rgb.shape[:2]
    badge_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(badge_mask, [largest_contour], -1, 255, thickness=cv2.FILLED)
    
    # Feather edge slightly for smooth anti-aliased transparency
    badge_mask_blur = cv2.GaussianBlur(badge_mask, (3, 3), 0)
    
    # Construct RGBA image
    rgba = np.dstack((rgb, badge_mask_blur))
    res = Image.fromarray(rgba, 'RGBA')
    
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

for b in BADGES:
    clean_thumb = extract_badge_contour(b['file'], b['box'])
    out_p = OUT_DIR / f"{b['id']}-thumb.png"
    clean_thumb.save(out_p)
    print(f"Saved contour-extracted {out_p.name} (size: {clean_thumb.size})")
