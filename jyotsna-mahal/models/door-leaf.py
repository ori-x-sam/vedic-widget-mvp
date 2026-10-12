# A closed guest-room door seen from the corridor: teak leaf in a sandstone-coloured frame, brass bolt and padlock.
# It stands on its wall's line; its face looks +X. 1.1 m wide, 2.4 m. Metres. Materials: body teak, trim brass.
from kit import *
obs = [at(box('leaf', (0.06, 1.1, 2.37), 'body', 0.01), (0, 0, 1.2))]
for z in (0.5, 1.2, 1.9): obs.append(at(box('panel', (0.02, 0.9, 0.5), 'body', 0.01), (0.035, 0, z)))
obs.append(at(box('bolt', (0.03, 0.18, 0.04), 'trim', 0.005), (0.05, -0.38, 1.1)))
obs.append(at(lathe('padlock', [(0, 0), (0.035, 0), (0.035, 0.06), (0, 0.065)], 'trim', 10), (0.07, -0.3, 1.02)))
still(part('body', *obs))
export(__file__)
