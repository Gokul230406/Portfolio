import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
AWS_DIR = ROOT / 'pictures' / 'AWS'
AWS_DIR.mkdir(parents=True, exist_ok=True)

# Image dimensions (16:10 aspect ratio matching certificate cards)
WIDTH = 1200
HEIGHT = 750

# Colors
BG_COLOR = (27, 38, 53)          # #1b2635 slate navy
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 210, 225)
MUTED_GRAY = (160, 175, 195)
ORANGE = (255, 153, 0)           # #ff9900 AWS Orange
BORDER_ORANGE = (220, 130, 30)

img = Image.new('RGB', (WIDTH, HEIGHT), color=BG_COLOR)
draw = ImageDraw.Draw(img)

# Try loading standard sans-serif font or fallback
def get_font(size, bold=False):
    font_names = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeui.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    ]
    for fn in font_names:
        try:
            return ImageFont.truetype(fn, size)
        except OSError:
            continue
    return ImageFont.load_default()

font_aws_bold = get_font(38, bold=True)
font_aws_light = get_font(38, bold=False)
font_name = get_font(52, bold=True)
font_cert_title = get_font(34, bold=False)

font_label_bold = get_font(20, bold=True)
font_label_val = get_font(20, bold=False)

font_date_bold = get_font(18, bold=True)
font_date_val = get_font(18, bold=False)

# Draw AWS Logo top-left (X: 80, Y: 70)
# 'aws' text
draw.text((80, 65), "aws", font=font_aws_bold, fill=WHITE)
# AWS orange check badge
badge_x = 165
badge_y = 75
badge_size = 28
draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_size, badge_y + badge_size], radius=5, fill=ORANGE)
# Checkmark inside badge
draw.line([badge_x + 7, badge_y + 14, badge_x + 12, badge_y + 20, badge_x + 21, badge_y + 8], fill=WHITE, width=4)
# 'certified' text
draw.text((205, 65), "certified", font=font_aws_light, fill=WHITE)

# Candidate Name
draw.text((80, 175), "Gokul P", font=font_name, fill=WHITE)

# Certification Title
draw.text((80, 255), "AWS Certified Cloud Practitioner", font=font_cert_title, fill=WHITE)

# Validation Box (X: 80 to 1120, Y: 375 to 540)
box_left = 80
box_top = 380
box_right = 1120
box_bottom = 545
draw.rectangle([box_left, box_top, box_right, box_bottom], outline=BORDER_ORANGE, width=3)

# Inside Box:
# Line 1: VALIDATION NUMBER: 4d05e884d96f4e45989eeb5216cd74f0
draw.text((115, 415), "VALIDATION NUMBER: ", font=font_label_bold, fill=WHITE)
val_num_x = 115 + draw.textlength("VALIDATION NUMBER: ", font=font_label_bold)
draw.text((val_num_x, 415), "4d05e884d96f4e45989eeb5216cd74f0", font=font_label_val, fill=LIGHT_GRAY)

# Line 2: VALIDATE AT: https://aws.amazon.com/verification
draw.text((115, 470), "VALIDATE AT: ", font=font_label_bold, fill=WHITE)
val_at_x = 115 + draw.textlength("VALIDATE AT: ", font=font_label_bold)
draw.text((val_at_x, 470), "https://aws.amazon.com/verification", font=font_label_val, fill=ORANGE)

# Below Box: Dates
draw.text((80, 595), "Issue Date: ", font=font_date_bold, fill=WHITE)
iss_x = 80 + draw.textlength("Issue Date: ", font=font_date_bold)
draw.text((iss_x, 595), "August 7, 2026", font=font_date_val, fill=LIGHT_GRAY)

draw.text((80, 635), "Expiration Date: ", font=font_date_bold, fill=WHITE)
exp_x = 80 + draw.textlength("Expiration Date: ", font=font_date_bold)
draw.text((exp_x, 635), "August 7, 2029", font=font_date_val, fill=LIGHT_GRAY)

# Save JPG
jpg_path = AWS_DIR / 'AWS_Cloud_Practitioner.jpg'
img.save(jpg_path, quality=95)
print(f"Generated {jpg_path}")

# Save PDF
pdf_path = AWS_DIR / 'AWS_Cloud_Practitioner.pdf'
img.save(pdf_path, 'PDF', resolution=100.0)
print(f"Generated {pdf_path}")
