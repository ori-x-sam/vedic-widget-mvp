# Thistlewood's hands, built around his eye (the origin, looking +X): his right hand low on the right holding the
# folding camera, his left low on the left holding the candle stub in its brass dish. The candle's flame is its own
# part (`flame`), shown only while it is lit. Metres. Materials: body skin, cloth the linen cuffs, trim brass and the
# camera, glow the flame.
from kit import *
R = (0.42, -0.23, -0.3)
right = [tube('sleeve-r', [(R[0] - 0.32, R[1] - 0.06, R[2] - 0.12), (R[0] - 0.06, R[1], R[2] - 0.02)], [0.05, 0.042], 'cloth', 10)]
right.append(at(ball('hand-r', 0.045, 'body', 10, 8), (R[0], R[1], R[2])))
right.append(at(box('camera', (0.09, 0.15, 0.11), 'trim', 0.01), (R[0] + 0.04, R[1] + 0.06, R[2] + 0.03)))
right.append(aim(cone('lens', 0.035, 0.03, 0.06, 'trim', 12), (1, 0, 0), (R[0] + 0.08, R[1] + 0.06, R[2] + 0.03)))
L = (0.45, 0.24, -0.33)
left = [tube('sleeve-l', [(L[0] - 0.32, L[1] + 0.06, L[2] - 0.12), (L[0] - 0.06, L[1], L[2] - 0.02)], [0.05, 0.042], 'cloth', 10)]
left.append(at(ball('hand-l', 0.045, 'body', 10, 8), L))
left.append(at(lathe('dish', [(0, 0), (0.05, 0.0), (0.055, 0.015), (0.02, 0.012), (0, 0.012)], 'trim', 12), (L[0], L[1], L[2] + 0.03)))
left.append(at(cone('stub', 0.014, 0.013, 0.05, 'cloth', 8), (L[0], L[1], L[2] + 0.04)))
hands = part('hands', *right, *left)
flame = part('flame', at(lathe('flame', [(0, 0), (0.008, 0.008), (0.006, 0.022), (0, 0.035)], 'glow', 8), (L[0], L[1], L[2] + 0.092)), pivot=(L[0], L[1], L[2] + 0.092), parent=hands)
loop(hands, 2.0, 1, 8, loc=(0, 0, 0.004))
loop(flame, 0.4, 1, 6, scale=0.12)
export(__file__)
