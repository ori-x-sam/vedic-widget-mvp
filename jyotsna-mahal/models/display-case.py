# A glass display case on teak legs: durbar medals on velvet, a cardboard tube at the back. Faces +X. Metres.
# Materials: body teak, glow the glass, trim the gilt medals, cloth the velvet.
from kit import *
obs = [at(box('stand', (0.6, 1.2, 0.8), 'body', 0.02), (0, 0, 0.4))]
obs.append(at(box('velvet', (0.56, 1.16, 0.02), 'cloth', 0.0), (0, 0, 0.81)))
for i in range(5): obs.append(at(cone('medal', 0.035, 0.035, 0.01, 'trim', 12), (0.1, -0.4 + i * 0.2, 0.83)))
obs.append(at(cone('tube', 0.035, 0.035, 0.25, 'cloth', 10), (-0.15, 0.3, 0.83), (0, 90, 0)))
glass = box('glass', (0.6, 1.2, 0.35), 'glow', 0.0); obs.append(at(glass, (0, 0, 1.0)))
still(part('body', *obs))
export(__file__)
