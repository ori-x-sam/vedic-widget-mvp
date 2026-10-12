# A brass chandelier gone dark: tiers of arms and crystal drops on a chain. Its hanging point is the origin; it hangs
# down from there, and its chain runs up 1.2 m to the ceiling. Metres. Materials: body and trim brass, glow the crystal.
from kit import *
obs = [tube('chain', [(0, 0, 0), (0, 0, 1.2)], 0.012, 'trim', 5)]
obs.append(lathe('stem', [(0, -1.0), (0.06, -0.95), (0.12, -0.7), (0.05, -0.55), (0.04, -0.1), (0, 0)], 'body', 12))
for tier, (r, z, n) in enumerate([(0.55, -0.75, 10), (0.35, -0.45, 8)]):
    obs.append(at(torus('ring', r, 0.015, 'body', 24, 4), (0, 0, z)))
    for i in range(n):
        a = i / n * math.tau
        obs.append(at(lathe('drop', [(0, 0), (0.025, 0.05), (0, 0.12)], 'glow', 6), (math.cos(a) * r, math.sin(a) * r, z - 0.16), (180, 0, 0)))
        obs.append(at(cone('candle', 0.012, 0.012, 0.08, 'trim', 6), (math.cos(a) * r, math.sin(a) * r, z + 0.01)))
still(part('body', *obs))
export(__file__)
