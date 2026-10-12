# The Raja's ice machine: an iron cabinet with a brass gauge and a wheel, the only one in the Orissa States. Faces +X.
# Metres. Materials: body iron, trim brass, cloth the maker's paper label.
from kit import *
obs = [at(box('cabinet', (0.9, 1.1, 1.6), 'body', 0.04), (0, 0, 0.8))]
obs.append(aim(cone('gauge', 0.12, 0.12, 0.04, 'trim', 16), (1, 0, 0), (0.45, 0.25, 1.3)))
obs.append(at(torus('wheel', 0.18, 0.02, 'trim', 20, 4), (0.47, -0.25, 1.0), (0, 90, 0)))
obs.append(at(box('label', (0.005, 0.3, 0.12), 'cloth', 0.0), (0.455, 0, 0.5)))
still(part('body', *obs))
export(__file__)
