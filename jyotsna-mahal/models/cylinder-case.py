# A case of wax phonograph cylinders in cardboard tubes, labelled. Faces +X. Metres. Materials: body teak, cloth the
# brown wax, trim the paper labels.
from kit import *
obs = [at(box('case', (0.4, 0.9, 0.9), 'body', 0.02), (0, 0, 0.45))]
for z in (0.3, 0.6):
    for i in range(6): obs.append(at(cone('cylinder', 0.045, 0.045, 0.3, 'cloth', 10), (0.0, -0.33 + i * 0.13, z), (0, 90, 0)))
obs.append(at(box('label', (0.005, 0.5, 0.06), 'trim', 0.0), (0.205, 0, 0.82)))
still(part('body', *obs))
export(__file__)
