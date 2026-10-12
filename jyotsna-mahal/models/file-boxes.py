# Stacked file boxes on a low shelf, labels in the Dewan's hand. Faces +X. Metres. Materials: body the board, trim
# the labels.
from kit import *
obs = [at(box('shelf', (0.45, 1.2, 0.5), 'body', 0.01), (0, 0, 0.25))]
for i in range(6):
    obs.append(at(box('box', (0.38, 0.36, 0.3), 'body', 0.01), (0, -0.4 + (i % 3) * 0.4, 0.66 + (i // 3) * 0.31)))
    obs.append(at(box('label', (0.005, 0.12, 0.06), 'trim', 0.0), (0.19, -0.4 + (i % 3) * 0.4, 0.66 + (i // 3) * 0.31)))
still(part('body', *obs))
export(__file__)
