"""Generate JPG thumbnails from certificate PDFs."""
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDFS = [
    ROOT / 'pictures' / 'Oracle' / 'Gokul_Oracle.pdf',
    ROOT / 'pictures' / 'Networking basics' / 'Networking basics.pdf',
    ROOT / 'pictures' / 'C++ fundamentals' / 'C++.pdf',
]
THUMB_WIDTH = 900


def render_pdf_thumb(pdf_path: Path) -> None:
    doc = fitz.open(pdf_path)
    page = doc[0]
    scale = THUMB_WIDTH / page.rect.width
    matrix = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    out = pdf_path.with_suffix('.jpg')
    pix.save(str(out), jpg_quality=88)
    doc.close()
    size_kb = out.stat().st_size / 1024
    print(f'{out.relative_to(ROOT)} ({size_kb:.0f} KB)')


if __name__ == '__main__':
    for pdf in PDFS:
        if not pdf.exists():
            print(f'Missing: {pdf}')
            continue
        render_pdf_thumb(pdf)
