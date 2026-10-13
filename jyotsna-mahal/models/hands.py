# Thistlewood's hands, built around his eye (the origin, looking +X): his right hand low on the right holding the
# folding camera, his left low on the left holding a small covered hand-lamp by its ring: a brass fount, a wire
# cage, a cap. The lamp's flame is its own part (`flame`), shown only while it is lit. Metres. Materials: body skin, cloth the linen cuffs, trim brass and the
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
B = (L[0], L[1], L[2] + 0.03)
left.append(at(lathe('fount', [(0, 0), (0.038, 0.0), (0.042, 0.018), (0.03, 0.03), (0, 0.03)], 'trim', 12), B))
for a in range(4):
    ang = a * math.pi / 2 + math.pi / 4
    left.append(tube('cage', [(B[0] + 0.028 * math.cos(ang), B[1] + 0.028 * math.sin(ang), B[2] + 0.03), (B[0] + 0.034 * math.cos(ang), B[1] + 0.034 * math.sin(ang), B[2] + 0.07), (B[0] + 0.024 * math.cos(ang), B[1] + 0.024 * math.sin(ang), B[2] + 0.11)], 0.0025, 'trim', 4))
left.append(at(lathe('cap', [(0, 0), (0.03, 0.0), (0.018, 0.02), (0, 0.022)], 'trim', 12), (B[0], B[1], B[2] + 0.11)))
left.append(at(torus('ring', 0.016, 0.003, 'trim', 12, 4), (B[0], B[1], B[2] + 0.14), (90, 0, 0)))
hands = part('hands', *right, *left)
flame = part('flame', at(lathe('flame', [(0, 0), (0.009, 0.01), (0.007, 0.025), (0, 0.04)], 'glow', 8), (L[0], L[1], L[2] + 0.065)), pivot=(L[0], L[1], L[2] + 0.065), parent=hands)
loop(hands, 2.0, 1, 8, loc=(0, 0, 0.004))
loop(flame, 0.4, 1, 6, scale=0.12)
export(__file__)
