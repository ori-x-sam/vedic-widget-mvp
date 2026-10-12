# A sloth bear's head on a teak shield: shaggy black, a pale long snout, its lip curled as if at a bad joke. Hangs on a
# wall, face +X, head 2.3 m up. Metres. Materials: body the fur, trim the shield, glow the eyes, cloth the plaque.
from kit import *
H = 2.3
obs = [at(slab('shield', [(-0.27, -0.32), (0.27, -0.32), (0.32, 0.1), (0, 0.37), (-0.32, 0.1)], 0.04, 'trim', 0.01), (0.02, 0, H), (0, 90, 0))]
head = ball('head', 0.22, 'body', 14, 10); smooth(head, 1); rough(head, 0.03, 6, 2)
obs.append(at(head, (0.15, 0, H)))
obs.append(aim(cone('snout', 0.09, 0.05, 0.22, 'body', 10), (1, 0, -0.2), (0.3, 0, H - 0.04)))
obs.append(at(box('lip', (0.06, 0.1, 0.03), 'trim', 0.01), (0.5, 0, H - 0.1)))
for y in (0.15, -0.15):
    obs.append(at(ball('ear', 0.06, 'body', 8, 6), (0.08, y, H + 0.18)))
    obs.append(at(ball('eye', 0.018, 'glow', 6, 4), (0.31, y * 0.6, H + 0.07)))
obs.append(at(box('plaque', (0.01, 0.2, 0.06), 'cloth', 0.003), (0.04, 0, H - 0.4)))
still(part('body', *obs))
export(__file__)
