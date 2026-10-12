# An Edison phonograph on a stand: the cabinet, the mandrel, a brass horn like a lily. Faces +X. Metres. Materials:
# body teak, trim brass, cloth the wax on the mandrel.
from kit import *
obs = [at(box('stand', (0.5, 0.6, 0.75), 'body', 0.02), (0, 0, 0.37)), at(box('cabinet', (0.4, 0.5, 0.25), 'body', 0.02), (0, 0, 0.88))]
obs.append(at(cone('mandrel', 0.04, 0.04, 0.3, 'cloth', 12), (0.05, -0.15, 1.05), (90, 0, 0)))
horn = lathe('horn', [(0.02, 0), (0.04, 0.2), (0.1, 0.45), (0.25, 0.65), (0.38, 0.72)], 'trim', 20, caps=False)
obs.append(aim(horn, (0.6, 0, 0.8), (0.05, 0.1, 1.05)))
obs.append(at(lathe('governor', [(0, 0), (0.05, 0), (0.05, 0.02), (0, 0.02)], 'trim', 12), (0.21, 0.15, 0.88), (0, 90, 0)))
still(part('body', *obs))
export(__file__)
