// The solver's report: `npm run sim`. Plays every night from the content alone, after every way its day can end,
// through the real rules, and prints what the designer needs: is it solvable, are there dead ends, how long is the
// critical path, how many threads converge on the deduction, and what nobody can reach.
import { dayOutcomes, solveNight } from '../src/solver';

const outcomes = dayOutcomes();
console.log(`Day 1 ends ${outcomes.length} distinct ways.`);
let bad = 0;
for (const o of outcomes) {
  if (o.s.phase !== 'night') { console.log(`  ${o.label}: ends the game (${o.s.ending})`); continue; }
  const r = solveNight(o.s, o.label);
  const ok = r.solvable && !r.deadEnds.length;
  if (!ok) bad++;
  console.log(`\nNight ${r.n}, ${r.name}, after: ${r.start}`);
  console.log(`  suspicion ${o.s.marks.suspicion}, regard ${o.s.marks.regard}, flags: ${o.s.flags.join(' ') || '-'}`);
  console.log(`  ${r.solvable ? 'SOLVABLE' : 'NOT SOLVABLE'}; ${r.states} states; ${r.deadEnds.length ? `${r.deadEnds.length}+ DEAD ENDS` : 'no dead ends'}`);
  console.log(`  critical path: ${r.critical.length} touches`);
  console.log(`  threads converging on the deduction: ${r.threads.length}: ${r.threads.map((t) => `[${t.join(', ')}]`).join(' ')}`);
  if (r.unreachedSpots.length) console.log(`  spots nothing happens at: ${r.unreachedSpots.join(', ')}`);
  if (r.unfoundClues.length) console.log(`  CLUES NOBODY CAN FIND: ${r.unfoundClues.join(', ')}`);
  for (const d of r.deadEnds) console.log(`  dead end: ${d.join(' > ')}`);
}
const last = outcomes.find((o) => o.s.phase === 'night');
if (last) console.log(`\nA critical path, after "${last.label}":\n  ${solveNight(last.s, last.label).critical.join('\n  ')}`);
if (bad) { console.log(`\n${bad} start(s) can't be finished.`); (globalThis as { process?: { exitCode: number } }).process!.exitCode = 1; }
