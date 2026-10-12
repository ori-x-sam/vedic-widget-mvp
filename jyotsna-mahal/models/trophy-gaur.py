# A gaur's head the size of an armchair on a teak shield, with heavy curved horns and the patient eyes of a cow in a
# queue. Hangs on a wall, face +X, head 2.6 m up. Metres. Materials: body the hide, trim the shield and horns, glow the
# eyes, cloth the plaque.
from kit import *
H = 2.6
obs = [at(slab('shield', [(-0.35, -0.4), (0.35, -0.4), (0.4, 0.15), (0, 0.45), (-0.4, 0.15)], 0.05, 'trim', 0.01), (0.025, 0, H), (0, 90, 0))]
head = lathe('head', [(0.0, 0), (0.26, 0.02), (0.24, 0.2), (0.16, 0.42), (0.13, 0.55), (0, 0.57)], 'body', 14)
obs.append(aim(head, (1, 0, -0.35), (0.04, 0, H + 0.05)))
obs.append(at(box('dewlap', (0.25, 0.2, 0.25), 'body', 0.08), (0.18, 0, H - 0.22)))
for y in (1, -1):
    obs.append(tube('horn', [(0.12, y * 0.17, H + 0.2), (0.1, y * 0.35, H + 0.3), (0.16, y * 0.4, H + 0.48), (0.24, y * 0.3, H + 0.55)], [0.055, 0.045, 0.03, 0.005], 'trim', 8))
    obs.append(at(ball('eye', 0.022, 'glow', 6, 4), (0.3, y * 0.13, H + 0.08)))
    obs.append(at(slab('ear', [(0, 0), (0.16, 0.05), (0.18, 0.1), (0, 0.06)], 0.02, 'body', 0.005), (0.1, y * 0.25, H + 0.12), (0, 0, y * 20)))
obs.append(at(box('plaque', (0.01, 0.24, 0.07), 'cloth', 0.003), (0.05, 0, H - 0.5)))
still(part('body', *obs))
export(__file__)
