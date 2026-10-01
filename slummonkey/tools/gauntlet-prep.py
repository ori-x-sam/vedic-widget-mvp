# Build a blind comparison set: crop reference letterboxing, resize everything to the same height,
# shuffle, and write a private answer key. Usage: python3 tools/gauntlet-prep.py <outdir> <seed> ours.png...
import sys, random, json, glob, os
from PIL import Image
out, seed, ours = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
os.makedirs(out, exist_ok=True)
refs = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "reference", "*.png")))
items = []
for r in refs:
    im = Image.open(r).convert("RGB")
    w, h = im.size
    # the phone captures have dark side bars; crop to the game area and drop the corner watermark/HUD icon strip
    im = im.crop((int(w * 0.095), int(h * 0.03), int(w * 0.905), int(h * 0.93)))
    items.append(("reference", r, im))
for o in ours:
    im = Image.open(o).convert("RGB")
    items.append(("ours", o, im))
random.Random(seed).shuffle(items)
key = {}
for i, (kind, src, im) in enumerate(items):
    H = 560
    im = im.resize((int(im.width * H / im.height), H))
    name = f"img{i + 1:02d}.png"
    im.save(os.path.join(out, name))
    key[name] = {"kind": kind, "src": os.path.basename(src)}
json.dump(key, open(os.path.join(out, "..", os.path.basename(out) + "-key.json"), "w"), indent=1)
print(len(items), "images ->", out)
