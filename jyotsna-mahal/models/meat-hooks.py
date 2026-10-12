# A rail of iron meat hooks across the larder ceiling, empty, one still swinging. Hangs from 3.3 m. Long along Y.
# Metres. Materials: body iron, trim the wooden rail.
from kit import *
obs = [at(box('rail', (0.08, 4.4, 0.08), 'trim', 0.01), (0, 0, 3.25))]
for y in (-1.6, -0.8, 0, 0.8, 1.6):
    obs.append(tube('hook', [(0, y, 3.2), (0, y, 2.6), (0.08, y, 2.5), (0.12, y, 2.6)], 0.012, 'body', 5))
body = part('body', *obs)
still(body)
export(__file__)
