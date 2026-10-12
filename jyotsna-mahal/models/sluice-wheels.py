# Three rusted iron sluice wheels in a row on the stepwell's lip, each on a threaded stem down into the stone.
# Metres; the wheels face +X, the row along Y. Materials: body the rust, trim the iron stems and frame.
from kit import *
obs = [at(box('frame', (0.25, 1.6, 0.12), 'trim', 0.02), (0, 0, 0.06))]
for i, y in enumerate((-0.55, 0, 0.55)):
    obs.append(at(cone('stem', 0.03, 0.03, 0.9, 'trim', 8), (0, y, 0.12)))
    obs.append(at(torus('wheel', 0.2, 0.02, 'body', 20, 5), (0, y, 0.85 + 0.05 * i)))
    for a in (0, 60, 120): obs.append(at(box('spoke', (0.4, 0.02, 0.02), 'body', 0.0), (0, y, 0.85 + 0.05 * i), (0, 0, a)))
still(part('body', *obs))
export(__file__)
