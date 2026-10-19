// The one impure boundary for state: every tap lands here and reaches the core through a namespace (`Meta.unlockKatha`),
// so the layer shows at the call site. Screens call these; they never write a store themselves.
import * as Meta from './meta';
import { game } from './store';

/** Open a god's Katha page (the first time its card is played). */
export function unlockKatha(god: string) {
  game.setState({ meta: Meta.unlockKatha(game.getState().meta, god) });
}
