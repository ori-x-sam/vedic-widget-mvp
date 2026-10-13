// Title bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import { game, ui } from '../store';
import { btn, screenUi } from './shared';
import titleKdl from './title.kdl?raw';
import titleCss from './title.css?raw';

export const titleUi = screenUi(titleKdl, titleCss);
if (import.meta.hot) import.meta.hot.accept(['./title.kdl?raw', './title.css?raw'], ([k, c]) => titleUi.reload(k?.default, c?.default));

export function drawTitle() {
  const { screen } = ui.getState(), { save } = game.getState();
  if (screen !== 'title') return titleUi.show(null);
  const buttons = [btn('Begin', () => Actions.begin(), 'primary')];
  if (save) buttons.push(btn(save.phase === 'night' ? `Night ${save.night?.n}, again` : 'Continue', () => Actions.resume()));
  buttons.push(btn('Chapters', () => Actions.openMenu(), '', 'chapters'));
  titleUi.show(use('title', {}, { buttons }));
}
