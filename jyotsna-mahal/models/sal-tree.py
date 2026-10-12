# A sal tree: a straight grey-brown trunk to ten metres, a few limbs, and a broad dark canopy of soft leaf masses.
# The jungle uses many. Metres. Materials: body the bark, cloth the leaves.
from kit import *
trunk = lathe('trunk', [(0, 0), (0.36, 0), (0.26, 0.6), (0.21, 3.0), (0.17, 6.0), (0.12, 8.6), (0, 9.0)], 'body', 10)
rough(trunk, 0.02, 6.0, 1)
obs = [trunk]
for (a, z, l) in [(20, 6.2, 2.0), (150, 6.8, 1.8), (260, 7.3, 1.6), (330, 7.8, 1.4)]:
    d = Vector((math.cos(D(a)), math.sin(D(a)), 0))
    p0 = Vector((0, 0, z))
    obs.append(tube('limb', [p0, p0 + d * l * 0.5 + Vector((0, 0, l * 0.45)), p0 + d * l + Vector((0, 0, l * 0.75))], [0.1, 0.07, 0.03], 'body', 6))
clumps = [(0, 0, 9.6, 2.2), (1.5, 0.6, 8.9, 1.6), (-1.4, -0.5, 9.0, 1.7), (0.5, -1.5, 8.6, 1.5), (-0.6, 1.5, 8.5, 1.4),
          (1.0, -0.6, 10.3, 1.3), (-0.9, 0.7, 10.4, 1.2), (2.1, -0.9, 8.4, 1.0), (-2.0, 0.9, 8.6, 1.0)]
for i, (x, y, z, r) in enumerate(clumps):
    b = ball('leaves', r, 'cloth', 12, 8)
    deform(b, lambda v: Vector((v.x, v.y, v.z * 0.62)))
    rough(b, r * 0.16, 1.8, i + 2)
    rough(b, r * 0.05, 6.0, i + 20)
    obs.append(at(b, (x, y, z)))
still(part('body', *obs))
export(__file__)
