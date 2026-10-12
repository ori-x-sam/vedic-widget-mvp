# The kitchen's great clay chulha: a long hearth with three fire mouths, cold tonight. Long side along Y. Metres.
# Materials: body the clay, trim the soot, glow an ember nobody raked out.
from kit import *
obs = [at(box('hearth', (0.9, 1.8, 0.7), 'body', 0.08), (0, 0, 0.35))]
for y in (-0.55, 0, 0.55):
    obs.append(at(box('mouth', (0.2, 0.3, 0.22), 'trim', 0.04), (0.38, y, 0.25)))
    obs.append(at(torus('ring', 0.17, 0.035, 'trim', 16, 4), (0, y, 0.72)))
obs.append(at(ball('ember', 0.03, 'glow', 6, 4), (0.4, 0.55, 0.18)))
still(part('body', *obs))
export(__file__)
