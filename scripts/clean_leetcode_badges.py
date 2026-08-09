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
        # Crop tight around central badge (X: 180..400, Y: 410..635)
        'box': (170, 405, 410, 640)
    },
    {
        'id': 'leetcode-50-2026',
        'file': BRAIN_DIR / 'media__1786285970057.png',
        'box': (170, 405, 410, 640)
    },
    {
        'id': 'leetcode-50-2025',
        'file': BRAIN_DIR / 'media__1786285974848.png',
        'box': (170, 405, 410, 640)
    }
]

def clean_leetcode_badge(img_path, box):
    img = Image.open(img_path).convert('RGB')
    cropped = img.crop(box)
    
    # Convert to OpenCV format (BGR)
    bgr = cv2.cvtColor(np.array(cropped), cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    
    # Create mask for floodFill (must be 2 pixels wider & taller)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # FloodFill from all 4 corners and along borders with diff tolerance
    # Dark background color tolerance
    lo_diff = (22, 22, 22)
    up_diff = (22, 22, 22)
    
    # Seed points along borders
    seeds = []
    for x in range(0, w, 5):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, 5):
        seeds.append((0, y))
        seeds.append((w - 1, y))
        
    for seed in seeds:
        cv2.floodFill(bgr, mask, seed, (0, 0, 0), lo_diff, up_diff, cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        
    # Mask values where background was filled will be 255
    bg_filled = (mask[1:-1, 1:-1] == 255)
    
    # Also clean up remaining dark background pixels near edges
    r_arr = np.array(cropped)[:,:,0]
    g_arr = np.array(cropped)[:,:,1]
    b_arr = np.array(cropped)[:,:,2]
    
    # Background color is close to RGB(35, 30, 29)
    color_dist = np.sqrt((r_arr.astype(float)-35)**2 + (g_arr.astype(float)-30)**2 + (b_arr.astype(float)-29)**2)
    is_bg_color = color_dist < 28
    
    final_bg = bg_filled | is_bg_color
    
    # Convert cropped image to RGBA
    rgba = np.dstack((np.array(cropped), np.ones((h, w), dtype=np.uint8) * 255))
    rgba[final_bg, 3] = 0
    
    res = Image.fromarray(rgba, 'RGBA')
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

for b in BADGES:
    clean_thumb = clean_leetcode_badge(b['file'], b['box'])
    out_p = OUT_DIR / f"{b['id']}-thumb.png"
    clean_thumb.save(out_p)
    print(f"Saved cleaned {out_p.name} (size: {clean_thumb.size})")
