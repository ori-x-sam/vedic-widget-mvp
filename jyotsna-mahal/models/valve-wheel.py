# A red iron valve wheel on the steam pipe, wall-mounted, face +X, at 1.3 m. Metres. Materials: body the red wheel,
# trim the pipe.
from kit import *
obs = [tube('pipe', [(0.05, -0.6, 1.3), (0.05, 0.6, 1.3)], 0.05, 'trim', 10)]
obs.append(at(cone('stem', 0.03, 0.03, 0.15, 'trim', 8), (0.05, 0, 1.3), (0, 90, 0)))
obs.append(at(torus('wheel', 0.16, 0.022, 'body', 20, 5), (0.2, 0, 1.3), (0, 90, 0)))
for a in (0, 60, 120): obs.append(at(box('spoke', (0.02, 0.32, 0.02), 'body', 0.0), (0.2, 0, 1.3), (a, 0, 0)))
still(part('body', *obs))
export(__file__)
