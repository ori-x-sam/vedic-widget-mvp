# Raja Bhairab Narayan Singh Deo, seated: huge, perfumed, delighted with himself. Achkan, a safa with a jewel, a belly
# that arrives before he does. Metres; faces +X. Materials: body skin, cloth the achkan, trim the safa, glow the jewel.
from kit import *
obs = figure(height=1.78, girth=0.24, belly=0.17, shoulders=0.27, head=0.12, seated=True, skirt=0.08, hat='safa', arms='lap')
# The jewel on his safa, and a moustache like a pair of oars.
obs.append(at(ball('jewel', 0.025, 'glow', 8, 6), (0.12, 0, 1.39)))
obs.append(tube('moustache', [(0.125, 0.09, 1.22), (0.13, 0, 1.21), (0.125, -0.09, 1.22)], [0.012, 0.018, 0.012], 'trim'))
body = part('body', *obs)
loop(body, 3.2, 1, 8, loc=(0, 0, 0.008))
export(__file__)
