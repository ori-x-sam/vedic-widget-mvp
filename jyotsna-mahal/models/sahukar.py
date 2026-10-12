# Mr. Dibakar Sahukar, seated: the timber contractor, broad, a brown suit, a sola topi, a cigar parked in the corner of
# his mouth. Metres; faces +X. Materials: body skin, cloth the suit, trim the topi, glow the cigar's end.
from kit import *
obs = figure(height=1.72, girth=0.21, belly=0.08, shoulders=0.25, head=0.11, seated=True, hat='topi', arms='lap')
obs.append(aim(cone('cigar', 0.012, 0.011, 0.11, 'trim', 6), (1, -0.4, -0.15), (0.11, -0.03, 1.17)))
obs.append(at(ball('cigar-end', 0.013, 'glow', 6, 4), (0.21, -0.07, 1.155)))
body = part('body', *obs)
loop(body, 2.2, 1, 8, loc=(0, 0, 0.007))
export(__file__)
