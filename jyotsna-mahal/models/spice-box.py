# A brass masala dabba as big as a hatbox, on a stool, padlocked with five little brass dials. Faces +X. Metres.
# Materials: body brass, trim the new brass dials, cloth the turmeric showing at the rim.
from kit import *
obs = [lathe('stool', [(0, 0), (0.22, 0), (0.18, 0.05), (0.06, 0.1), (0.06, 0.6), (0.2, 0.62), (0, 0.64)], 'body', 12)]
obs.append(lathe('dabba', [(0, 0.64), (0.28, 0.64), (0.29, 0.8), (0.27, 0.84), (0, 0.85)], 'body', 24))
obs.append(at(torus('rim', 0.26, 0.012, 'cloth', 24, 4), (0, 0, 0.84)))
for i in range(5): obs.append(aim(cone('dial', 0.025, 0.025, 0.02, 'trim', 10), (1, 0, 0), (0.29, -0.12 + i * 0.06, 0.72)))
still(part('body', *obs))
export(__file__)
