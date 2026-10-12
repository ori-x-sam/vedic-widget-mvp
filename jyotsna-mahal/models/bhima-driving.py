# Bhima at the wheel of the jeep: seated, both hands forward on the wheel. Metres; faces +X. Materials as bhima.py.
from kit import *
obs = figure(height=2.02, girth=0.2, belly=0.04, shoulders=0.29, head=0.12, seated=True, hat='turban', arms='wheel')
body = part('body', *obs)
loop(body, 1.1, 1, 8, loc=(0, 0, 0.01))
export(__file__)
