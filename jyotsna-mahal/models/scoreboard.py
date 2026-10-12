# A mahogany billiards scoreboard on the wall, the colours painted down its side. Face +X, middle 1.8 m up. Metres.
# Materials: body the board, cloth the ivory markers, trim the brass pointers.
from kit import *
obs = [at(box('board', (0.04, 0.6, 1.0), 'body', 0.01), (0.02, 0, 1.8))]
for i in range(7):
    obs.append(at(ball('ball', 0.025, 'cloth', 8, 6), (0.05, -0.2, 2.18 - i * 0.12)))
    obs.append(at(box('pointer', (0.01, 0.25, 0.015), 'trim', 0.0), (0.05, 0.08, 2.18 - i * 0.12)))
still(part('body', *obs))
export(__file__)
