# Malati, Sudam's mother: sixty, tall, straight, in a white sari, ankle bells on, her hair loose and grey. Standing,
# facing +X. Metres. Materials: body skin, cloth the white sari, trim the grey hair, glow the silver ankle bells.
from kit import *
obs = figure(height=1.68, girth=0.14, shoulders=0.18, head=0.1, skirt=0.16, hat=None, arms='down')
obs.append(tube('pallu', [(0.04, 0.17, 1.38), (-0.12, 0.14, 1.15), (-0.2, 0.1, 0.65)], [0.05, 0.07, 0.09], 'cloth'))
obs.append(tube('hair', [(-0.04, 0, 1.6), (-0.12, 0, 1.4), (-0.13, 0, 1.15)], [0.08, 0.07, 0.05], 'trim'))
for y in (0.06, -0.06): obs.append(at(torus('bells', 0.05, 0.012, 'glow', 12, 4), (0.02, y, 0.08)))
body = part('body', *obs)
loop(body, 4.5, 1, 8, rot=(0, 0, 2))
export(__file__)
