# The guest room's charpoy: a teak frame on turned legs, strung with jute, too short by a foot. Metres; long side along
# +X. Materials: body the teak, trim the legs' darker turnings, cloth the jute and the bedding.
from kit import *
obs = []
for x in (0.92, -0.92):
    for y in (0.42, -0.42):
        obs.append(at(lathe('leg', [(0, 0), (0.05, 0), (0.06, 0.1), (0.04, 0.2), (0.055, 0.32), (0.045, 0.45), (0, 0.46)], 'trim', 10), (x, y, 0)))
for y in (0.42, -0.42): obs.append(at(box('rail', (1.95, 0.07, 0.07), 'body', 0.01), (0, y, 0.42)))
for x in (0.95, -0.95): obs.append(at(box('end', (0.07, 0.9, 0.07), 'body', 0.01), (x, 0, 0.42)))
obs.append(at(box('webbing', (1.84, 0.8, 0.03), 'cloth', 0.01), (0, 0, 0.43)))
obs.append(at(box('pillow', (0.3, 0.6, 0.1), 'cloth', 0.05), (-0.75, 0, 0.5)))
obs.append(at(box('sheet', (0.5, 0.78, 0.04), 'cloth', 0.02), (0.55, 0, 0.465)))
still(part('body', *obs))
export(__file__)
