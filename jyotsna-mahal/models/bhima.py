# Bhima, the chowkidar, standing: old, enormous, silent; a white dhoti and kurta, a red turban, his lantern held low in
# his right hand as if showing the floor the way. Two metres tall. Metres; faces +X. Materials: body skin, cloth the
# dhoti and kurta, trim the turban and the lantern, glow the lantern's flame. The view lights the flame.
from kit import *
obs = figure(height=2.02, girth=0.2, belly=0.04, shoulders=0.29, head=0.12, skirt=0.06, hat='turban', arms='lantern')
# A long staff in his left hand.
obs.append(tube('lathi', [(0.12, 0.33, 0.02), (0.1, 0.34, 1.75)], 0.017, 'trim'))
body = part('body', *obs)
loop(body, 4.0, 1, 8, rot=(0, 0, 1.5))
export(__file__)
