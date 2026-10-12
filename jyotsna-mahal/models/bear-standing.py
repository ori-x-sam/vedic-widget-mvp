# A sloth bear stuffed upright on a teak plinth, arms raised, dead since 1922, still faintly smelling of bear. Big
# enough to hide behind. Faces +X. Metres. Materials: body the fur, trim the plinth, glow the eyes.
from kit import *
obs = [at(box('plinth', (0.7, 0.7, 0.12), 'trim', 0.02), (0, 0, 0.06))]
torso = lathe('torso', [(0, 0.1), (0.22, 0.15), (0.32, 0.5), (0.3, 0.95), (0.22, 1.3), (0, 1.38)], 'body', 14)
smooth(torso, 1); rough(torso, 0.035, 5, 1)
obs.append(at(torso, (0, 0, 0.1)))
head = ball('head', 0.19, 'body', 12, 8); rough(head, 0.03, 6, 3); obs.append(at(head, (0.05, 0, 1.55)))
obs.append(aim(cone('snout', 0.08, 0.05, 0.2, 'body', 8), (1, 0, -0.2), (0.15, 0, 1.53)))
for y in (0.1, -0.1): obs.append(at(ball('eye', 0.016, 'glow', 6, 4), (0.2, y, 1.6)))
for y in (1, -1):
    obs.append(tube('arm', [(0.02, y * 0.3, 1.2), (0.2, y * 0.42, 1.45), (0.32, y * 0.38, 1.7)], [0.1, 0.08, 0.07], 'body', 8))
    obs.append(tube('leg', [(0, y * 0.16, 0.5), (0.04, y * 0.18, 0.12)], [0.12, 0.1], 'body', 8))
still(part('body', *obs))
export(__file__)
