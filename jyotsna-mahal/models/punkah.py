# A punkah: a teak beam slung from the ceiling on two cords, a faded red cloth hanging from it, a fringe below. Its
# beam sits 3.3 m up (the spot's height); the cords run to the ceiling at 4.2 m. Metres; the beam runs along Y.
# Materials: body the beam, cloth the red cloth and fringe, trim the cords' brass hooks.
from kit import *
obs = [at(box('beam', (0.09, 2.1, 0.09), 'body', 0.015), (0, 0, 3.35))]
obs.append(at(box('cloth', (0.02, 2.0, 0.6), 'cloth', 0.005), (0, 0, 3.0)))
for i in range(40): obs.append(at(cone('fringe', 0.012, 0.004, 0.11, 'cloth', 4), (0, -0.97 + i * 0.05, 2.6), (180, 0, 0)))
for y in (0.8, -0.8):
    obs.append(tube('cord', [(0, y, 3.38), (0, y, 4.2)], 0.008, 'trim', 5))
    obs.append(at(torus('hook', 0.025, 0.006, 'trim', 10, 4), (0, y, 4.17), (90, 0, 0)))
still(part('body', *obs))
export(__file__)
