// The heads-up's bindings: store data in. Nothing else lives here (screen-imports.test.ts).
import { use } from '../decl/engine';
import { get, nightOf } from '../content';
import * as Game from '../game';
import { game, ui } from '../store';
import { screenUi } from './shared';
import hudKdl from './hud.kdl?raw';
import hudCss from './hud.css?raw';

export const hudUi = screenUi(hudKdl, hudCss);
if (import.meta.hot) import.meta.hot.accept(['./hud.kdl?raw', './hud.css?raw'], ([k, c]) => hudUi.reload(k?.default, c?.default));

const clock = (min: number) => { const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`; };

/** What E would do at a spot, in a few words. */
function promptFor(s: Game.GameState, spot: string, held: string | null): string {
  const sp = get('spot', spot);
  if (!Game.reachable(s, spot)) return sp.name;
  if (held) return `E  use ${get('item', held).name.replace(/^(A|The) /, 'the ').toLowerCase()} on ${sp.name}`;
  if (Game.dialsOf(s, spot)) return `E  ${sp.name}: the dials`;
  const hit = Game.beatFor(s, spot, ['look', 'hide', 'bed']);
  if (hit?.c.word === 'hide') return `E  hide: ${sp.name}`;
  if (hit?.c.word === 'bed') return `E  lie down`;
  return `E  ${sp.name}`;
}

/** Once the night's case is proved: where the night ends, kept on screen until he gets there. */
function goalFor(s: Game.GameState): string | undefined {
  if (!s.night || !s.flags.includes(nightOf(s.night.n).proves)) return undefined;
  const bed = Game.bedSpot(s.night.n);
  return bed ? `Case made. Now: ${get('spot', bed).name}` : undefined;
}

export function drawHud() {
  const u = ui.getState(), { run } = game.getState();
  if (u.screen !== 'play' || run.phase !== 'night' || run.talk || !run.night) return hudUi.show(null);
  const min = Game.watchMin(run.night);
  hudUi.show(use('hud', {
    alarm: u.alarm,
    watch: true, minutes: min, time: clock(min),
    goal: goalFor(run),
    dot: !u.casebook && !u.dials,
    toast: u.toast?.text, toastKey: `say${u.toast?.at ?? 0}`, toastKind: u.toast?.thought ? 'thought' : '',
    noted: undefined,
    // On a phone the pad's round button says what touching would do; the prompt only names the thing.
    prompt: u.target && !u.casebook && !u.dials ? (u.touch ? get('spot', u.target).name : promptFor(run, u.target, u.held)) : undefined,
    held: u.held ? `In hand: ${get('item', u.held).name}${u.touch ? '' : '   (R to put it away)'}` : '',
    keys: u.touch ? '' : `F photograph   Q ${run.night.candle ? 'snuff the candle' : 'light the candle'}   Tab casebook`,
  }));
}
