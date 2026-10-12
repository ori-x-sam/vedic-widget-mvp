# A leopard's head mid-snarl on a teak shield, with its brass plaque below. Hangs on a wall, face +X, head 2.4 m up.
# Metres. Materials: body the fur, trim the shield, glow the glass eyes, cloth the brass plaque.
from kit import *
H = 2.4
obs = [at(slab('shield', [(-0.25, -0.3), (0.25, -0.3), (0.3, 0.1), (0, 0.35), (-0.3, 0.1)], 0.04, 'trim', 0.01), (0.02, 0, H), (0, 90, 0))]
head = ball('head', 0.17, 'body', 16, 10); deform(head, lambda v: Vector((v.x * 1.3, v.y * 1.0, v.z * 0.85))); obs.append(at(head, (0.2, 0, H)))
muzzle = ball('muzzle', 0.08, 'body', 10, 6); obs.append(at(muzzle, (0.38, 0, H - 0.05)))
obs.append(at(box('jaw', (0.14, 0.1, 0.03), 'trim', 0.01), (0.37, 0, H - 0.12), (0, 25, 0)))
for y in (0.1, -0.1):
    obs.append(at(cone('ear', 0.05, 0.0, 0.08, 'body', 6), (0.1, y, H + 0.12), (0, -20, 0)))
    obs.append(at(ball('eye', 0.02, 'glow', 6, 4), (0.33, y * 0.55, H + 0.05)))
obs.append(at(box('plaque', (0.01, 0.2, 0.06), 'cloth', 0.003), (0.04, 0, H - 0.38)))
still(part('body', *obs))
export(__file__)
