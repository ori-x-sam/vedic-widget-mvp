# The old Raja's portrait in his 1911 durbar dress: a gilt frame, a dark canvas, the figure a darker shape in purple.
# Hangs on a wall, face +X, centred 2.6 m up. Metres. Materials: body the canvas, trim the gilt, cloth the achkan.
from kit import *
H = 2.6
obs = [at(box('frame', (0.06, 1.15, 1.55), 'trim', 0.02), (0.03, 0, H))]
obs.append(at(box('canvas', (0.01, 0.98, 1.38), 'body', 0.0), (0.065, 0, H)))
obs.append(at(slab('figure', [(-0.25, -0.65), (0.25, -0.65), (0.22, 0.05), (0.12, 0.25), (0.06, 0.45), (-0.06, 0.45), (-0.12, 0.25), (-0.22, 0.05)], 0.004, 'cloth', 0.0), (0.072, 0, H - 0.05), (0, 90, 0)))
obs.append(at(ball('face', 0.09, 'trim', 8, 6), (0.075, 0, H + 0.48)))
still(part('body', *obs))
export(__file__)
