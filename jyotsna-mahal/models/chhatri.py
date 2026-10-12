# A chhatri on the roof: a small domed pavilion on four pillars, its dome like an upturned cup. 3 m high. Metres.
# Materials: body the sandstone, trim the white marble dome and finial.
from kit import *
obs = [at(box('plinth', (1.6, 1.6, 0.2), 'body', 0.03), (0, 0, 0.1))]
for x in (0.6, -0.6):
    for y in (0.6, -0.6): obs.append(at(lathe('pillar', [(0, 0.2), (0.1, 0.2), (0.07, 0.4), (0.07, 1.8), (0.11, 1.95), (0, 1.95)], 'body', 10), (x, y, 0)))
obs.append(at(box('eave', (1.8, 1.8, 0.12), 'body', 0.04), (0, 0, 2.0)))
obs.append(lathe('dome', [(0, 2.06), (0.8, 2.06), (0.75, 2.4), (0.55, 2.7), (0.25, 2.88), (0, 2.92)], 'trim', 20))
obs.append(lathe('finial', [(0, 2.9), (0.07, 2.95), (0.03, 3.1), (0.06, 3.15), (0, 3.3)], 'trim', 8))
still(part('body', *obs))
export(__file__)
