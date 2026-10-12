# A marble bust of Mr. Gladstone on a short teak plinth, looking disappointed. Faces +X, standing on the Dewan's desk
# top at 0.78 m. Metres. Materials: body the marble, trim the plinth.
from kit import *
obs = [at(box('plinth', (0.18, 0.18, 0.12), 'trim', 0.01), (0, 0, 0.84))]
obs.append(lathe('chest', [(0, 0.9), (0.15, 0.9), (0.14, 1.0), (0.07, 1.08), (0, 1.1)], 'body', 14))
head = ball('head', 0.085, 'body', 12, 8); deform(head, lambda v: Vector((v.x, v.y * 0.9, v.z * 1.15))); obs.append(at(head, (0.01, 0, 1.18)))
for y in (0.05, -0.05): obs.append(tube('whisker', [(0.05, y, 1.13), (0.04, y * 1.6, 1.08)], 0.02, 'body', 6))
still(part('body', *obs))
export(__file__)
