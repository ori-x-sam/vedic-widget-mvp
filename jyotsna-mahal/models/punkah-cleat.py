# The punkah's rope where it comes down the wall: a teak cleat at hand height with the rope wound on it, running up
# to a pulley near the ceiling. Mounted on a wall, facing +X into the room. Metres. Materials: body the cleat, cloth
# the jute rope, trim the brass pulley.
from kit import *
obs = [at(box('cleat', (0.06, 0.22, 0.06), 'body', 0.01), (0.03, 0, 1.25))]
obs.append(at(box('back', (0.02, 0.1, 0.3), 'body', 0.005), (0.01, 0, 1.25)))
obs.append(tube('rope', [(0.07, 0.0, 1.0), (0.07, 0.02, 1.25), (0.06, 0.0, 3.6)], 0.012, 'cloth', 5))
obs.append(tube('loop', [(0.07, 0.0, 1.0), (0.12, 0.0, 0.85), (0.08, 0.0, 0.75)], 0.012, 'cloth', 5))
obs.append(at(torus('pulley', 0.05, 0.012, 'trim', 12, 4), (0.06, 0, 3.65), (0, 90, 0)))
still(part('body', *obs))
export(__file__)
