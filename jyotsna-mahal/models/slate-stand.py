# A child's slate on a low reading stand in the zenana schoolroom. Faces +X. Metres. Materials: body the teak stand,
# cloth the slate, trim the chalk marks.
from kit import *
obs = [at(box('desk', (0.4, 0.7, 0.04), 'body', 0.01), (0, 0, 0.55), (0, -15, 0))]
for y in (0.3, -0.3): obs.append(at(box('leg', (0.04, 0.04, 0.55), 'body', 0.005), (0, y, 0.27)))
obs.append(at(box('slate', (0.02, 0.5, 0.35), 'cloth', 0.005), (0.02, 0, 0.7), (0, -60, 0)))
for i in range(5): obs.append(at(box('chalk', (0.004, 0.3, 0.015), 'trim', 0.0), (0.05, 0, 0.62 + i * 0.05), (0, -60, 0)))
still(part('body', *obs))
export(__file__)
