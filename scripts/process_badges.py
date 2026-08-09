import os
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
import numpy as np

BRAIN_DIR = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'
OUT_DIR.mkdir(parents=True, exist_ok=True)

BADGES_INFO = [
    {
        'id': 'aws-cloud-practitioner',
        'file': BRAIN_DIR / 'media__1786285870954.png',
        'title': 'AWS Certified Cloud Practitioner',
        'issuer': 'Amazon Web Services',
        'year': '2026',
        'is_aws': True
    },
    {
        'id': 'leetcode-100-2026',
        'file': BRAIN_DIR / 'media__1786285965753.png',
        'title': 'LeetCode 100 Days Badge 2026',
        'issuer': 'LeetCode',
        'year': '2026',
        'is_aws': False
    },
    {
        'id': 'leetcode-50-2026',
        'file': BRAIN_DIR / 'media__1786285970057.png',
        'title': 'LeetCode 50 Days Badge 2026',
        'issuer': 'LeetCode',
        'year': '2026',
        'is_aws': False
    },
    {
        'id': 'leetcode-50-2025',
        'file': BRAIN_DIR / 'media__1786285974848.png',
        'title': 'LeetCode 50 Days Badge 2025',
        'issuer': 'LeetCode',
        'year': '2025',
        'is_aws': False
    }
]

def remove_background_aws(img):
    # AWS badge: transparent/white outside the silver hexagon border
    # Convert to RGBA numpy array
    arr = np.array(img.convert('RGBA'))
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    # White background mask (r > 240, g > 240, b > 240)
    white_mask = (r > 245) & (g > 245) & (b > 245)
    
    # Set white background pixels to alpha = 0
    arr[:, :, 3][white_mask] = 0
    
    out_img = Image.fromarray(arr, 'RGBA')
    # Bounding box of non-transparent region
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
    return out_img

def crop_and_remove_bg_leetcode(img_path):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    
    # Crop central region around badge (Y roughly 380 to 650, X roughly 130 to 445)
    # Let's crop generously first
    crop_box = (130, 380, 445, 650)
    cropped = img.crop(crop_box)
    
    arr = np.array(cropped)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)
    
    # Dark background in LeetCode card is very dark (r < 50, g < 45, b < 45)
    # Check distance from dark background color (~ #1c1817 or #221e1d)
    # Background color is around rgb(30..40, 25..35, 25..35)
    bg_dist = np.sqrt((r - 35)**2 + (g - 28)**2 + (b - 27)**2)
    
    # Also check if color is generally dark reddish/grey background
    is_bg = (r < 55) & (g < 48) & (b < 48) & (np.abs(r - g) < 15) & (np.abs(g - b) < 15)
    
    # Set alpha based on background mask
    alpha = np.ones_like(a) * 255
    alpha[is_bg] = 0
    
    arr[:, :, 3] = alpha
    result = Image.fromarray(arr, 'RGBA')
    
    # Crop to exact non-transparent content
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
        
    return result

for item in BADGES_INFO:
    print(f"Processing {item['id']}...")
    raw_img = Image.open(item['file'])
    
    # Save full image
    full_path = OUT_DIR / f"{item['id']}-full.png"
    raw_img.save(full_path)
    
    # Generate transparent badge-only thumbnail
    if item['is_aws']:
        thumb_img = remove_background_aws(raw_img)
    else:
        thumb_img = crop_and_remove_bg_leetcode(item['file'])
        
    thumb_path = OUT_DIR / f"{item['id']}-thumb.png"
    thumb_img.save(thumb_path)
    print(f"Saved {full_path.name} and {thumb_path.name} (thumb size: {thumb_img.size})")

print("Processing complete!")
