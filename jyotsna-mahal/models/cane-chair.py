# A cane verandah chair: low, wide arms, a cushion. Facing +X, seat 0.45 m up. Metres. Materials: body the cane,
# cloth the cushion.
from kit import *
obs = [at(box('seat', (0.55, 0.6, 0.06), 'body', 0.02), (0.05, 0, 0.4))]
obs.append(at(box('cushion', (0.5, 0.55, 0.07), 'cloth', 0.03), (0.06, 0, 0.46)))
obs.append(at(box('back', (0.07, 0.6, 0.6), 'body', 0.02), (-0.25, 0, 0.72), (0, -12, 0)))
for y in (0.32, -0.32):
    obs.append(at(box('arm', (0.6, 0.06, 0.05), 'body', 0.02), (0.02, y, 0.62)))
    for x in (0.28, -0.22): obs.append(at(cone('leg', 0.025, 0.02, 0.62, 'body', 6), (x, y, 0)))
still(part('body', *obs))
export(__file__)
