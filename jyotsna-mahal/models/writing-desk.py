# A writing desk with a sloped top, pigeonholes, and papers squared to the edge. Faces +X. Metres. Materials: body
# teak, trim brass, cloth the paper.
from kit import *
obs = [at(box('top', (0.6, 1.2, 0.04), 'body', 0.01), (0, 0, 0.76))]
for x in (0.26, -0.26):
    for y in (0.55, -0.55): obs.append(at(box('leg', (0.05, 0.05, 0.75), 'body', 0.01), (x, y, 0.37)))
obs.append(at(box('pigeonholes', (0.22, 1.1, 0.4), 'body', 0.01), (-0.2, 0, 0.98)))
for y in (-0.4, -0.13, 0.13, 0.4): obs.append(at(box('papers', (0.16, 0.2, 0.02), 'cloth', 0.0), (0.12, y, 0.79)))
obs.append(at(cone('inkwell', 0.03, 0.025, 0.05, 'trim', 8), (0.15, 0.5, 0.78)))
still(part('body', *obs))
export(__file__)
