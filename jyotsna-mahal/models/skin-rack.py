# The storeroom's rack of old skins, hung like coats nobody will claim, with a gap where one was taken down lately.
# Against a wall, face +X. Metres. Materials: body teak, cloth the old skins, trim the brass hooks.
from kit import *
obs = []
for y in (1.2, -1.2): obs.append(at(box('post', (0.08, 0.08, 1.95), 'body', 0.01), (0, y, 0.97)))
obs.append(at(box('rail', (0.06, 2.5, 0.06), 'body', 0.01), (0.05, 0, 1.9)))
for i, y in enumerate((0.9, 0.35, -0.75)):
    obs.append(at(cone('hook', 0.01, 0.0, 0.06, 'trim', 5), (0.08, y, 1.85), (180, 0, 0)))
    sk = box('skin', (0.04, 0.5, 1.1), 'cloth', 0.02); smooth(sk, 2); rough(sk, 0.02, 4, i)
    deform(sk, lambda v, i=i: Vector((v.x + 0.03 * math.sin(v.z * 5 + i), v.y * (0.8 + 0.2 * (v.z + 0.55)), v.z)))
    obs.append(at(sk, (0.1, y, 1.25)))
# The gap at y = -0.2: a hook with nothing on it.
obs.append(at(cone('hook', 0.01, 0.0, 0.06, 'trim', 5), (0.08, -0.2, 1.85), (180, 0, 0)))
still(part('body', *obs))
export(__file__)
