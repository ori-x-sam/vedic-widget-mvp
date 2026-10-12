# Mrs. Lilabati Sahukar, seated: slender, a pale sari with a hot pink border, a handkerchief always at the ready.
# Metres; faces +X. Materials: body skin, cloth the sari, trim the hair, glow the border (the handkerchief is the sari's white).
from kit import *
obs = figure(height=1.6, girth=0.14, shoulders=0.17, head=0.1, seated=True, skirt=0.12, hat='bun', arms='lap')
obs.append(tube('border', [(0.05, 0.15, 1.0), (-0.08, 0.16, 0.85), (-0.14, 0.13, 0.55)], [0.04, 0.055, 0.06], 'glow'))
# The handkerchief, raised to the cheek: about to faint.
obs.append(at(slab('handkerchief', [(-0.06, -0.06), (0.06, -0.05), (0.05, 0.07), (-0.05, 0.06)], 0.01, 'cloth', 0.004), (0.15, -0.12, 1.1), (70, 10, 0)))
obs.append(tube('arm-up', [(0.0, -0.17, 0.97), (0.1, -0.2, 0.85), (0.15, -0.13, 1.07)], [0.045, 0.04, 0.035], 'cloth'))
body = part('body', *obs)
loop(body, 1.6, 1, 8, rot=(0, 2, 0))
export(__file__)
