# A taxidermist's bench: a mounted tiger's paw with two claws missing, a pair of pliers beside it, and a shelf of glass
# eyes above. Against a wall, face +X. Metres. Materials: body teak, trim the iron pliers and the claws, cloth the paw,
# glow the glass eyes.
from kit import *
obs = [at(box('top', (0.6, 1.4, 0.06), 'body', 0.01), (0, 0, 0.88))]
for x in (0.25, -0.25):
    for y in (0.65, -0.65): obs.append(at(box('leg', (0.06, 0.06, 0.86), 'body', 0.01), (x, y, 0.43)))
obs.append(at(box('shelf', (0.25, 1.2, 0.03), 'body', 0.01), (-0.18, 0, 1.45)))
for i in range(7): obs.append(at(ball('eye', 0.02, 'glow', 6, 4), (-0.12, -0.45 + i * 0.15, 1.485)))
# The paw on its block, palm up, three claws left of five.
obs.append(at(box('block', (0.2, 0.2, 0.06), 'body', 0.01), (0.05, 0.1, 0.94)))
paw = ball('paw', 0.09, 'cloth', 10, 8); deform(paw, lambda v: Vector((v.x * 1.4, v.y, v.z * 0.6))); obs.append(at(paw, (0.08, 0.1, 1.0)))
for k, y in enumerate((-0.06, -0.03, 0.0, 0.03, 0.06)):
    if k in (1, 3): continue  # pulled
    obs.append(aim(cone('claw', 0.012, 0.0, 0.05, 'trim', 5), (1, 0, 0.4), (0.2, 0.1 + y, 1.0)))
# The pliers, with hair in the jaws.
obs.append(at(box('plier-a', (0.2, 0.015, 0.012), 'trim', 0.003), (0.1, -0.2, 0.92), (0, 0, 8)))
obs.append(at(box('plier-b', (0.2, 0.015, 0.012), 'trim', 0.003), (0.1, -0.22, 0.92), (0, 0, -8)))
still(part('body', *obs))
export(__file__)
