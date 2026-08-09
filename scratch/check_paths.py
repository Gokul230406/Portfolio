import re
import os
from pathlib import Path

root = Path(r"c:\Full Stack\Portfolio")

with open(root / "js" / "main.js", "r", encoding="utf-8") as f:
    js_content = f.read()

with open(root / "index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# Extract paths from JS mediaGalleries
js_paths = re.findall(r"'(pictures/[^']+)'", js_content)
missing_js = []
for p in set(js_paths):
    full_path = root / p
    if not full_path.exists():
        missing_js.append(p)

print(f"Total JS gallery images: {len(js_paths)}")
print(f"Missing JS gallery paths ({len(missing_js)}):")
for m in missing_js:
    print(f"  - {m}")

# Extract paths from HTML
html_paths = re.findall(r'(?:src|href)="([^"]+)"', html_content)
missing_html = []
for p in set(html_paths):
    if p.startswith(('http', '#', 'mailto:', 'tel:')):
        continue
    full_path = root / p
    if not full_path.exists():
        missing_html.append(p)

print(f"\nMissing HTML paths ({len(missing_html)}):")
for m in missing_html:
    print(f"  - {m}")
