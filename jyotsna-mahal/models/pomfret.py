# Major Reginald Pomfret, the Political Agent, standing: tall, thin, a crumpled tropical suit, sparse grey hair, a
# swagger stick under one arm. Metres; faces +X. Materials: body skin, cloth the suit, trim the hair and the stick.
from kit import *
obs = figure(height=1.86, girth=0.16, belly=0.0, shoulders=0.22, head=0.105, hat=None, arms='down')
obs.append(tube('stick', [(0.15, -0.26, 1.15), (-0.2, -0.24, 0.95)], 0.012, 'trim'))
body = part('body', *obs)
loop(body, 3.6, 1, 8, rot=(0, 0, 1.2))
export(__file__)
