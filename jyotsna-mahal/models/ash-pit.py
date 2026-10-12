# The ash pit in the kitchen garden: a ring of fire-blackened bricks round a low mound of grey ash. Metres.
# Materials: body the ash, trim the blackened bricks, cloth a bone showing through.
from kit import *
mound = ball('ash', 1.0, 'body', 16, 8); deform(mound, lambda v: Vector((v.x, v.y, v.z * 0.15))); rough(mound, 0.02, 4, 3)
obs = [mound]
for a in range(0, 360, 20): obs.append(at(box('brick', (0.24, 0.12, 0.1), 'trim', 0.01), (1.05 * math.cos(math.radians(a)), 1.05 * math.sin(math.radians(a)), 0.05), (0, 0, a)))
obs.append(at(tube('bone', [(0.2, -0.1, 0.1), (0.45, 0.05, 0.12)], 0.03, 'cloth', 6), (0, 0, 0)))
still(part('body', *obs))
export(__file__)
