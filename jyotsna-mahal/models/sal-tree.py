# A sal tree: a straight grey-brown trunk to ten metres and a broad dark canopy. Cheap: the jungle uses many.
# Metres. Materials: body the bark, cloth the leaves.
from kit import *
obs = [lathe('trunk', [(0, 0), (0.32, 0), (0.24, 1.0), (0.18, 6.0), (0.12, 9.0), (0, 9.2)], 'body', 7)]
for (x, y, z, r) in [(0, 0, 9.5, 2.3), (1.4, 0.6, 8.6, 1.6), (-1.3, -0.5, 8.8, 1.7), (0.4, -1.4, 8.3, 1.4), (-0.5, 1.4, 8.1, 1.3)]:
    b = ball('leaves', r, 'cloth', 8, 5); deform(b, lambda v: Vector((v.x, v.y, v.z * 0.6))); rough(b, r * 0.12, 1.5, int(x * 10)); obs.append(at(b, (x, y, z)))
still(part('body', *obs))
export(__file__)
