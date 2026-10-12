# A side table under velvet, crowded with silver frames of men standing on dead animals. Faces +X. Metres. Materials:
# body teak, cloth the velvet, trim the silver frames.
from kit import *
obs = [at(box('top', (0.5, 0.85, 0.03), 'body', 0.01), (0, 0, 0.78))]
for x in (0.2, -0.2):
    for y in (0.37, -0.37): obs.append(at(box('leg', (0.04, 0.04, 0.77), 'body', 0.01), (x, y, 0.38)))
cloth = box('velvet', (0.54, 0.9, 0.18), 'cloth', 0.02); obs.append(at(cloth, (0, 0, 0.72)))
for i, (x, y, h) in enumerate([(-0.1, 0.3, 0.2), (0.05, 0.12, 0.16), (-0.12, -0.05, 0.24), (0.08, -0.22, 0.14), (-0.05, -0.35, 0.18), (0.12, 0.33, 0.12)]):
    obs.append(at(box('frame', (0.015, h * 0.8, h), 'trim', 0.004), (x, y, 0.8 + h / 2), (0, -12, (i - 2) * 9)))
still(part('body', *obs))
export(__file__)
