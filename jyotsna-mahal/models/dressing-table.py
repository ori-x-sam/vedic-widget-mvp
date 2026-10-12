# A dressing table against the wall: teak, brass handles, a tall mirror, the Raja's card propped against it.
# Faces +X. Metres. Materials: body teak, trim brass, glow the mirror's silver, cloth the card.
from kit import *
obs = [at(box('top', (0.45, 1.0, 0.04), 'body', 0.01), (0, 0, 0.76))]
for y in (0.45, -0.45):
    for x in (0.18, -0.18): obs.append(at(box('leg', (0.05, 0.05, 0.74), 'body', 0.01), (x, y, 0.37)))
obs.append(at(box('drawer', (0.42, 0.9, 0.14), 'body', 0.01), (0, 0, 0.66)))
for y in (0.25, -0.25): obs.append(at(ball('handle', 0.015, 'trim', 6, 4), (0.22, y, 0.66)))
obs.append(at(box('frame', (0.04, 0.6, 0.9), 'body', 0.01), (-0.18, 0, 1.25)))
obs.append(at(box('mirror', (0.01, 0.5, 0.78), 'glow', 0.0), (-0.155, 0, 1.25)))
obs.append(at(box('card', (0.005, 0.12, 0.16), 'cloth', 0.0), (-0.1, 0.15, 0.86), (0, -15, 0)))
still(part('body', *obs))
export(__file__)
