// Card bindings: store data in. Nothing else lives here (screen-imports.test.ts).
import { use } from '../decl/engine';
import { ui } from '../store';
import { screenUi } from './shared';
import cardKdl from './card.kdl?raw';
import cardCss from './card.css?raw';

export const cardUi = screenUi(cardKdl, cardCss);
if (import.meta.hot) import.meta.hot.accept(['./card.kdl?raw', './card.css?raw'], ([k, c]) => cardUi.reload(k?.default, c?.default));

export function drawCard() {
  const u = ui.getState();
  if (u.screen !== 'play' || !u.card) return cardUi.show(null);
  cardUi.show(use('card', { kind: u.card.kind, title: u.card.title, sub: u.card.sub || undefined, text: u.card.text || undefined, more: u.touch ? 'tap to go on' : 'click, or any key' }));
}
