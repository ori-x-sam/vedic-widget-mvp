# The sal tree as the jungle draws it beyond fifty metres: the same tree (models/sal-tree.py), cut far more coarsely,
# since at that distance its leaf masses are a few pixels across. Metres. Materials: body the bark, cloth the leaves.
import kit
kit.MIN_SEG, kit.PATH_STEPS, kit.SEG_MUL = 8, 1, 0.75
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sal-tree.py')).read().replace('export(__file__)', 'export(' + repr(__file__) + ')'))
