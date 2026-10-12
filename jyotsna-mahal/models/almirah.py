# An almirah: a tall teak wardrobe with two doors and brass handles. Faces +X. Metres. Materials: body teak, trim brass.
from kit import *
obs = [at(box('case', (0.55, 1.1, 2.0), 'body', 0.02), (0, 0, 1.02))]
obs.append(at(box('cornice', (0.62, 1.18, 0.09), 'body', 0.02), (0, 0, 2.06)))
obs.append(at(box('seam', (0.01, 0.01, 1.7), 'trim', 0.0), (0.28, 0, 1.05)))
for y in (0.06, -0.06): obs.append(at(box('handle', (0.03, 0.02, 0.12), 'trim', 0.005), (0.29, y, 1.1)))
for y in (0.5, -0.5): obs.append(at(box('foot', (0.06, 0.08, 0.04), 'body', 0.01), (0.2, y, 0.02)))
still(part('body', *obs))
export(__file__)
