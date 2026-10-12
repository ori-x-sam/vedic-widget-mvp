# A shelf of ledgers with the old Raja's register of skins open on top. Against a wall, face +X. Metres. Materials:
# body teak, cloth the ledgers' bindings, trim the open pages.
from kit import *
obs = [at(box('case', (0.35, 1.0, 1.0), 'body', 0.01), (-0.05, 0, 0.5))]
for z in (0.3, 0.65):
    for i in range(8): obs.append(at(box('ledger', (0.26, 0.09, 0.28), 'cloth', 0.01), (0.0, -0.4 + i * 0.11, z + 0.02)))
obs.append(at(box('book', (0.24, 0.36, 0.04), 'cloth', 0.01), (0.0, 0, 1.03), (0, -12, 0)))
for y in (0.09, -0.09): obs.append(at(box('page', (0.22, 0.16, 0.01), 'trim', 0.0), (0.0, y, 1.06), (0, -12, 0)))
still(part('body', *obs))
export(__file__)
