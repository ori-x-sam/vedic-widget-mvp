# A fresco on the Sheesh Mahal's north wall: a broad painted panel in a cusped frame. It hangs flat on the wall, face
# +X, its middle 2.6 m up. Metres. Materials: body the painted plaster, cloth the painted figures, trim the frame.
from kit import *
H = 2.6
obs = [at(box('panel', (0.03, 2.4, 1.6), 'body', 0.0), (0.015, 0, H))]
obs.append(at(box('frame-top', (0.06, 2.6, 0.12), 'trim', 0.02), (0.03, 0, H + 0.86)))
obs.append(at(box('frame-bottom', (0.06, 2.6, 0.12), 'trim', 0.02), (0.03, 0, H - 0.86)))
for y in (1.25, -1.25): obs.append(at(box('frame-side', (0.06, 0.12, 1.84), 'trim', 0.02), (0.03, y, H)))
# The fire, the groom, the bride: three shapes in the paint.
obs.append(at(slab('fire', [(-0.12, 0), (0.12, 0), (0.04, 0.35), (0, 0.5), (-0.05, 0.3)], 0.005, 'cloth', 0.0), (0.033, 0, H - 0.6), (90, 0, 90)))
for y, h in ((0.55, 1.0), (-0.55, 0.9)):
    obs.append(at(slab('figure', [(-0.2, 0), (0.2, 0), (0.12, 0.7), (0.06, 0.8), (-0.06, 0.8), (-0.12, 0.7)], 0.005, 'cloth', 0.0), (0.033, y, H - 0.7), (90, 0, 90), (1, h, 1)))
still(part('body', *obs))
export(__file__)
