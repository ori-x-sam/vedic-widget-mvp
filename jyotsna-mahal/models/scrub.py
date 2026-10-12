# Jungle scrub: a low clump of leafy masses on a few woody stems, waist to chest high. The road's edge uses many.
# Metres. Materials: body the stems, cloth the leaves.
from kit import *
obs = []
for i, (x, y, z, r) in enumerate([(0, 0, 0.6, 0.6), (0.45, 0.2, 0.45, 0.45), (-0.4, -0.25, 0.4, 0.5), (0.1, -0.5, 0.35, 0.4), (-0.15, 0.5, 0.5, 0.4)]):
    obs.append(tube('stem', [(x * 0.3, y * 0.3, 0), (x * 0.8, y * 0.8, z * 0.7)], [0.03, 0.015], 'body', 5))
    b = ball('leaves', r, 'cloth', 10, 7)
    deform(b, lambda v: Vector((v.x, v.y, v.z * 0.75)))
    rough(b, r * 0.22, 3.0, i + 5)
    obs.append(at(b, (x, y, z)))
still(part('body', *obs))
export(__file__)
