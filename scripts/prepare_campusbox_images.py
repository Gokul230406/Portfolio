"""Crop browser chrome, resize to 4:3, and compress CampusBox carousel images."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'pictures' / 'campusbox'
OUT_DIR = SRC_DIR / 'optimized'

SIDE_CROP = 0.05
TOP_CROP = 0.02
BOTTOM_CROP = 0.02
TARGET_SIZE = (1200, 900)
JPEG_QUALITY = 82

FILES = [
    '01-landing.png',
    '02-browse.png',
    '03-trending.png',
    '04-my-items.png',
    '05-physics.png',
    '06-blazer.png',
    '07-sell.png',
    '08-profile.png',
]


def prepare_image(path: Path, out_path: Path) -> tuple[int, int]:
    original_size = path.stat().st_size

    with Image.open(path) as opened:
        img = ImageOps.exif_transpose(opened).convert('RGB')
        width, height = img.size

        left = int(width * SIDE_CROP)
        right = int(width * (1 - SIDE_CROP))
        top = int(height * TOP_CROP)
        bottom = int(height * (1 - BOTTOM_CROP))
        img = img.crop((left, top, right, bottom))

        target_w, target_h = TARGET_SIZE
        img_ratio = img.width / img.height
        target_ratio = target_w / target_h
        if img_ratio > target_ratio:
            scale_h = target_h
            scale_w = int(scale_h * img_ratio)
        else:
            scale_w = target_w
            scale_h = int(scale_w / img_ratio)
        img = img.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
        crop_left = (scale_w - target_w) // 2
        crop_top = (scale_h - target_h) // 2
        img = img.crop((crop_left, crop_top, crop_left + target_w, crop_top + target_h))

        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)

    final_size = out_path.stat().st_size
    return original_size, final_size


def main() -> None:
    total_before = 0
    total_after = 0

    for name in FILES:
        src = SRC_DIR / name
        if not src.exists():
            print(f'Missing: {src.name}')
            continue

        out = OUT_DIR / f'{Path(name).stem}.jpg'
        before, after = prepare_image(src, out)
        total_before += before
        total_after += after
        print(f'{name}: {before / 1024:.1f} KB -> {after / 1024:.1f} KB')

    print(f'\nTotal: {total_before / 1024:.1f} KB -> {total_after / 1024:.1f} KB')


if __name__ == '__main__':
    main()
