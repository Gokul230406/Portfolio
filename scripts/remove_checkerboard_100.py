import cv2
import numpy as np
from PIL import Image
from pathlib import Path

NEW_IMG_PATH = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1\media__1786286510384.jpg')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

def remove_checkerboard_and_keep_badge(img_path):
    img = Image.open(img_path).convert('RGB')
    
    # Crop central region (around the 100 days badge)
    # Badge center is at X ~ 287, Y ~ 517 in 574x1024 image
    crop_box = (160, 385, 415, 650)
    cropped = img.crop(crop_box)
    
    rgb = np.array(cropped)
    h, w = rgb.shape[:2]
    
    # We want to identify the silver outer hexagon line.
    # Silver rim pixels have high brightness (R>80, G>80, B>80) and low color saturation (R, G, B values very close to each other, e.g. max-min < 25).
    # Blue 100 DAYS fill has B > R + 20 and B > G.
    # Dark texture inside hexagon has R < 70, G < 70, B < 70.
    
    r = rgb[:, :, 0].astype(int)
    g = rgb[:, :, 1].astype(int)
    b = rgb[:, :, 2].astype(int)
    
    # Checkerboard pattern consists of repeated squares of RGB ~(60..70) and RGB ~(130..140).
    # Outside the silver hexagon rim, the checkerboard squares extend to the edges.
    
    # Let's detect the silver hexagon rim by thresholding bright pixels that form the hexagon loop.
    is_silver = (r > 100) & (g > 100) & (b > 100) & (np.abs(r - g) < 20) & (np.abs(g - b) < 20)
    is_blue = (b > r + 15) & (b > g)
    is_dark_fill = (r < 75) & (g < 75) & (b < 75)
    
    # Combine badge interior + silver rim
    badge_content = (is_silver | is_blue | is_dark_fill).astype(np.uint8) * 255
    
    # FloodFill from borders to remove outer checkerboard region
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # Seeds around border
    seeds = [(0,0), (w-1,0), (0,h-1), (w-1,h-1), (w//2, 0), (w//2, h-1), (0, h//2), (w-1, h//2)]
    for sx, sy in seeds:
        cv2.floodFill(bgr, mask, (sx, sy), (0, 0, 0), (12, 12, 12), (12, 12, 12), cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        
    bg_mask = (mask[1:-1, 1:-1] == 255)
    
    # Foreground mask
    fg_mask = (~bg_mask).astype(np.uint8) * 255
    
    # Find largest contour
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        # Approximate hexagon polygon
        epsilon = 0.015 * cv2.arcLength(largest, True)
        approx = cv2.approxPolyDP(largest, epsilon, True)
        
        poly_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(poly_mask, [approx], -1, 255, thickness=cv2.FILLED)
        
        # Smooth edges
        alpha = cv2.GaussianBlur(poly_mask, (3, 3), 0)
    else:
        alpha = fg_mask
        
    rgba = np.dstack((rgb, alpha))
    res = Image.fromarray(rgba, 'RGBA')
    
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

clean_badge = remove_checkerboard_and_keep_badge(NEW_IMG_PATH)
thumb_p = OUT_DIR / 'leetcode-100-2026-thumb.png'
full_p = OUT_DIR / 'leetcode-100-2026-full.png'

clean_badge.save(thumb_p)
clean_badge.save(full_p)
print(f"Saved transparent 100 days badge: {thumb_p.name} (size: {clean_badge.size})")
