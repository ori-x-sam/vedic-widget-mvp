# A dry marble fountain in the middle of the zenana court: a lotus basin on a stepped base, dust where the water was.
# Metres. Materials: body the marble, trim the darker inlay.
from kit import *
obs = [lathe('base', [(0, 0), (0.9, 0), (0.9, 0.15), (0.75, 0.15), (0.75, 0.3), (0, 0.3)], 'body', 24)]
basin = lathe('basin', [(0, 0.3), (0.2, 0.3), (0.7, 0.55), (0.72, 0.62), (0.6, 0.6), (0, 0.45)], 'body', 24)
obs.append(basin)
for a in range(0, 360, 30): obs.append(at(ball('petal', 0.09, 'trim', 6, 4), (0.66 * math.cos(math.radians(a)), 0.66 * math.sin(math.radians(a)), 0.6)))
obs.append(lathe('spout', [(0, 0.45), (0.08, 0.45), (0.06, 0.9), (0.1, 0.95), (0, 1.0)], 'body', 10))
still(part('body', *obs))
export(__file__)
