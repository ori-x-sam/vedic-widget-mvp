// Dial-lock bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import { get } from '../content';
import * as Game from '../game';
import { game, ui } from '../store';
import { btn, screenUi } from './shared';
import dialsKdl from './dials.kdl?raw';
import dialsCss from './dials.css?raw';

export const dialsUi = screenUi(dialsKdl, dialsCss);
if (import.meta.hot) import.meta.hot.accept(['./dials.kdl?raw', './dials.css?raw'], ([k, c]) => dialsUi.reload(k?.default, c?.default));

export function drawDials() {
  const u = ui.getState(), { run } = game.getState();
  if (u.screen !== 'play' || !u.dials || u.card || run.talk) return dialsUi.show(null);
  const sp = get('spot', u.dials.spot), look = Game.beatFor(run, u.dials.spot, ['look']);
  dialsUi.show(use('dials', { name: sp.name.toUpperCase(), text: look?.c.text ?? '' }, {
    dials: u.dials.faces.map((f, i) => use('dial', { key: `dial-${i}`, face: f, up: () => Actions.turnDial(i, 1), down: () => Actions.turnDial(i, -1) })),
    buttons: [btn('Try the handle', () => Actions.tryDials(), 'primary'), btn('Step back', () => Actions.closeDials())],
  }));
}
