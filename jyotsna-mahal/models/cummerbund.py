# A crimson-and-gold silk cummerbund, torn, thrown over the back of a chair rail: a long folded sash hanging in two
# tails. Metres; along Y. Materials: body the silk, trim the gold border.
from kit import *
obs = [at(box('rail', (0.04, 0.9, 0.04), 'trim', 0.01), (0, 0, 1.0))]
obs.append(tube('sash', [(0.0, -0.3, 1.02), (0.05, -0.1, 0.7), (0.02, 0.0, 0.45)], 0.05, 'body'))
obs.append(tube('tail', [(0.0, 0.1, 1.02), (0.04, 0.2, 0.8), (0.03, 0.22, 0.6)], [0.05, 0.045, 0.035], 'body'))
obs.append(tube('border', [(0.0, -0.3, 1.06), (0.0, 0.1, 1.06)], 0.012, 'trim'))
still(part('body', *obs))
export(__file__)
