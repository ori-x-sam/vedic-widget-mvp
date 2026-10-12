# A curtained alcove in the corridor wall: a cusped sandstone arch with a heavy curtain drawn across it, enough to
# hide a fussy man of fifty. Its face looks +X. Metres. Materials: body the arch, cloth the curtain.
from kit import *
obs = []
for y in (0.62, -0.62): obs.append(at(box('jamb', (0.2, 0.16, 2.2), 'body', 0.02), (0, y, 1.1)))
arch = slab('arch', [(-0.7, 2.2), (0.7, 2.2), (0.7, 2.75), (-0.7, 2.75)], 0.2, 'body', 0.02)
at(arch, (0, 0, 0), (90, 0, 90))
obs.append(arch)
curtain = box('curtain', (0.08, 1.16, 2.25), 'cloth', 0.02)
smooth(curtain, 2)
deform(curtain, lambda v: Vector((v.x + 0.04 * math.sin(v.y * 22) * (0.5 + 0.5 * (1 - v.z / 1.2)), v.y, v.z)))
obs.append(at(curtain, (0.03, 0, 1.13)))
obs.append(tube('rod', [(0.06, 0.7, 2.27), (0.06, -0.7, 2.27)], 0.015, 'body', 6))
still(part('body', *obs))
export(__file__)
