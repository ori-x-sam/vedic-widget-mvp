# The lantern theatre's screen: a white sheet stretched in a teak frame, faces +X. 2.4 m wide. Metres. Materials:
# body the sheet, trim the frame.
from kit import *
obs = [at(box('sheet', (0.02, 2.4, 1.6), 'body', 0.0), (0, 0, 1.9))]
for z in (1.1, 2.7): obs.append(at(box('rail', (0.06, 2.6, 0.06), 'trim', 0.01), (0, 0, z)))
for y in (1.25, -1.25): obs.append(at(box('post', (0.06, 0.06, 2.8), 'trim', 0.01), (0, y, 1.4)))
still(part('body', *obs))
export(__file__)
