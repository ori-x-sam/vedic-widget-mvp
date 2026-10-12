# The gardener's shed in the corner of the walled garden: planks, an iron hasp, pots and twine. Faces +X. Metres.
# Materials: body the planks, trim the iron, cloth the jute twine.
from kit import *
obs = [at(box('walls', (1.4, 1.6, 2.0), 'body', 0.02), (0, 0, 1.0))]
roof = slab('roof', [(-0.9, 0), (0.9, 0), (0.0, 0.5)], 1.8, 'body', 0.02); at(roof, (0, 0, 2.0), (90, 0, 90)); obs.append(roof)
obs.append(at(box('door', (0.03, 0.7, 1.7), 'body', 0.01), (0.71, 0, 0.88)))
obs.append(at(box('hasp', (0.02, 0.1, 0.03), 'trim', 0.005), (0.73, 0.28, 1.0)))
for y in (-0.5, -0.3): obs.append(at(lathe('pot', [(0, 0), (0.1, 0), (0.14, 0.2), (0, 0.2)], 'cloth', 10), (0.85, y, 0)))
still(part('body', *obs))
export(__file__)
