# A chital doe, heavy with a fawn: spotted flanks (the paint does the dapple), a white rump, big ears. Facing +X.
# Metres. Materials: body the coat, trim the darker legs and back, glow the eyes.
from kit import *
body = lathe('body', [(0, 0), (0.2, 0.06), (0.26, 0.4), (0.27, 0.7), (0.2, 0.95), (0, 1.0)], 'body', 14)
deform(body, lambda v: Vector((v.x, v.y, v.z)) + Vector((0, 0, 0)))
obs = [aim(body, (1, 0, 0.05), (-0.45, 0, 0.8))]
obs.append(at(box('belly', (0.5, 0.36, 0.2), 'body', 0.09), (0.0, 0, 0.62)))
obs.append(tube('neck', [(0.45, 0, 0.9), (0.62, 0, 1.15), (0.68, 0, 1.25)], [0.09, 0.07, 0.07], 'body', 10))
head = ball('head', 0.09, 'body', 10, 8); deform(head, lambda v: Vector((v.x * 1.7, v.y, v.z))); obs.append(at(head, (0.78, 0, 1.25)))
for y in (0.05, -0.05):
    obs.append(at(ball('eye', 0.012, 'glow', 6, 4), (0.8, y * 1.2, 1.29)))
    obs.append(at(slab('ear', [(0, 0), (0.06, 0.02), (0.12, 0.0), (0.06, -0.02)], 0.01, 'body', 0.003), (0.68, y * 2.4, 1.33), (0, -40, y * 600)))
for x in (0.35, -0.35):
    for y in (0.1, -0.1): obs.append(tube('leg', [(x, y, 0.7), (x + 0.02, y, 0.35), (x, y, 0.0)], [0.045, 0.03, 0.02], 'trim', 6))
obs.append(at(cone('tail', 0.03, 0.0, 0.18, 'trim', 6), (-0.48, 0, 0.92), (0, -150, 0)))
body_part = part('body', *obs)
loop(body_part, 2.4, 1, 8, rot=(0, 0, 3))
export(__file__)
