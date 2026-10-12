// The solver's report: `npm run sim`. Plays every night from the content alone, after every way its day can end,
// through the real rules, and prints what the designer needs: is it solvable, are there dead ends, how long is the
// critical path, how many threads converge on the deduction, and what nobody can reach.
import { campaign, solveNight } from '../src/solver';

let bad = 0;
for (const { n, starts } of campaign()) {
  console.log(`\n=== Night ${n}: its day ends ${starts.length} distinct way(s) ===`);
  const seen = new Set<string>();
  for (const o of starts) {
    const r = solveNight(o.s, o.label);
    const ok = r.solvable && !r.deadEnds.length;
    if (!ok) bad++;
    const line = `${r.solvable ? 'SOLVABLE' : 'NOT SOLVABLE'}; ${r.deadEnds.length ? `${r.deadEnds.length}+ DEAD ENDS` : 'no dead ends'}; critical path ${r.critical.length}; ${r.states} states; threads ${r.threads.length}`;
    if (seen.has(line) && ok) continue;
    seen.add(line);
    console.log(`  ${r.name}, after: ${o.label}`);
    console.log(`    ${line}: ${r.threads.map((t) => `[${t.join(', ')}]`).join(' ')}`);
    if (r.unreachedSpots.length) console.log(`    spots nothing happens at: ${r.unreachedSpots.join(', ')}`);
    if (r.unfoundClues.length) console.log(`    CLUES NOBODY CAN FIND: ${r.unfoundClues.join(', ')}`);
    for (const d of r.deadEnds) console.log(`    dead end: ${d.join(' > ')}`);
  }
  const first = starts[0];
  if (first) console.log(`  a critical path: ${solveNight(first.s, first.label).critical.join(' > ')}`);
}
if (bad) { console.log(`\n${bad} start(s) can't be finished.`); (globalThis as { process?: { exitCode: number } }).process!.exitCode = 1; }
