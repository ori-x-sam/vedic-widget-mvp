# A Sheesh Mahal mirror on a turning stand: a tall oval of silvered glass in a frame of silver flowers, on a carved
# post. Faces +X (the glass). Metres. Materials: body the frame and post, glow the glass, trim the brass pivot.
from kit import *
obs = [at(lathe('post', [(0, 0), (0.18, 0), (0.16, 0.06), (0.05, 0.12), (0.04, 0.7), (0.06, 0.75), (0, 0.78)], 'body', 12), (0, 0, 0))]
obs.append(at(cone('pivot', 0.05, 0.05, 0.08, 'trim', 10), (0, 0, 0.74)))
frame = torus('frame', 0.42, 0.045, 'body', 28, 6); deform(frame, lambda v: Vector((v.x, v.y, v.z * 1.4))); obs.append(at(frame, (0, 0, 1.25), (0, 90, 0)))
glass = cone('glass', 0.4, 0.4, 0.02, 'glow', 28); deform(glass, lambda v: Vector((v.x, v.y * 1.0, v.z))); at(glass, (0.0, 0, 0), (0, 90, 0))
deform(glass, lambda v: Vector((v.x, v.y, v.z * 1.4)))
obs.append(at(glass, (0, 0, 1.25)))
for a in range(0, 360, 45): obs.append(at(ball('flower', 0.04, 'body', 6, 4), (0, 0.42 * math.cos(math.radians(a)), 1.25 + 0.59 * math.sin(math.radians(a)))))
still(part('body', *obs))
export(__file__)
