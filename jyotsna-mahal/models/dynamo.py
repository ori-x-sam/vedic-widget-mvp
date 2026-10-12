# The Durbar Wing's dynamo: an iron engine on a brick bed, a flywheel taller than a man, a brass commutator, a
# leather belt run to the pulley. Faces +X. Metres. Materials: body iron, trim brass, cloth the belt, glow a spark.
from kit import *
obs = [at(box('bed', (2.4, 1.2, 0.4), 'body', 0.03), (0, 0, 0.2))]
obs.append(at(lathe('engine', [(0, -0.6), (0.4, -0.6), (0.45, -0.4), (0.45, 0.4), (0.4, 0.6), (0, 0.6)], 'body', 18), (-0.5, 0, 0.9), (90, 0, 0)))
obs.append(at(torus('flywheel', 0.85, 0.06, 'body', 32, 6), (0.6, 0.5, 1.0), (90, 0, 0)))
for a in range(0, 180, 30): obs.append(at(box('spoke', (1.7, 0.04, 0.05), 'body', 0.01), (0.6, 0.5, 1.0), (0, a, 0)))
obs.append(at(lathe('commutator', [(0, -0.2), (0.15, -0.2), (0.15, 0.2), (0, 0.2)], 'trim', 16), (-0.5, -0.7, 0.9), (90, 0, 0)))
obs.append(at(ball('spark', 0.03, 'glow', 6, 4), (-0.35, -0.85, 0.95)))
still(part('body', *obs))
export(__file__)
