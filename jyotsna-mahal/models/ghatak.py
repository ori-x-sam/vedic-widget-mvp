# Mr. Pitambar Ghatak, seated: chubby, a forked moustache, a cream suit, bare-headed and pleased about it. Metres;
# faces +X. Materials: body skin, cloth the suit, trim the hair and the moustache.
from kit import *
obs = figure(height=1.66, girth=0.2, belly=0.12, shoulders=0.21, head=0.115, seated=True, arms='lap')
# The fork: two points, waxed upward, the thing you see across a hall.
for side in (1, -1):
    obs.append(tube('fork', [(0.115, 0, 1.165), (0.13, side * 0.07, 1.16), (0.115, side * 0.15, 1.21)], [0.016, 0.012, 0.004], 'trim'))
# Spectacles, as befits a pamphleteer.
obs.append(at(torus('spectacles', 0.07, 0.006, 'trim', 16, 4), (0.12, 0, 1.22), (0, 90, 0)))
body = part('body', *obs)
loop(body, 2.7, 1, 8, loc=(0, 0, 0.006))
export(__file__)
