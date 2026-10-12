# Kotwal's brass cage on a stand, Kotwal inside: a hill mynah, black, with a yellow wattle and an orange beak. Faces
# +X. Metres. Materials: body brass, cloth Kotwal's black feathers, glow his yellow wattle.
from kit import *
obs = [lathe('stand', [(0, 0), (0.2, 0), (0.18, 0.05), (0.03, 0.08), (0.025, 1.2), (0, 1.22)], 'body', 10)]
for a in range(0, 360, 30): obs.append(tube('bar', [(0.18 * math.cos(math.radians(a)), 0.18 * math.sin(math.radians(a)), 1.22), (0.18 * math.cos(math.radians(a)), 0.18 * math.sin(math.radians(a)), 1.62), (0, 0, 1.8)], 0.006, 'body', 4))
obs.append(at(torus('base-ring', 0.18, 0.012, 'body', 20, 4), (0, 0, 1.22)))
bird = ball('kotwal', 0.07, 'cloth', 10, 8); deform(bird, lambda v: Vector((v.x * 1.4, v.y, v.z))); obs.append(at(bird, (0, 0, 1.4)))
obs.append(at(ball('head', 0.045, 'cloth', 8, 6), (0.08, 0, 1.47)))
obs.append(at(ball('wattle', 0.02, 'glow', 6, 4), (0.1, 0.03, 1.45)))
obs.append(aim(cone('beak', 0.015, 0.0, 0.04, 'glow', 6), (1, 0, 0), (0.12, 0, 1.47)))
body = part('body', *obs)
loop(body, 1.4, 2, 6, rot=(0, 0, 2))
export(__file__)
