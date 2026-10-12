# An oleograph calendar print on a nail: a goddess on a lotus holding a biscuit tin, the month still September.
# Hangs on a wall, face +X, its middle 1.7 m up. Metres. Materials: body the paper, cloth the bright print, trim the nail.
from kit import *
obs = [at(box('sheet', (0.006, 0.38, 0.55), 'body', 0.0), (0.004, 0, 1.68))]
obs.append(at(box('print', (0.004, 0.32, 0.32), 'cloth', 0.0), (0.009, 0, 1.78)))
for i in range(5): obs.append(at(box('dates', (0.004, 0.3, 0.02), 'trim', 0.0), (0.009, 0, 1.56 - i * 0.04)))
obs.append(at(ball('nail', 0.008, 'trim', 6, 4), (0.012, 0, 1.97)))
still(part('body', *obs))
export(__file__)
