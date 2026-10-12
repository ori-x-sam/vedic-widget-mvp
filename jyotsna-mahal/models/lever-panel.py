# The dynamo's starting panel: a slate board with a great knife switch and a brass lever. Wall-mounted, face +X.
# Metres. Materials: body the iron frame, trim brass, glow the pilot lamp.
from kit import *
obs = [at(box('board', (0.05, 0.6, 0.9), 'body', 0.01), (0.03, 0, 1.3))]
obs.append(tube('lever', [(0.06, 0, 1.15), (0.25, 0, 1.45)], 0.02, 'trim', 6))
obs.append(at(ball('knob', 0.04, 'trim', 8, 6), (0.27, 0, 1.47)))
obs.append(at(ball('pilot', 0.025, 'glow', 6, 4), (0.07, 0.2, 1.65)))
still(part('body', *obs))
export(__file__)
