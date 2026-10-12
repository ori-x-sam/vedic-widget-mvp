# Mrs. Sarojini Ghatak, seated: thin, very upright, eyes closed as if the room smelled. A dark sari with a dark red
# border, her hair in a bun. Metres; faces +X. Materials: body skin, cloth the sari, trim the hair, glow the border.
from kit import *
obs = figure(height=1.56, girth=0.15, shoulders=0.18, head=0.1, seated=True, skirt=0.1, hat='bun', arms='lap')
# The sari's pallu over the left shoulder, falling behind.
obs.append(tube('pallu', [(0.05, 0.16, 1.0), (-0.1, 0.15, 0.85), (-0.16, 0.12, 0.55)], [0.05, 0.07, 0.08], 'glow'))
body = part('body', *obs)
loop(body, 3.6, 1, 8, loc=(0, 0, 0.004))
export(__file__)
