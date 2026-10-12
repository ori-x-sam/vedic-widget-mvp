# Bhima's tin trunk, painted green, a brass padlock on the hasp. Metres; length along +X, the lock on +X.
# Materials: body the green tin, trim the brass, cloth a paper label.
from kit import *
obs = [at(box('trunk', (0.75, 0.45, 0.38), 'body', 0.01), (0, 0, 0.2))]
obs.append(at(box('lid', (0.77, 0.47, 0.06), 'body', 0.01), (0, 0, 0.38)))
for y in (0.15, -0.15): obs.append(at(box('rib', (0.77, 0.03, 0.4), 'body', 0.005), (0, y, 0.2)))
obs.append(at(box('hasp', (0.02, 0.05, 0.1), 'trim', 0.005), (0.385, 0, 0.33)))
obs.append(at(box('padlock', (0.03, 0.06, 0.07), 'trim', 0.01), (0.4, 0, 0.27)))
obs.append(at(torus('shackle', 0.022, 0.006, 'trim', 12, 4), (0.4, 0, 0.31), (90, 0, 0)))
obs.append(at(box('label', (0.002, 0.14, 0.08), 'cloth', 0.0), (0.376, 0.16, 0.18)))
still(part('body', *obs))
export(__file__)
