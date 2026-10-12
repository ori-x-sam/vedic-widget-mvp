# The moondial on the roof: a marble disc on a pedestal, hour lines inlaid in brass, a brass gnomon. Metres; the
# gnomon points +X. Materials: body the marble, trim the brass, cloth the veined pedestal.
from kit import *
obs = [lathe('pedestal', [(0, 0), (0.3, 0), (0.3, 0.08), (0.16, 0.15), (0.13, 0.75), (0.25, 0.85), (0, 0.86)], 'cloth', 16)]
obs.append(at(cone('dial', 0.48, 0.48, 0.06, 'body', 28), (0, 0, 0.86)))
for i in range(13):
    a = math.radians(-90 + i * 15)
    obs.append(at(box('hour', (0.36, 0.012, 0.004), 'trim', 0.0), (0.24 * math.cos(a), 0.24 * math.sin(a), 0.922), (0, 0, math.degrees(a))))
obs.append(slab('gnomon', [(-0.05, 0), (0.4, 0), (-0.05, 0.3)], 0.015, 'trim', 0.0))
obs[-1].rotation_euler = (math.radians(90), 0, 0); obs[-1].location = (0, 0.008, 0.92)
still(part('body', *obs))
export(__file__)
