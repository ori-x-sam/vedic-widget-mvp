# Thistlewood's steamer trunk: canvas over wood, brass corners, two leather straps. Metres; length along +X.
# Materials: body the canvas, trim the brass, cloth the leather.
from kit import *
obs = [at(box('trunk', (0.95, 0.55, 0.5), 'body', 0.02), (0, 0, 0.27))]
obs.append(at(box('lid-line', (0.97, 0.57, 0.02), 'cloth', 0.005), (0, 0, 0.42)))
for x in (0.47, -0.47):
    for y in (0.27, -0.27):
        for z in (0.03, 0.5): obs.append(at(box('corner', (0.06, 0.06, 0.06), 'trim', 0.01), (x, y, z)))
for x in (0.25, -0.25): obs.append(at(box('strap', (0.06, 0.57, 0.52), 'cloth', 0.005), (x, 0, 0.27)))
obs.append(at(box('lock', (0.02, 0.08, 0.06), 'trim', 0.005), (0.48, 0, 0.4)))
obs.append(at(box('label', (0.002, 0.16, 0.1), 'trim', 0.0), (0.476, 0.14, 0.24)))
still(part('body', *obs))
export(__file__)
