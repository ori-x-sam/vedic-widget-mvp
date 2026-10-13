// The chapters menu's bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import { C, get } from '../content';
import { game, ui } from '../store';
import { btn, screenUi } from './shared';
import menuKdl from './menu.kdl?raw';
import menuCss from './menu.css?raw';

export const menuUi = screenUi(menuKdl, menuCss);
if (import.meta.hot) import.meta.hot.accept(['./menu.kdl?raw', './menu.css?raw'], ([k, c]) => menuUi.reload(k?.default, c?.default));

const nights = () => Object.values(C.night).sort((a, b) => a.n - b.n);
/** A day's name, from its first scene's title card ("Day 2 — The Shikar"). */
const dayName = (n: number) => Object.values(C.scene).find((s) => s.day === n && s.name?.startsWith(`Day ${n}`))?.name ?? `Day ${n}`;

export function drawMenu() {
  const u = ui.getState(), { run } = game.getState();
  if (!u.menu) {
    // The Menu button: while playing, when no card covers the game.
    const show = u.screen === 'play' && !u.card && run.phase !== 'end';
    return menuUi.show(show ? use('menu-button', { tap: () => Actions.openMenu() }) : null);
  }
  const days = nights().map((nt) => btn(dayName(nt.n), () => Actions.playChapter('day', nt.n), '', `day-${nt.n}`));
  const ns = nights().map((nt) => btn(`Night ${nt.n} — ${get('night', nt.id).name}`, () => Actions.playChapter('night', nt.n), '', `night-${nt.n}`));
  const actions = [
    ...(u.screen === 'play' ? [btn('Back to the game', () => Actions.closeMenu(), 'primary', 'back')] : [btn('Close', () => Actions.closeMenu(), 'primary', 'close')]),
    ...(u.screen === 'play' ? [btn('To the title', () => { Actions.closeMenu(); Actions.toTitle(); }, '', 'title')] : []),
  ];
  menuUi.show(use('menu', {}, { days, nights: ns, actions }));
}
