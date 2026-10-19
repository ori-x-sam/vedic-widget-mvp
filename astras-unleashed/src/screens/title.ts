// Title bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import { use } from '../decl/engine';
import { CARDS, KSHETRAS, YUGAS } from '../content';
import { ui } from '../store';
import { screenUi } from './shared';
import titleKdl from './title.kdl?raw';
import titleCss from './title.css?raw';

export const titleUi = screenUi(titleKdl, titleCss);
if (import.meta.hot) import.meta.hot.accept(['./title.kdl?raw', './title.css?raw'], ([k, c]) => titleUi.reload(k?.default, c?.default));

export function drawTitle() {
  if (ui.getState().screen !== 'title') return titleUi.show(null);
  const ages = YUGAS.filter((y) => !y.overtime).length;
  titleUi.show(use('title', { count: `${Object.keys(CARDS).length} GODS · ${Object.keys(KSHETRAS).length} KSHETRAS · ${ages} AGES` }));
}
