import cv2
import numpy as np
from PIL import Image
from pathlib import Path

NEW_IMG_PATH = Path(r'C:\Users\GOKUL\.gemini\antigravity-ide\brain\1938df1d-a339-4cbc-8121-9a40c7f53eb1\media__1786286510384.jpg')
OUT_DIR = Path(__file__).resolve().parents[1] / 'pictures' / 'Badges'

def extract_perfect_hexagon(img_path):
    img = Image.open(img_path).convert('RGB')
    
    # Crop around the central badge
    crop_box = (160, 380, 415, 655)
    cropped = img.crop(crop_box)
    
    rgb = np.array(cropped)
    h, w = rgb.shape[:2]
    
    # Silver rim and blue badge pixels have higher saturation or distinct brightness compared to background
    # Convert RGB to HSV
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    
    # Silver metallic rim has high V (brightness > 90) and low S (saturation < 40)
    # Blue fill has H in range 100..130, high S and V
    silver_mask = (hsv[:,:,1] < 45) & (hsv[:,:,2] > 85)
    blue_mask = (hsv[:,:,0] >= 95) & (hsv[:,:,0] <= 135) & (hsv[:,:,1] > 60)
    dark_fill_mask = (hsv[:,:,2] > 20) & (hsv[:,:,2] < 70) & (hsv[:,:,1] < 35)
    
    badge_fg = (silver_mask | blue_mask | dark_fill_mask).astype(np.uint8) * 255
    
    # Morphological close to connect edge gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    badge_closed = cv2.morphologyEx(badge_fg, cv2.MORPH_CLOSE, kernel)
    
    # Find largest contour
    contours, _ = cv2.findContours(badge_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return cropped
        
    largest = max(contours, key=cv2.contourArea)
    
    # Use convex hull to get the smooth 6-sided hexagon boundary of the badge frame
    hull = cv2.convexHull(largest)
    
    alpha_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(alpha_mask, [hull], -1, 255, thickness=cv2.FILLED)
    
    # Blur edge slightly for anti-aliasing
    alpha_blur = cv2.GaussianBlur(alpha_mask, (3, 3), 0)
    
    rgba = np.dstack((rgb, alpha_blur))
    res = Image.fromarray(rgba, 'RGBA')
    
    bbox = res.getbbox()
    if bbox:
        res = res.crop(bbox)
    return res

clean_badge = extract_perfect_hexagon(NEW_IMG_PATH)
thumb_p = OUT_DIR / 'leetcode-100-2026-thumb.png'
full_p = OUT_DIR / 'leetcode-100-2026-full.png'

clean_badge.save(thumb_p)
clean_badge.save(full_p)

print(f"Saved flawless {thumb_p.name} (size: {clean_badge.size})")
