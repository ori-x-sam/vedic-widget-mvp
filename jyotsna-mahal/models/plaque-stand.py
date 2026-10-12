# A brass plaque on a short teak post, angled to be read: bright as a new anna. Faces +X. Metres. Materials: body the
# post, trim the new brass.
from kit import *
obs = [at(box('post', (0.08, 0.08, 0.55), 'body', 0.01), (0, 0, 0.28)), at(box('foot', (0.25, 0.25, 0.04), 'body', 0.01), (0, 0, 0.02))]
obs.append(at(box('board', (0.04, 0.34, 0.2), 'body', 0.01), (0.02, 0, 0.6), (0, -35, 0)))
obs.append(at(box('plaque', (0.01, 0.3, 0.16), 'trim', 0.003), (0.045, 0, 0.615), (0, -35, 0)))
still(part('body', *obs))
export(__file__)
