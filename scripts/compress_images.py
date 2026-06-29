"""Compress portfolio images to under 1 MB each."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 1 * 1024 * 1024
MAX_DIMENSION = 1920
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'}


def iter_images() -> list[Path]:
    paths: list[Path] = []
    for folder in ('pictures', 'assets'):
        base = ROOT / folder
        if not base.exists():
            continue
        for path in base.rglob('*'):
            if path.suffix.lower() in IMAGE_EXTS and path.is_file():
                paths.append(path)
    return sorted(paths)


def save_jpeg(img: Image.Image, path: Path, quality: int) -> None:
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    img.save(
        path,
        'JPEG',
        quality=quality,
        optimize=True,
        progressive=True,
    )


def compress_image(path: Path) -> tuple[int, int]:
    original_size = path.stat().st_size
    if original_size <= MAX_BYTES:
        return original_size, original_size

    with Image.open(path) as opened:
        img = ImageOps.exif_transpose(opened)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            alpha = img.split()[-1] if 'A' in img.mode else None
            background.paste(img, mask=alpha)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        width, height = img.size
        max_side = max(width, height)
        if max_side > MAX_DIMENSION:
            scale = MAX_DIMENSION / max_side
            img = img.resize(
                (max(1, int(width * scale)), max(1, int(height * scale))),
                Image.Resampling.LANCZOS,
            )

        out_path = path
        if path.suffix.lower() == '.png':
            out_path = path.with_suffix('.jpg')
            if out_path != path and path.exists():
                path.unlink()

        quality = 88
        save_jpeg(img, out_path, quality)

        while out_path.stat().st_size > MAX_BYTES and quality > 45:
            quality -= 5
            save_jpeg(img, out_path, quality)

        while out_path.stat().st_size > MAX_BYTES and max(img.size) > 720:
            width, height = img.size
            img = img.resize(
                (max(1, int(width * 0.85)), max(1, int(height * 0.85))),
                Image.Resampling.LANCZOS,
            )
            save_jpeg(img, out_path, max(quality, 70))

    final_size = out_path.stat().st_size
    return original_size, final_size


def main() -> None:
    compressed = 0
    total_before = 0
    total_after = 0

    for path in iter_images():
        before = path.stat().st_size
        total_before += before

        if before <= MAX_BYTES:
            total_after += before
            continue

        before_size, after_size = compress_image(path)
        compressed += 1
        total_after += after_size
        print(
            f"{path.relative_to(ROOT)}: "
            f"{before_size / 1024 / 1024:.2f} MB -> {after_size / 1024 / 1024:.2f} MB"
        )

    print(f"\nCompressed {compressed} file(s).")
    print(f"Total before: {total_before / 1024 / 1024:.2f} MB")
    print(f"Total after:  {total_after / 1024 / 1024:.2f} MB")


if __name__ == '__main__':
    main()
