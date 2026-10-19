// Balance sim: `npm run sim`. The match core arrives in Phase 3; until then this checks the content's sums the brief
// promises: the cost curve, the starter decks' averages and the Prana a player gets over regulation time.
import { CARDS, DECKS, YUGAS } from '../src/content';
import { T } from '../src/tuning';

const costs = Object.values(CARDS).map((c) => c.cost);
const curve = [...new Set(costs)].sort((a, b) => a - b).map((c) => `${c}:${costs.filter((x) => x === c).length}`).join(' ');
console.log(`pool of ${costs.length}: cost curve ${curve}, average ${(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2)}`);
for (const d of Object.values(DECKS)) console.log(`deck ${d.name}: average ${(d.cards.reduce((a, c) => a + CARDS[c]!.cost, 0) / d.cards.length).toFixed(2)}`);
const flow = YUGAS.filter((y) => !y.overtime).map((y) => (y.seconds / T.PRANA_EVERY_S) * y.prana);
console.log(`Prana over regulation: ${T.PRANA_START} + ${flow.map((f) => f.toFixed(1)).join(' + ')} = ${(T.PRANA_START + flow.reduce((a, b) => a + b, 0)).toFixed(1)}`);
