# The Raja's war-surplus jeep, with a third bench bolted on behind: olive body, iron wheels and grille, canvas seats,
# a rifle rack. Front to +X. Its floor is 0.4 m up (where seated people's feet go). Metres. Materials: body the olive
# paint, trim the iron, cloth the canvas seats.
from kit import *
obs = [at(box('tub', (3.4, 1.55, 0.5), 'body', 0.06), (0, 0, 0.62))]
obs.append(at(box('bonnet', (1.0, 1.4, 0.32), 'body', 0.06), (1.25, 0, 0.98)))
obs.append(at(box('grille', (0.04, 1.0, 0.5), 'trim', 0.01), (1.76, 0, 0.82)))
for y in (0.45, -0.45): obs.append(at(lathe('lamp', [(0, 0), (0.09, 0), (0.09, 0.05), (0, 0.06)], 'trim', 10), (1.79, y, 1.0), (0, 90, 0)))
# The windscreen: a frame (the glass is folded down flat on the bonnet, shikar fashion).
for y in (0.7, -0.7): obs.append(at(box('screen-post', (0.04, 0.04, 0.45), 'trim', 0.01), (0.72, y, 1.38), (0, -8, 0)))
obs.append(at(box('screen-top', (0.04, 1.45, 0.04), 'trim', 0.01), (0.75, 0, 1.6), (0, -8, 0)))
obs.append(at(box('screen-folded', (0.45, 1.4, 0.03), 'trim', 0.01), (1.0, 0, 1.15)))
for x in (1.15, -1.15):
    for y in (0.8, -0.8): obs.append(at(lathe('wheel', [(0, -0.12), (0.38, -0.12), (0.4, 0), (0.38, 0.12), (0, 0.12)], 'trim', 16), (x, y, 0.38), (90, 0, 0)))
for x in (0.25, -0.5, -1.25):
    obs.append(at(box('seat', (0.45, 1.35, 0.1), 'cloth', 0.03), (x, 0, 0.88)))
    obs.append(at(box('back', (0.08, 1.35, 0.42), 'cloth', 0.03), (x - 0.22, 0, 1.1)))
obs.append(tube('wheel-rim', [(0.45 + 0.17 * math.cos(a), -0.4 + 0.17 * math.sin(a), 1.25) for a in [i / 12 * math.tau for i in range(13)]], 0.012, 'trim', 5))
obs.append(tube('column', [(0.62, -0.4, 0.9), (0.47, -0.4, 1.24)], 0.02, 'trim', 5))
obs.append(tube('rack', [(-1.6, 0.7, 0.9), (-1.6, 0.7, 1.35), (-1.6, -0.7, 1.35), (-1.6, -0.7, 0.9)], 0.02, 'trim', 5))
still(part('body', *obs))
export(__file__)
