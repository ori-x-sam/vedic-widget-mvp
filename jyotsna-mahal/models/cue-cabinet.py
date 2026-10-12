# A locked cue cabinet, four ivory balls set into its door as dials. Against a wall, face +X. Metres. Materials: body
# teak, trim the brass plate, cloth the ivory balls.
from kit import *
obs = [at(box('cabinet', (0.25, 0.7, 1.8), 'body', 0.02), (0, 0, 0.9))]
obs.append(at(box('plate', (0.01, 0.4, 0.08), 'trim', 0.003), (0.13, 0, 1.55)))
for i in range(4): obs.append(at(ball('dial', 0.035, 'cloth', 8, 6), (0.14, -0.21 + i * 0.14, 1.3)))
still(part('body', *obs))
export(__file__)
