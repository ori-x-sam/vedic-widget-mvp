# A worn rug on the marble: deep red with an indigo border. Metres. Materials: body the field, cloth the border.
from kit import *
obs = [at(box('field', (2.0, 1.3, 0.012), 'body', 0.0), (0, 0, 0.006))]
for y in (0.7, -0.7): obs.append(at(box('border', (2.3, 0.12, 0.014), 'cloth', 0.0), (0, y, 0.007)))
for x in (1.08, -1.08): obs.append(at(box('border', (0.12, 1.5, 0.014), 'cloth', 0.0), (x, 0, 0.007)))
still(part('body', *obs))
export(__file__)
