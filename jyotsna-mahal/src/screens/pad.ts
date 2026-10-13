// The touch pad's bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import * as Game from '../game';
import { T } from '../tuning';
import { game, ui } from '../store';
import { screenUi } from './shared';
import padKdl from './pad.kdl?raw';
import padCss from './pad.css?raw';

export const padUi = screenUi(padKdl, padCss);
if (import.meta.hot) import.meta.hot.accept(['./pad.kdl?raw', './pad.css?raw'], ([k, c]) => padUi.reload(k?.default, c?.default));


/** The round button's word for what touching the spot under the eye would do. */
function verb(s: Game.GameState, spot: string | null, held: string | null): string {
  if (!spot || !Game.reachable(s, spot)) return held ? 'Use' : 'Touch';
  if (held) return 'Use';
  if (Game.dialsOf(s, spot)) return 'Dials';
  const hit = Game.beatFor(s, spot, ['look', 'hide', 'bed', 'talk']);
  return hit?.c.word === 'hide' ? 'Hide' : hit?.c.word === 'bed' ? 'Lie down' : hit?.c.word === 'talk' ? 'Talk' : 'Look';
}

const small = (key: string, label: string, tap: () => void, lit = false) => use('pad-small', { key, label, tap, lit: lit ? 1 : 0 });

export function drawPad() {
  const u = ui.getState(), { run } = game.getState();
  if (!u.touch || u.screen !== 'play' || run.phase !== 'night' || run.talk || !run.night || u.casebook || u.dials || u.card) return padUi.show(null);
  const st = u.stick, near = u.door ? true : !!u.target && Game.reachable(run, u.target);
  padUi.show(use('pad', {
    sx: st?.x ?? 0, sy: st?.y ?? 0, dx: st?.dx ?? 0, dy: st?.dy ?? 0, live: st ? 1 : 0, r: T.STICK_R_PX,
    use: () => Actions.touch(), useLabel: u.door ? (Game.canSwing(run, u.door) === 'close' ? 'Close' : 'Open') : verb(run, u.target, u.held), lit: near ? 1 : 0,
  }, {
    smalls: [
      ...(u.held ? [small('away', 'Put away', () => Actions.hold(null), true)] : []),
      small('photo', 'Photo', () => Actions.photograph()),
      small('candle', run.night.candle ? 'Snuff' : 'Candle', () => Actions.toggleCandle(), run.night.candle),
      small('book', 'Book', () => Actions.openCasebook()),
    ],
  }));
}
