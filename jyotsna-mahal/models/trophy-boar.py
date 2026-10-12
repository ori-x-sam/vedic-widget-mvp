# A wild boar's head on a teak shield: long snout, tusks like a moustache waxed by an enemy, bristles. Hangs on a wall,
# face +X, head 2.2 m up. Metres. Materials: body the bristle, trim the shield, glow the eyes and tusks, cloth the plaque.
from kit import *
H = 2.2
obs = [at(slab('shield', [(-0.25, -0.3), (0.25, -0.3), (0.3, 0.1), (0, 0.35), (-0.3, 0.1)], 0.04, 'trim', 0.01), (0.02, 0, H), (0, 90, 0))]
head = lathe('head', [(0.0, 0), (0.17, 0.02), (0.15, 0.18), (0.09, 0.36), (0.07, 0.42), (0, 0.43)], 'body', 12)
smooth(head, 1); rough(head, 0.012, 9)
obs.append(aim(head, (1, 0, -0.15), (0.03, 0, H)))
obs.append(at(cone('ridge', 0.05, 0.0, 0.18, 'body', 4), (0.12, 0, H + 0.14), (0, -60, 0)))
for y in (0.06, -0.06):
    obs.append(tube('tusk', [(0.36, y, H - 0.06), (0.4, y * 1.6, H - 0.01), (0.38, y * 2.0, H + 0.06)], [0.016, 0.012, 0.003], 'glow', 6))
    obs.append(at(ball('eye', 0.016, 'glow', 6, 4), (0.17, y * 1.7, H + 0.08)))
    obs.append(at(cone('ear', 0.05, 0.0, 0.1, 'body', 5), (0.06, y * 2.2, H + 0.14), (0, -30, 0)))
obs.append(at(box('plaque', (0.01, 0.2, 0.06), 'cloth', 0.003), (0.04, 0, H - 0.38)))
still(part('body', *obs))
export(__file__)
