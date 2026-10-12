# A sandstone pillar: a square base, a fluted shaft, a cushion capital under a bracket. 4.6 m. Metres. Materials: body
# sandstone, trim the darker carved bands.
from kit import *
obs = [at(box('plinth', (0.5, 0.5, 0.35), 'body', 0.02), (0, 0, 0.17))]
obs.append(lathe('shaft', [(0, 0.35), (0.2, 0.35), (0.16, 0.6), (0.15, 3.5), (0.2, 3.8), (0.24, 3.95), (0, 3.95)], 'body', 16))
for z in (0.6, 1.8, 3.5): obs.append(at(torus('band', 0.16, 0.025, 'trim', 16, 4), (0, 0, z)))
obs.append(at(box('bracket', (0.6, 0.6, 0.25), 'trim', 0.03), (0, 0, 4.07)))
obs.append(at(box('abacus', (0.45, 0.45, 0.4), 'body', 0.02), (0, 0, 4.4)))
still(part('body', *obs))
export(__file__)
