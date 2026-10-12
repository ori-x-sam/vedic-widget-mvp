# A tall bookcase of ledgers and law books, glass doors long gone. Against a wall, face +X. Metres. Materials: body
# teak, cloth the bindings, trim the paper edges.
from kit import *
obs = [at(box('case', (0.4, 1.4, 2.4), 'body', 0.02), (-0.05, 0, 1.2))]
for z in (0.25, 0.85, 1.45, 2.05):
    obs.append(at(box('shelf', (0.38, 1.3, 0.03), 'body', 0.005), (0.0, 0, z)))
    x = -0.6
    while x < 0.6:
        w = 0.05 + 0.04 * abs(math.sin(x * 37 + z * 11))
        obs.append(at(box('book', (0.28, w, 0.32 + 0.1 * abs(math.sin(x * 13 + z))), 'cloth' if int(x * 100) % 3 else 'trim', 0.005), (0.02, x + w / 2, z + 0.19)))
        x += w + 0.008
still(part('body', *obs))
export(__file__)
