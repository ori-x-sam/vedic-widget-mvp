# A kitchen slate in a teak frame, chalked and never wiped, hanging on a nail. Face +X, middle 1.6 m up. Metres.
# Materials: body the slate, trim the frame, cloth the chalk.
from kit import *
obs = [at(box('slate', (0.02, 0.6, 0.45), 'body', 0.0), (0.012, 0, 1.6)), at(box('frame', (0.03, 0.66, 0.51), 'trim', 0.01), (0.005, 0, 1.6))]
for i in range(6): obs.append(at(box('chalk', (0.004, 0.4 - (i % 3) * 0.08, 0.018), 'cloth', 0.0), (0.024, -0.05, 1.75 - i * 0.06)))
still(part('body', *obs))
export(__file__)
