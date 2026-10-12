# The toshakhana's iron safe: squat, black, a brass dial lock of four Odia numerals and a brass handle. Metres; the
# door faces +X. Materials: body the iron, trim the brass, cloth papers on top.
from kit import *
obs = [at(box('safe', (0.7, 0.8, 1.0), 'body', 0.03), (0, 0, 0.5))]
obs.append(at(box('door', (0.03, 0.66, 0.86), 'body', 0.01), (0.36, 0, 0.5)))
for i, y in enumerate((-0.18, -0.06, 0.06, 0.18)): obs.append(at(cone('dial', 0.045, 0.045, 0.03, 'trim', 14), (0.38, y, 0.66), (0, 90, 0)))
obs.append(at(box('handle', (0.05, 0.2, 0.04), 'trim', 0.01), (0.39, 0, 0.42)))
obs.append(at(box('papers', (0.3, 0.4, 0.03), 'cloth', 0.0), (-0.1, 0, 1.015), (0, 0, 8)))
still(part('body', *obs))
export(__file__)
