# The "man-eater of Chandragarh": a tiger stretched on a teak frame as if leaping, glass eyes, a proud snarl, and moth
# in the hide (the rough patches). Facing +X, leaping. Metres. Materials: body the orange fur, cloth the stripes, glow
# the eyes, trim the frame.
from kit import *
obs = []
# The frame: two trestles and a beam.
for x in (-0.6, 0.6):
    for y in (0.3, -0.3): obs.append(aim(cone('trestle', 0.035, 0.03, 0.75, 'trim', 6), (0, -y * 0.4, 1), (x, y, 0)))
    obs.append(at(box('cross', (0.08, 0.7, 0.06), 'trim', 0.01), (x, 0, 0.74)))
obs.append(at(box('beam', (1.5, 0.08, 0.06), 'trim', 0.01), (0, 0, 0.78)))
# The tiger: a long body, a big head, legs flung forward and back, a tail.
body = lathe('body', [(0, 0), (0.18, 0.05), (0.26, 0.4), (0.27, 0.9), (0.22, 1.35), (0.14, 1.55), (0, 1.6)], 'body', 16)
smooth(body, 1); rough(body, 0.018, 7, 4)
obs.append(aim(body, (1, 0, 0.12), (-0.85, 0, 1.0)))
head = ball('head', 0.24, 'body', 16, 10); deform(head, lambda v: Vector((v.x * 1.15, v.y * 1.05, v.z * 0.9))); rough(head, 0.012, 9, 5)
obs.append(at(head, (0.9, 0, 1.25)))
obs.append(at(ball('muzzle', 0.12, 'body', 10, 8), (1.1, 0, 1.18)))
obs.append(at(box('jaw', (0.18, 0.15, 0.04), 'cloth', 0.01), (1.08, 0, 1.06), (0, 28, 0)))
for y in (0.13, -0.13):
    obs.append(at(ball('eye', 0.025, 'glow', 6, 4), (1.06, y * 0.62, 1.32)))
    obs.append(at(cone('ear', 0.06, 0.0, 0.08, 'body', 6), (0.82, y * 1.2, 1.45), (0, -20, 0)))
    obs.append(tube('foreleg', [(0.5, y * 1.4, 1.05), (0.85, y * 1.5, 0.95), (1.15, y * 1.3, 0.9)], [0.09, 0.07, 0.06], 'body', 8))
    obs.append(tube('hindleg', [(-0.55, y * 1.4, 0.98), (-0.9, y * 1.5, 0.8), (-1.25, y * 1.4, 0.82)], [0.11, 0.08, 0.06], 'body', 8))
obs.append(tube('tail', [(-0.85, 0, 1.0), (-1.3, 0, 0.95), (-1.65, 0.12, 1.1), (-1.85, 0.1, 1.3)], [0.06, 0.05, 0.04, 0.03], 'body', 8))
for i in range(9):
    x = -0.7 + i * 0.17
    obs.append(at(torus('stripe', 0.25 - abs(x) * 0.03, 0.022, 'cloth', 16, 4), (x, 0, 1.03 + x * 0.12), (0, 90 + (i % 2) * 12, 0)))
still(part('body', *obs))
export(__file__)
