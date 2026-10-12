# The gaddi of Chandragarh: a low throne with a cusped back, gilt lions for arms, red velvet worn pink, and a
# footstool. Faces +X. Metres. Materials: body the velvet, trim the gilt, cloth the cushion.
from kit import *
obs = [at(box('dais', (1.6, 1.8, 0.25), 'trim', 0.03), (0, 0, 0.12))]
obs.append(at(box('seat', (0.8, 1.1, 0.25), 'body', 0.06), (0, 0, 0.5)))
back = slab('back', [(-0.55, 0), (0.55, 0), (0.55, 0.7), (0.3, 1.0), (0, 1.15), (-0.3, 1.0), (-0.55, 0.7)], 0.12, 'trim', 0.02)
obs.append(at(back, (-0.4, 0, 0.6), (90, 0, 90)))
for y in (0.55, -0.55): obs.append(at(ball('lion', 0.12, 'trim', 10, 8), (0.3, y, 0.78)))
obs.append(at(box('cushion', (0.6, 0.9, 0.12), 'cloth', 0.05), (0.02, 0, 0.68)))
obs.append(at(box('footstool', (0.35, 0.5, 0.18), 'body', 0.04), (0.65, 0, 0.34)))
still(part('body', *obs))
export(__file__)
