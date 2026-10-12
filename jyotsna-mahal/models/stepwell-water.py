# Black still water filling a stepwell's floor: a flat sheet with a faint bright ring where it meets the stone.
# Metres; centred, 5 by 5. Materials: body the water, glow the moon's sheen on it.
from kit import *
obs = [at(box('water', (5.2, 5.2, 0.04), 'body', 0.0), (0, 0, 0.02))]
obs.append(at(box('sheen', (1.2, 0.5, 0.01), 'glow', 0.0), (0.6, -0.8, 0.045), (0, 0, 20)))
still(part('body', *obs))
export(__file__)
