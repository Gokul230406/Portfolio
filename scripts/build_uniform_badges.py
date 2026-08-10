import cv2
import numpy as np
from PIL import Image, ImageOps
from pathlib import Path

BRAIN_DIR = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 1. AWS Badge
aws_src = OUT_DIR / 'aws-cloud-practitioner-thumb.png'

# 2. LC 100 Days 2026
lc100_src = BRAIN_DIR / 'media__1786289672520.png'

# 3. LC 50 Days 2026
lc50_2026_src = BRAIN_DIR / 'media__1786289672552.jpg'

# 4. LC 50 Days 2025
lc50_2025_src = BRAIN_DIR / 'media__1786289672547.png'

def extract_badge_white_bg(img_path):
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    
    # White background mask (R > 240, G > 240, B > 240)
    is_white = (r > 240) & (g > 240) & (b > 240)
    
    # OpenCV flood fill from 4 corners to remove outer white background cleanly
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for seed in seeds:
        cv2.floodFill(bgr, mask, seed, (0, 0, 0), (15, 15, 15), (15, 15, 15), cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        
    bg = (mask[1:-1, 1:-1] == 255) | is_white
    fg = (~bg).astype(np.uint8) * 255
    
    # Find largest contour to get exact outer hexagon boundary
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

def extract_badge_black_bg(img_path):
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    
    # Black background mask (R < 25, G < 25, B < 25)
    is_black = (r < 25) & (g < 25) & (b < 25)
    
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for seed in seeds:
        cv2.floodFill(bgr, mask, seed, (0, 0, 0), (15, 15, 15), (15, 15, 15), cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        
    bg = (mask[1:-1, 1:-1] == 255) | is_black
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
    """Place cropped transparent badge centered inside a target_size x target_size square canvas."""
    # Scale cropped_rgba proportionally so its max dimension equals inner_size
    w, h = cropped_rgba.size
    scale = inner_size / max(w, h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    
    resized = cropped_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create empty transparent canvas
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    offset_x = (target_size - new_w) // 2
    offset_y = (target_size - new_h) // 2
    
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas

# Process AWS Cloud Practitioner Badge
aws_cropped = Image.open(aws_src).convert('RGBA')
aws_bbox = aws_cropped.getbbox()
if aws_bbox:
    aws_cropped = aws_cropped.crop(aws_bbox)
aws_uniform = create_uniform_square_badge(aws_cropped)
aws_uniform.save(OUT_DIR / 'aws-cloud-practitioner-thumb.png')
aws_uniform.save(OUT_DIR / 'aws-cloud-practitioner-full.png')
print("Saved uniform AWS Cloud Practitioner badge")

# Process AWS AI Practitioner Badge
aws_ai_src = OUT_DIR / 'aws-ai-practitioner-thumb.png'
if aws_ai_src.exists():
    aws_ai_cropped = Image.open(aws_ai_src).convert('RGBA')
    aws_ai_bbox = aws_ai_cropped.getbbox()
    if aws_ai_bbox:
        aws_ai_cropped = aws_ai_cropped.crop(aws_ai_bbox)
    aws_ai_uniform = create_uniform_square_badge(aws_ai_cropped)
    aws_ai_uniform.save(OUT_DIR / 'aws-ai-practitioner-thumb.png')
    aws_ai_uniform.save(OUT_DIR / 'aws-ai-practitioner-full.png')
    print("Saved uniform AWS AI Practitioner badge")

# Process Oracle Java SE 17 Badge
oracle_src = OUT_DIR / 'oracle-java-se17-thumb.png'
if oracle_src.exists():
    oracle_cropped = Image.open(oracle_src).convert('RGBA')
    oracle_bbox = oracle_cropped.getbbox()
    if oracle_bbox:
        oracle_cropped = oracle_cropped.crop(oracle_bbox)
    oracle_uniform = create_uniform_square_badge(oracle_cropped)
    oracle_uniform.save(OUT_DIR / 'oracle-java-se17-thumb.png')
    oracle_uniform.save(OUT_DIR / 'oracle-java-se17-full.png')
    print("Saved uniform Oracle Java SE 17 badge")

# Process LC 100 2026
lc100_cropped = extract_badge_white_bg(lc100_src)
lc100_uniform = create_uniform_square_badge(lc100_cropped)
lc100_uniform.save(OUT_DIR / 'leetcode-100-2026-thumb.png')
lc100_uniform.save(OUT_DIR / 'leetcode-100-2026-full.png')
print("Saved uniform LC 100 2026 badge")

# Process LC 50 2026
lc50_2026_cropped = extract_badge_black_bg(lc50_2026_src)
lc50_2026_uniform = create_uniform_square_badge(lc50_2026_cropped)
lc50_2026_uniform.save(OUT_DIR / 'leetcode-50-2026-thumb.png')
lc50_2026_uniform.save(OUT_DIR / 'leetcode-50-2026-full.png')
print("Saved uniform LC 50 2026 badge")

# Process LC 50 2025
lc50_2025_cropped = extract_badge_white_bg(lc50_2025_src)
lc50_2025_uniform = create_uniform_square_badge(lc50_2025_cropped)
lc50_2025_uniform.save(OUT_DIR / 'leetcode-50-2025-thumb.png')
lc50_2025_uniform.save(OUT_DIR / 'leetcode-50-2025-full.png')
print("Saved uniform LC 50 2025 badge")

print("All badges processed into uniform 512x512 square transparent PNGs!")
