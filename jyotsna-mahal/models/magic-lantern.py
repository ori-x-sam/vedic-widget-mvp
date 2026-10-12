# A great brass magic lantern on a table, its electric arc lamp inside, a lens barrel pointing +X at the screen.
# Metres. Materials: body brass, trim iron, glow the arc's light.
from kit import *
obs = [at(box('table', (0.6, 0.6, 0.75), 'trim', 0.02), (0, 0, 0.37))]
obs.append(at(box('housing', (0.5, 0.35, 0.45), 'body', 0.03), (0, 0, 1.0)))
obs.append(at(cone('chimney', 0.07, 0.05, 0.25, 'body', 10), (-0.1, 0, 1.22)))
obs.append(aim(cone('barrel', 0.08, 0.07, 0.35, 'body', 14), (1, 0, 0), (0.25, 0, 1.0)))
obs.append(at(ball('arc', 0.05, 'glow', 8, 6), (0.62, 0, 1.0)))
obs.append(at(box('slides', (0.2, 0.15, 0.08), 'trim', 0.01), (0, -0.4, 0.8)))
still(part('body', *obs))
export(__file__)
