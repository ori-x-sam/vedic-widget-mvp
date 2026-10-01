# Combine screenshots into a grid for quick review: python3 tools/montage.py out.png a.png b.png ...
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = 640, 300
cols = 2
rows = (len(ims) + cols - 1) // cols
g = Image.new("RGB", (w * cols, h * rows), (20, 10, 16))
for i, im in enumerate(ims):
    g.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
g.save(out)
