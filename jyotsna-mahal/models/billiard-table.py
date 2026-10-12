# A full-size billiard table on eight turned legs, a frame abandoned mid-game on the baize, a dust sheet turned back.
# Long side along +X. Metres. Materials: body the dark wood, cloth the baize, trim the ivory balls.
from kit import *
obs = [at(box('bed', (3.6, 1.8, 0.2), 'body', 0.03), (0, 0, 0.75))]
obs.append(at(box('baize', (3.4, 1.6, 0.02), 'cloth', 0.0), (0, 0, 0.86)))
for x in (1.7, 0.0, -1.7):
    for y in (0.82, -0.82): obs.append(at(lathe('leg', [(0, 0), (0.09, 0), (0.12, 0.2), (0.08, 0.4), (0.1, 0.62), (0, 0.65)], 'body', 10), (x, y, 0)))
import random
random.seed(4)
for i in range(10): obs.append(at(ball('red', 0.026, 'trim', 8, 6), (random.uniform(-1.4, 1.4), random.uniform(-0.7, 0.7), 0.895)))
obs.append(at(box('sheet', (0.6, 1.9, 0.05), 'trim', 0.02), (-1.6, 0, 0.9)))
still(part('body', *obs))
export(__file__)
