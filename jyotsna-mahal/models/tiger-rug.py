# A tiger-skin rug, head and all, glass eyes looking at the ceiling. Head to +X. Metres. Materials: body the fur,
# cloth the stripes, glow the eyes.
from kit import *
skin = slab('skin', [(-1.1, 0), (-0.8, 0.35), (-0.5, 0.6), (-0.3, 0.32), (0.3, 0.32), (0.5, 0.6), (0.7, 0.3), (0.85, 0.12), (0.85, -0.12), (0.7, -0.3), (0.5, -0.6), (0.3, -0.32), (-0.3, -0.32), (-0.5, -0.6), (-0.8, -0.35)], 0.02, 'body', 0.005)
obs = [at(skin, (0, 0, 0.012))]
for i in range(8): obs.append(at(box('stripe', (0.04, 0.55, 0.022), 'cloth', 0.0), (-0.75 + i * 0.2, 0, 0.014), (0, 0, 8 * (i % 2 * 2 - 1))))
head = ball('head', 0.17, 'body', 12, 8); deform(head, lambda v: Vector((v.x * 1.2, v.y, v.z * 0.55))); obs.append(at(head, (1.0, 0, 0.08)))
for y in (0.07, -0.07): obs.append(at(ball('eye', 0.02, 'glow', 6, 4), (1.1, y, 0.15)))
obs.append(tube('tail', [(-1.1, 0, 0.02), (-1.5, 0.15, 0.02), (-1.75, 0.05, 0.02)], [0.05, 0.04, 0.025], 'body', 6))
still(part('body', *obs))
export(__file__)
